import { Response, NextFunction } from 'express';
import { Customer } from '../models/Customer.js';
import { Vehicle } from '../models/Vehicle.js';
import { RepairOrder } from '../models/RepairOrder.js';
import { Invoice } from '../models/Invoice.js';
import { Estimate } from '../models/Estimate.js';
import { AuthRequest, recordAuditLog } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const getCustomers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, status, page = 1, limit = 25 } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (search) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { customerNumber: searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [customers, total] = await Promise.all([
      Customer.find(query)
        .populate('vehicles', 'year make model licensePlate vin currentMileage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Customer.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: customers,
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

export const getCustomerById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id).populate('vehicles');
    if (!customer) throw new AppError('Customer not found', 404);

    const [repairOrders, estimates, invoices] = await Promise.all([
      RepairOrder.find({ customer: customer._id })
        .populate('vehicle', 'year make model licensePlate')
        .sort({ createdAt: -1 }),
      Estimate.find({ customer: customer._id }).sort({ createdAt: -1 }),
      Invoice.find({ customer: customer._id }).sort({ createdAt: -1 }),
    ]);

    res.json({
      success: true,
      customer,
      repairOrders,
      estimates,
      invoices,
    });
  } catch (err) {
    next(err);
  }
};

export const createCustomer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, phone, email, address, notes, status } = req.body;

    if (!name || !phone) {
      throw new AppError('Customer name and phone number are required (SW-001).', 400);
    }

    const cleanedPhone = phone.trim();

    // Prevent duplicate customer records
    const existing = await Customer.findOne({
      phone: cleanedPhone,
      name: new RegExp(`^${name.trim()}$`, 'i'),
    });

    if (existing) {
      throw new AppError(
        `Customer profile already exists for "${name}" with phone ${phone} (Customer #: ${existing.customerNumber}).`,
        400
      );
    }

    const count = await Customer.countDocuments();
    const customerNumber = `CUST-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const customer = await Customer.create({
      customerNumber,
      name: name.trim(),
      phone: cleanedPhone,
      email: email?.trim()?.toLowerCase(),
      address: address || {},
      notes: notes?.trim(),
      status: status || 'active',
      registrationDate: new Date(),
    });

    await recordAuditLog(
      req,
      'CUSTOMER_CREATED',
      'Customer',
      customer._id.toString(),
      { customerNumber: customer.customerNumber, name: customer.name }
    );

    res.status(201).json({
      success: true,
      message: 'Customer profile registered successfully (SW-001).',
      customer,
    });
  } catch (err) {
    next(err);
  }
};

export const updateCustomer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, notes, status } = req.body;

    const customer = await Customer.findById(id);
    if (!customer) throw new AppError('Customer not found', 404);

    if (name) customer.name = name.trim();
    if (phone) customer.phone = phone.trim();
    if (email !== undefined) customer.email = email ? email.trim().toLowerCase() : undefined;
    if (address) customer.address = address;
    if (notes !== undefined) customer.notes = notes;
    if (status) customer.status = status;

    await customer.save();

    await recordAuditLog(
      req,
      'CUSTOMER_UPDATED',
      'Customer',
      customer._id.toString(),
      { customerNumber: customer.customerNumber }
    );

    res.json({
      success: true,
      message: 'Customer profile updated successfully.',
      customer,
    });
  } catch (err) {
    next(err);
  }
};
