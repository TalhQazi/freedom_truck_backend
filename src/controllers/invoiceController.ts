import { Response, NextFunction } from 'express';
import { Invoice } from '../models/Invoice.js';
import { RepairOrder } from '../models/RepairOrder.js';
import { Estimate } from '../models/Estimate.js';
import { Deposit } from '../models/Deposit.js';
import { PDFService } from '../services/pdfService.js';
import { AuthRequest, recordAuditLog } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const getInvoices = async (
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
    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('customer', 'name phone email customerNumber')
        .populate('vehicle', 'year make model licensePlate vin currentMileage')
        .populate('repairOrder', 'roNumber status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Invoice.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: invoices,
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

export const getInvoiceById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id)
      .populate('customer')
      .populate('vehicle')
      .populate('repairOrder')
      .populate('createdBy', 'name employeeId');

    if (!invoice) throw new AppError('Invoice not found', 404);

    res.json({
      success: true,
      invoice,
    });
  } catch (err) {
    next(err);
  }
};

export const createInvoiceFromRO = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { roId } = req.params;
    const ro = await RepairOrder.findById(roId)
      .populate('customer')
      .populate('vehicle')
      .populate('currentEstimate')
      .populate('deposit');

    if (!ro) throw new AppError('Repair Order not found', 404);

    if (ro.invoice) {
      const existing = await Invoice.findById(ro.invoice);
      if (existing) {
        res.json({
          success: true,
          message: 'Invoice already generated for this repair order.',
          invoice: existing,
        });
        return;
      }
    }

    const estimate: any = ro.currentEstimate;
    if (!estimate) {
      throw new AppError('Cannot generate invoice: No approved estimate associated with RO.', 400);
    }

    // Convert estimate line items into invoice line items
    const lineItems = (estimate.lineItems || []).map((item: any) => ({
      itemType: item.itemType,
      description: item.description,
      partNumber: item.partNumber,
      quantity: item.quantity,
      unitPrice: item.sellingPrice || item.laborRatePerHour || 0,
      subtotal: item.subtotal,
    }));

    const depositCredit = ro.deposit ? (ro.deposit as any).paidAmount : 0;
    const totalAmount = estimate.grandTotal;
    const balanceDue = Math.max(0, Math.round((totalAmount - depositCredit) * 100) / 100);

    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      repairOrder: ro._id,
      customer: ro.customer,
      vehicle: ro.vehicle,
      lineItems,
      partsTotal: estimate.partsTotal,
      tiresTotal: estimate.tiresTotal,
      laborTotal: estimate.laborTotal,
      shopSupplies: estimate.shopSupplies,
      taxRate: estimate.taxRate,
      taxAmount: estimate.taxAmount,
      discount: estimate.discount,
      subtotal: estimate.subtotal,
      totalAmount,
      depositCredit,
      balanceDue,
      amountPaid: 0,
      status: balanceDue === 0 ? 'PAID' : 'ISSUED',
      issuedAt: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Net 30 default
      createdBy: req.user!._id,
    });

    ro.invoice = invoice._id as any;
    ro.status = 'INVOICED';
    ro.timeline.push({
      status: 'INVOICED',
      timestamp: new Date(),
      performedBy: req.user!._id,
      notes: `Invoice #${invoice.invoiceNumber} generated. Total: $${totalAmount.toFixed(2)}, Deposit Credit: $${depositCredit.toFixed(2)}, Balance Due: $${balanceDue.toFixed(2)} (SW-011).`,
    });
    await ro.save();

    await recordAuditLog(
      req,
      'INVOICE_GENERATED',
      'Invoice',
      invoice._id.toString(),
      {
        invoiceNumber: invoice.invoiceNumber,
        totalAmount,
        depositCredit,
        balanceDue,
      }
    );

    res.status(201).json({
      success: true,
      message: `Invoice #${invoice.invoiceNumber} generated successfully (SW-011).`,
      invoice,
    });
  } catch (err) {
    next(err);
  }
};

export const downloadInvoicePDF = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id)
      .populate('customer')
      .populate('vehicle')
      .populate('repairOrder');

    if (!invoice) throw new AppError('Invoice not found', 404);

    const pdfBuffer = await PDFService.generateInvoicePDF(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="Freedom-Invoice-${invoice.invoiceNumber}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};
