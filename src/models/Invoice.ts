import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoiceLineItem {
  itemType: 'part' | 'tire' | 'labor' | 'sublet' | 'fee';
  description: string;
  partNumber?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  repairOrder: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  vehicle: mongoose.Types.ObjectId;
  lineItems: IInvoiceLineItem[];
  partsTotal: number;
  tiresTotal: number;
  laborTotal: number;
  shopSupplies: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  subtotal: number;
  totalAmount: number;
  depositCredit: number; // Deposit deducted
  balanceDue: number;
  amountPaid: number;
  status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID';
  issuedAt: Date;
  dueDate: Date;
  paidAt?: Date;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceLineItemSchema = new Schema<IInvoiceLineItem>({
  itemType: {
    type: String,
    enum: ['part', 'tire', 'labor', 'sublet', 'fee'],
    required: true,
  },
  description: { type: String, required: true },
  partNumber: { type: String },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true, default: 0 },
  subtotal: { type: Number, required: true, default: 0 },
});

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    repairOrder: {
      type: Schema.Types.ObjectId,
      ref: 'RepairOrder',
      required: true,
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    lineItems: [invoiceLineItemSchema],
    partsTotal: { type: Number, required: true, default: 0 },
    tiresTotal: { type: Number, required: true, default: 0 },
    laborTotal: { type: Number, required: true, default: 0 },
    shopSupplies: { type: Number, required: true, default: 0 },
    taxRate: { type: Number, required: true, default: 0.0825 },
    taxAmount: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    subtotal: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    depositCredit: { type: Number, default: 0 },
    balanceDue: { type: Number, required: true, default: 0 },
    amountPaid: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'VOID'],
      default: 'ISSUED',
      index: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      default: Date.now,
    },
    paidAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
