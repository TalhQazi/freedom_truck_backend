import { Response, NextFunction } from 'express';
import { Vehicle } from '../models/Vehicle.js';
import { Customer } from '../models/Customer.js';
import { RepairOrder } from '../models/RepairOrder.js';
import { TechnicianWorksheet } from '../models/TechnicianWorksheet.js';
import { AuthRequest, recordAuditLog } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const getVehicles = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, customerId, page = 1, limit = 25 } = req.query;

    const query: any = {};
    if (customerId) query.customer = customerId;
    if (search) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      query.$or = [
        { licensePlate: searchRegex },
        { vin: searchRegex },
        { make: searchRegex },
        { model: searchRegex },
        { unitNumber: searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [vehicles, total] = await Promise.all([
      Vehicle.find(query)
        .populate('customer', 'name phone email customerNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Vehicle.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: vehicles,
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

export const getVehicleById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findById(id).populate('customer');
    if (!vehicle) throw new AppError('Vehicle not found', 404);

    const [repairOrders, worksheets] = await Promise.all([
      RepairOrder.find({ vehicle: vehicle._id })
        .populate('serviceWriter', 'name employeeId')
        .populate('assignedTechnician', 'name employeeId')
        .sort({ createdAt: -1 }),
      TechnicianWorksheet.find({ vehicle: vehicle._id })
        .populate('initialSignoff.technician', 'name employeeId')
        .populate('qcInspection.qcTechnician', 'name employeeId')
        .sort({ createdAt: -1 }),
    ]);

    res.json({
      success: true,
      vehicle,
      repairOrders,
      worksheets,
    });
  } catch (err) {
    next(err);
  }
};

export const createVehicle = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      customer,
      vin,
      licensePlate,
      year,
      make,
      model,
      subModel,
      engine,
      color,
      currentMileage,
      unitNumber,
      registrationDetails,
      outstandingIssues,
    } = req.body;

    if (!customer || !vin || !licensePlate || !year || !make || !model || currentMileage === undefined) {
      throw new AppError(
        'SOP SW-002: Customer, VIN, License Plate, Year, Make, Model, and Current Mileage are required.',
        400
      );
    }

    const cleanVin = vin.toUpperCase().trim();
    const cleanPlate = licensePlate.toUpperCase().trim();

    // Check VIN uniqueness
    const existingVin = await Vehicle.findOne({ vin: cleanVin });
    if (existingVin) {
      throw new AppError(
        `A vehicle with VIN '${cleanVin}' already exists in the system (Plate: ${existingVin.licensePlate}).`,
        400
      );
    }

    const customerObj = await Customer.findById(customer);
    if (!customerObj) throw new AppError('Customer profile not found.', 404);

    const vehicle = await Vehicle.create({
      customer,
      vin: cleanVin,
      licensePlate: cleanPlate,
      year: Number(year),
      make: make.trim(),
      model: model.trim(),
      subModel: subModel?.trim(),
      engine: engine?.trim(),
      color: color?.trim(),
      currentMileage: Number(currentMileage),
      previousMileage: Number(currentMileage),
      unitNumber: unitNumber?.trim(),
      registrationDetails: registrationDetails || {},
      outstandingIssues: Array.isArray(outstandingIssues) ? outstandingIssues : [],
    });

    // Add vehicle to customer
    customerObj.vehicles.push(vehicle._id as any);
    await customerObj.save();

    await recordAuditLog(
      req,
      'VEHICLE_REGISTERED',
      'Vehicle',
      vehicle._id.toString(),
      { vin: cleanVin, licensePlate: cleanPlate, customer: customerObj.name }
    );

    res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully (SW-002).',
      vehicle,
    });
  } catch (err) {
    next(err);
  }
};

export const updateVehicle = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      licensePlate,
      currentMileage,
      subModel,
      engine,
      color,
      unitNumber,
      registrationDetails,
      outstandingIssues,
    } = req.body;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) throw new AppError('Vehicle not found', 404);

    if (currentMileage !== undefined) {
      const newMileage = Number(currentMileage);
      if (newMileage < vehicle.currentMileage) {
        throw new AppError(
          `Mileage cannot decrease from previous recorded mileage of ${vehicle.currentMileage} miles.`,
          400
        );
      }
      vehicle.previousMileage = vehicle.currentMileage;
      vehicle.currentMileage = newMileage;
    }

    if (licensePlate) vehicle.licensePlate = licensePlate.toUpperCase().trim();
    if (subModel !== undefined) vehicle.subModel = subModel.trim();
    if (engine !== undefined) vehicle.engine = engine.trim();
    if (color !== undefined) vehicle.color = color.trim();
    if (unitNumber !== undefined) vehicle.unitNumber = unitNumber.trim();
    if (registrationDetails) vehicle.registrationDetails = registrationDetails;
    if (outstandingIssues) vehicle.outstandingIssues = outstandingIssues;

    await vehicle.save();

    await recordAuditLog(
      req,
      'VEHICLE_UPDATED',
      'Vehicle',
      vehicle._id.toString(),
      { currentMileage: vehicle.currentMileage, licensePlate: vehicle.licensePlate }
    );

    res.json({
      success: true,
      message: 'Vehicle record updated successfully.',
      vehicle,
    });
  } catch (err) {
    next(err);
  }
};
