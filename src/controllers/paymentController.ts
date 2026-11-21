import { Response, NextFunction } from 'express';
import { Payment } from '../models/Payment.js';
import { Invoice } from '../models/Invoice.js';
import { RepairOrder } from '../models/RepairOrder.js';
import { AuthRequest, recordAuditLog } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const processPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      invoiceId,
      amount,
      paymentMethod,
      referenceNumber,
      officeSignature,
      notes,
    } = req.body;

    if (!invoiceId || !amount || !paymentMethod) {
      throw new AppError(
        'SOP SW-012: Invoice ID, Payment Amount, and Payment Method are required.',
        400
      );
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw new AppError('Invoice not found', 404);

    const paymentAmount = Number(amount);
    if (paymentAmount <= 0) {
      throw new AppError('Payment amount must be greater than zero.', 400);
    }

    if (paymentAmount > invoice.balanceDue + 0.01) {
      throw new AppError(
        `Payment amount ($${paymentAmount.toFixed(2)}) cannot exceed balance due ($${invoice.balanceDue.toFixed(2)}).`,
        400
      );
    }

    const count = await Payment.countDocuments();
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    const receiptNumber = `REC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const payment = await Payment.create({
      paymentNumber,
      invoice: invoice._id,
      repairOrder: invoice.repairOrder,
      customer: invoice.customer,
      amount: paymentAmount,
      paymentMethod,
      referenceNumber: referenceNumber?.trim(),
      processedBy: req.user!._id,
      processedAt: new Date(),
      receiptNumber,
      officeReceiptSigned: Boolean(officeSignature),
      officeSignature,
      notes,
    });

    // Update Invoice balances
    invoice.amountPaid = Math.round((invoice.amountPaid + paymentAmount) * 100) / 100;
    invoice.balanceDue = Math.max(0, Math.round((invoice.totalAmount - invoice.depositCredit - invoice.amountPaid) * 100) / 100);

    if (invoice.balanceDue <= 0.01) {
      invoice.status = 'PAID';
      invoice.paidAt = new Date();
    } else {
      invoice.status = 'PARTIALLY_PAID';
    }
    await invoice.save();

    // Update Repair Order
    const ro = await RepairOrder.findById(invoice.repairOrder);
    if (ro) {
      if (invoice.status === 'PAID') {
        ro.status = 'PAID';
        ro.timeline.push({
          status: 'PAID',
          timestamp: new Date(),
          performedBy: req.user!._id,
          notes: `Full payment of $${paymentAmount.toFixed(2)} received via ${paymentMethod}. Receipt #${receiptNumber} generated (SW-012, SW-013).`,
        });
      } else {
        ro.timeline.push({
          status: ro.status,
          timestamp: new Date(),
          performedBy: req.user!._id,
          notes: `Partial payment of $${paymentAmount.toFixed(2)} received via ${paymentMethod}. Remaining: $${invoice.balanceDue.toFixed(2)}.`,
        });
      }
      await ro.save();
    }

    await recordAuditLog(
      req,
      'PAYMENT_RECORDED',
      'Payment',
      payment._id.toString(),
      {
        paymentNumber: payment.paymentNumber,
        receiptNumber: payment.receiptNumber,
        amount: paymentAmount,
        paymentMethod,
      }
    );

    res.status(201).json({
      success: true,
      message: `Payment of $${paymentAmount.toFixed(2)} processed successfully (SW-012). Customer and Office receipts ready (SW-013).`,
      payment,
      invoice,
    });
  } catch (err) {
    next(err);
  }
};

export const signOfficeReceipt = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const { signature } = req.body;

    if (!signature) {
      throw new AppError('SOP SW-013: Office signature is required for signed office receipt archival.', 400);
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) throw new AppError('Payment record not found', 404);

    payment.officeReceiptSigned = true;
    payment.officeSignature = signature;
    await payment.save();

    await recordAuditLog(
      req,
      'OFFICE_RECEIPT_SIGNED',
      'Payment',
      payment._id.toString(),
      { receiptNumber: payment.receiptNumber }
    );

    res.json({
      success: true,
      message: 'Office receipt signed and archived successfully (SW-013).',
      payment,
    });
  } catch (err) {
    next(err);
  }
};

export const getPaymentReceipt = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId)
      .populate('customer')
      .populate({
        path: 'invoice',
        populate: { path: 'vehicle' },
      })
      .populate('processedBy', 'name employeeId');

    if (!payment) throw new AppError('Payment not found', 404);

    res.json({
      success: true,
      payment,
    });
  } catch (err) {
    next(err);
  }
};
