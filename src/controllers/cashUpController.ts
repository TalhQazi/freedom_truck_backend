import { Response, NextFunction } from 'express';
import { DailyCashUp } from '../models/DailyCashUp.js';
import { Payment } from '../models/Payment.js';
import { Deposit } from '../models/Deposit.js';
import { PDFService } from '../services/pdfService.js';
import { AuthRequest, recordAuditLog } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const getDailyCashUps = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, date, page = 1, limit = 25 } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (date) query.businessDate = String(date);

    const skip = (Number(page) - 1) * Number(limit);
    const [cashUps, total] = await Promise.all([
      DailyCashUp.find(query)
        .populate('serviceWriter', 'name employeeId')
        .populate('managerReview.reviewedBy', 'name employeeId')
        .sort({ businessDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      DailyCashUp.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: cashUps,
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

export const getTodayCashSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Find any existing cash up for today
    const existing = await DailyCashUp.findOne({ businessDate: today });

    // Aggregate cash payments and cash deposits for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [cashPayments, cashDeposits] = await Promise.all([
      Payment.find({
        paymentMethod: 'CASH',
        processedAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      Deposit.find({
        paymentMethod: 'CASH',
        collectedAt: { $gte: startOfDay, $lte: endOfDay },
      }),
    ]);

    const totalCashPayments = cashPayments.reduce((acc, p) => acc + p.amount, 0);
    const totalCashDeposits = cashDeposits.reduce((acc, d) => acc + d.paidAmount, 0);
    const totalCashSales = Math.round((totalCashPayments + totalCashDeposits) * 100) / 100;

    res.json({
      success: true,
      businessDate: today,
      openingFloat: 100.0,
      systemCalculatedCashSales: totalCashSales,
      cashTransactionCount: cashPayments.length + cashDeposits.length,
      existingCashUp: existing,
    });
  } catch (err) {
    next(err);
  }
};

export const submitDailyCashUp = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      businessDate,
      openingFloat = 100.0,
      cashSales,
      cashRefunds = 0,
      paidOuts = 0,
      paidOutDetails = [],
      actualCountedCash,
      explanationOfVariance,
      employeeSignature,
    } = req.body;

    if (!businessDate || cashSales === undefined || actualCountedCash === undefined || !employeeSignature) {
      throw new AppError(
        'SOP SW-015: Business Date, Cash Sales, Actual Counted Cash, and Employee Signature are mandatory.',
        400
      );
    }

    const opFloat = Number(openingFloat);
    const cSales = Number(cashSales);
    const cRefunds = Number(cashRefunds);
    const pOuts = Number(paidOuts);
    const actualCash = Number(actualCountedCash);

    // SOP SW-015 Calculation Formulas
    const expectedCash = Math.round((opFloat + cSales - cRefunds - pOuts) * 100) / 100;
    const difference = Math.round((actualCash - expectedCash) * 100) / 100;

    // Closing drawer balance is strictly $100.00
    const closingDrawerBalance = 100.0;
    const cashRemovedForDeposit = Math.max(0, Math.round((actualCash - closingDrawerBalance) * 100) / 100);

    const hasDiscrepancy = Math.abs(difference) > 0.01;

    if (hasDiscrepancy && !explanationOfVariance) {
      throw new AppError(
        `SOP SW-015 Violation: A cash discrepancy of $${difference.toFixed(2)} was detected. An explanation of variance is required before submission.`,
        400
      );
    }

    const count = await DailyCashUp.countDocuments();
    const cashUpNumber = `CUP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const cashUp = await DailyCashUp.create({
      cashUpNumber,
      businessDate,
      serviceWriter: req.user!._id,
      serviceWriterName: req.user!.name,
      serviceWriterEmployeeId: req.user!.employeeId,
      openingFloat: opFloat,
      cashSales: cSales,
      cashRefunds: cRefunds,
      paidOuts: pOuts,
      paidOutDetails,
      expectedCash,
      actualCountedCash: actualCash,
      difference,
      cashRemovedForDeposit,
      closingDrawerBalance,
      explanationOfVariance,
      employeeSignature,
      employeeSignedAt: new Date(),
      requiresManagerReview: hasDiscrepancy,
      status: hasDiscrepancy ? 'DISCREPANCY_PENDING_REVIEW' : 'SUBMITTED',
    });

    await recordAuditLog(
      req,
      'DAILY_CASH_UP_SUBMITTED',
      'DailyCashUp',
      cashUp._id.toString(),
      {
        cashUpNumber: cashUp.cashUpNumber,
        businessDate,
        expectedCash,
        actualCountedCash: actualCash,
        difference,
        hasDiscrepancy,
      }
    );

    res.status(201).json({
      success: true,
      message: hasDiscrepancy
        ? `Daily Cash-Up submitted with variance of $${difference.toFixed(2)}. Escalated for Manager Review (SW-015).`
        : 'Daily Cash-Up reconciled successfully with exact $100.00 closing drawer balance (SW-015).',
      cashUp,
    });
  } catch (err) {
    next(err);
  }
};

export const managerReviewCashUp = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { decision, notes, managerSignature } = req.body;

    if (!['manager', 'admin'].includes(req.user!.role)) {
      throw new AppError('Only Managers or Administrators can perform Cash-Up review.', 403);
    }

    if (!decision || !['APPROVED', 'DISCREPANCY_ESCALATED', 'REJECTED'].includes(decision)) {
      throw new AppError('Valid review decision is required.', 400);
    }

    const cashUp = await DailyCashUp.findById(id);
    if (!cashUp) throw new AppError('Cash-Up record not found', 404);

    cashUp.managerReview = {
      reviewedBy: req.user!._id,
      managerName: req.user!.name,
      reviewedAt: new Date(),
      decision,
      notes,
      managerSignature,
    };

    if (decision === 'APPROVED') {
      cashUp.status = 'APPROVED';
    } else if (decision === 'DISCREPANCY_ESCALATED') {
      cashUp.status = 'DISCREPANCY_PENDING_REVIEW';
    } else {
      cashUp.status = 'DRAFT';
    }

    await cashUp.save();

    await recordAuditLog(
      req,
      'CASH_UP_MANAGER_REVIEW',
      'DailyCashUp',
      cashUp._id.toString(),
      {
        cashUpNumber: cashUp.cashUpNumber,
        decision,
        manager: req.user!.name,
      }
    );

    res.json({
      success: true,
      message: `Daily Cash-Up review decision '${decision}' recorded.`,
      cashUp,
    });
  } catch (err) {
    next(err);
  }
};

export const downloadCashUpPDF = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const cashUp = await DailyCashUp.findById(id).populate('serviceWriter');
    if (!cashUp) throw new AppError('Cash-Up record not found', 404);

    const pdfBuffer = await PDFService.generateCashUpPDF(cashUp);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="Freedom-CashUp-${cashUp.cashUpNumber}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};
