import { Response, NextFunction } from 'express';
import { Estimate } from '../models/Estimate.js';
import { Customer } from '../models/Customer.js';
import { Vehicle } from '../models/Vehicle.js';
import { RepairOrder } from '../models/RepairOrder.js';
import { PricingService } from '../services/pricingService.js';
import { AuthRequest, recordAuditLog } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const getEstimates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, customerId, page = 1, limit = 25 } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (customerId) query.customer = customerId;

    const skip = (Number(page) - 1) * Number(limit);
    const [estimates, total] = await Promise.all([
      Estimate.find(query)
        .populate('customer', 'name phone email customerNumber')
        .populate('vehicle', 'year make model licensePlate vin currentMileage')
        .populate('createdBy', 'name employeeId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Estimate.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: estimates,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getEstimateById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const estimate = await Estimate.findById(id)
      .populate('customer')
      .populate('vehicle')
      .populate('repairOrder')
      .populate('createdBy', 'name employeeId');

    if (!estimate) throw new AppError('Estimate not found', 404);

    res.json({
      success: true,
      estimate,
    });
  } catch (err) {
    next(err);
  }
};

export const createEstimate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      customer,
      vehicle,
      mileageIn,
      customerComplaint,
      requestedServices,
      lineItems = [],
      taxRate,
      discount,
      notes,
    } = req.body;

    if (!customer || !vehicle || mileageIn === undefined || !customerComplaint) {
      throw new AppError(
        'SOP SW-003: Customer, Vehicle, Mileage In, and Customer Complaint are required.',
        400
      );
    }

    const [customerObj, vehicleObj] = await Promise.all([
      Customer.findById(customer),
      Vehicle.findById(vehicle),
    ]);

    if (!customerObj) throw new AppError('Customer not found', 404);
    if (!vehicleObj) throw new AppError('Vehicle not found', 404);

    // Update vehicle mileage if higher
    if (Number(mileageIn) > vehicleObj.currentMileage) {
      vehicleObj.previousMileage = vehicleObj.currentMileage;
      vehicleObj.currentMileage = Number(mileageIn);
      await vehicleObj.save();
    }

    // Process pricing via PricingService (SW-004 matrix & SW-005 tire rule)
    const calculated = await PricingService.calculateEstimateTotals(
      lineItems,
      taxRate,
      discount
    );

    const count = await Estimate.countDocuments();
    const estimateNumber = `EST-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const estimate = await Estimate.create({
      estimateNumber,
      version: 1,
      customer,
      vehicle,
      mileageIn: Number(mileageIn),
      customerComplaint: customerComplaint.trim(),
      requestedServices: Array.isArray(requestedServices) ? requestedServices : [],
      lineItems: calculated.lineItems,
      partsTotal: calculated.partsTotal,
      tiresTotal: calculated.tiresTotal,
      laborTotal: calculated.laborTotal,
      shopSupplies: calculated.shopSupplies,
      subtotal: calculated.subtotal,
      taxRate: calculated.taxRate,
      taxAmount: calculated.taxAmount,
      discount: calculated.discount,
      grandTotal: calculated.grandTotal,
      depositRequired: calculated.depositRequired,
      depositMet: false,
      status: 'PENDING_APPROVAL',
      createdBy: req.user!._id,
      notes,
    });

    await recordAuditLog(
      req,
      'ESTIMATE_CREATED',
      'Estimate',
      estimate._id.toString(),
      {
        estimateNumber: estimate.estimateNumber,
        grandTotal: estimate.grandTotal,
        depositRequired: estimate.depositRequired,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Estimate created with company markup and tire pricing applied (SW-003, SW-004, SW-005).',
      estimate,
    });
  } catch (err) {
    next(err);
  }
};

export const reviseEstimate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { lineItems, taxRate, discount, notes, customerComplaint, requestedServices } = req.body;

    const estimate = await Estimate.findById(id);
    if (!estimate) throw new AppError('Estimate not found', 404);

    const calculated = await PricingService.calculateEstimateTotals(
      lineItems || estimate.lineItems,
      taxRate ?? estimate.taxRate,
      discount ?? estimate.discount
    );

    estimate.version += 1;
    estimate.lineItems = calculated.lineItems;
    estimate.partsTotal = calculated.partsTotal;
    estimate.tiresTotal = calculated.tiresTotal;
    estimate.laborTotal = calculated.laborTotal;
    estimate.shopSupplies = calculated.shopSupplies;
    estimate.subtotal = calculated.subtotal;
    estimate.taxRate = calculated.taxRate;
    estimate.taxAmount = calculated.taxAmount;
    estimate.discount = calculated.discount;
    estimate.grandTotal = calculated.grandTotal;
    estimate.depositRequired = calculated.depositRequired;
    estimate.status = 'REVISED';
    if (customerComplaint) estimate.customerComplaint = customerComplaint;
    if (requestedServices) estimate.requestedServices = requestedServices;
    if (notes) estimate.notes = notes;

    await estimate.save();

    await recordAuditLog(
      req,
      'ESTIMATE_REVISED',
      'Estimate',
      estimate._id.toString(),
      {
        estimateNumber: estimate.estimateNumber,
        version: estimate.version,
        grandTotal: estimate.grandTotal,
      }
    );

    res.json({
      success: true,
      message: `Estimate revised to version ${estimate.version}.`,
      estimate,
    });
  } catch (err) {
    next(err);
  }
};

export const convertEstimateToRO = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const estimate = await Estimate.findById(id);
    if (!estimate) throw new AppError('Estimate not found', 404);

    if (estimate.status !== 'APPROVED') {
      throw new AppError(
        'SOP SW-006: Only an approved estimate with customer authorization can be converted into a Repair Order.',
        400
      );
    }

    if (estimate.repairOrder) {
      throw new AppError('Estimate is already linked to a Repair Order.', 400);
    }

    const count = await RepairOrder.countDocuments();
    const roNumber = `RO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const ro = await RepairOrder.create({
      roNumber,
      customer: estimate.customer,
      vehicle: estimate.vehicle,
      mileageIn: estimate.mileageIn,
      customerComplaint: estimate.customerComplaint,
      requestedServices: estimate.requestedServices,
      currentEstimate: estimate._id,
      status: estimate.depositRequired > 0 ? 'DEPOSIT_REQUIRED' : 'AUTHORIZED',
      serviceWriter: req.user!._id,
      timeline: [
        {
          status: estimate.depositRequired > 0 ? 'DEPOSIT_REQUIRED' : 'AUTHORIZED',
          timestamp: new Date(),
          performedBy: req.user!._id,
          notes: `Converted from approved Estimate #${estimate.estimateNumber} (SW-006).`,
        },
      ],
    });

    estimate.repairOrder = ro._id as any;
    await estimate.save();

    await recordAuditLog(
      req,
      'REPAIR_ORDER_CONVERTED_FROM_ESTIMATE',
      'RepairOrder',
      ro._id.toString(),
      { roNumber: ro.roNumber, estimateNumber: estimate.estimateNumber }
    );

    res.status(201).json({
      success: true,
      message: `Repair Order #${ro.roNumber} created from estimate (SW-006).`,
      repairOrder: ro,
    });
  } catch (err) {
    next(err);
  }
};
