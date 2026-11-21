import { Response, NextFunction } from 'express';
import { Deposit } from '../models/Deposit.js';
import { RepairOrder } from '../models/RepairOrder.js';
import { Estimate } from '../models/Estimate.js';
import { AuthRequest, recordAuditLog } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const collectDeposit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      repairOrderId,
      paidAmount,
      paymentMethod,
      transactionReference,
      notes,
    } = req.body;

    if (!repairOrderId || !paidAmount || !paymentMethod) {
      throw new AppError(
        'SOP SW-008: Repair Order ID, Paid Amount, and Payment Method are required.',
        400
      );
    }

    const ro = await RepairOrder.findById(repairOrderId);
    if (!ro) throw new AppError('Repair Order not found', 404);

    if (!ro.currentEstimate) {
      throw new AppError('No associated Estimate found for this Repair Order.', 404);
    }

    const estimate = await Estimate.findById(ro.currentEstimate);
    if (!estimate) throw new AppError('Estimate not found', 404);

    const numericAmount = Number(paidAmount);
    if (numericAmount <= 0) {
      throw new AppError('Deposit amount must be greater than zero.', 400);
    }

    const count = await Deposit.countDocuments();
    const depositNumber = `DEP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const deposit = await Deposit.create({
      depositNumber,
      repairOrder: ro._id,
      estimate: estimate._id,
      customer: ro.customer,
      requiredAmount: estimate.depositRequired,
      paidAmount: numericAmount,
      paymentMethod,
      transactionReference: transactionReference?.trim(),
      collectedBy: req.user!._id,
      collectedAt: new Date(),
      status: 'PAID',
      notes,
    });

    estimate.depositMet = true;
    await estimate.save();

    ro.deposit = deposit._id as any;
    ro.status = 'DEPOSIT_PAID';
    ro.timeline.push({
      status: 'DEPOSIT_PAID',
      timestamp: new Date(),
      performedBy: req.user!._id,
      notes: `Collected 50% deposit of $${numericAmount.toFixed(2)} via ${paymentMethod} (#${deposit.depositNumber}) (SW-008).`,
    });
    await ro.save();

    await recordAuditLog(
      req,
      'DEPOSIT_COLLECTED',
      'Deposit',
      deposit._id.toString(),
      {
        depositNumber: deposit.depositNumber,
        roNumber: ro.roNumber,
        paidAmount: numericAmount,
        paymentMethod,
      }
    );

    res.status(201).json({
      success: true,
      message: `Deposit of $${numericAmount.toFixed(2)} recorded successfully (SW-008). Ready for dispatch.`,
      deposit,
      repairOrder: ro,
    });
  } catch (err) {
    next(err);
  }
};

export const getDepositsByRO = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { roId } = req.params;
    const deposits = await Deposit.find({ repairOrder: roId })
      .populate('collectedBy', 'name employeeId')
      .sort({ collectedAt: -1 });

    res.json({
      success: true,
      deposits,
    });
  } catch (err) {
    next(err);
  }
};
