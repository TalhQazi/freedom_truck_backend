import mongoose, { Document, Schema } from 'mongoose';

export interface IEstimateLineItem {
  itemType: 'part' | 'tire' | 'labor' | 'sublet' | 'fee';
  description: string;
  partNumber?: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  laborHours?: number;
  laborRatePerHour?: number;
  subtotal: number;
  markupApplied?: number; // markup percentage or fixed tire markup
}

export interface IEstimate extends Document {
  estimateNumber: string;
  version: number;
  customer: mongoose.Types.ObjectId;
  vehicle: mongoose.Types.ObjectId;
  repairOrder?: mongoose.Types.ObjectId;
  mileageIn: number;
  customerComplaint: string;
  requestedServices: string[];
  lineItems: IEstimateLineItem[];
  partsTotal: number;
  tiresTotal: number;
  laborTotal: number;
  shopSupplies: number;
  subtotal: number;
  taxRate: number; // e.g. 0.0825 (8.25%)
  taxAmount: number;
  discount: number;
  grandTotal: number;
  depositRequired: number; // 50% if grandTotal > 500
  depositMet: boolean;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REVISED' | 'DECLINED';
  createdBy: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const lineItemSchema = new Schema<IEstimateLineItem>({
  itemType: {
    type: String,
    enum: ['part', 'tire', 'labor', 'sublet', 'fee'],
    required: true,
  },
  description: { type: String, required: true },
  partNumber: { type: String },
  quantity: { type: Number, required: true, default: 1 },
  costPrice: { type: Number, required: true, default: 0 },
  sellingPrice: { type: Number, required: true, default: 0 },
  laborHours: { type: Number, default: 0 },
  laborRatePerHour: { type: Number, default: 0 },
  subtotal: { type: Number, required: true, default: 0 },
  markupApplied: { type: Number, default: 0 },
});

const estimateSchema = new Schema<IEstimate>(
  {
    estimateNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },
    repairOrder: {
      type: Schema.Types.ObjectId,
      ref: 'RepairOrder',
    },
    mileageIn: {
      type: Number,
      required: true,
    },
    customerComplaint: {
      type: String,
      required: true,
    },
    requestedServices: [
      {
        type: String,
      },
    ],
    lineItems: [lineItemSchema],
    partsTotal: { type: Number, default: 0 },
    tiresTotal: { type: Number, default: 0 },
    laborTotal: { type: Number, default: 0 },
    shopSupplies: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0.0825 },
    taxAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    depositRequired: { type: Number, default: 0 },
    depositMet: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REVISED', 'DECLINED'],
      default: 'DRAFT',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Estimate = mongoose.model<IEstimate>('Estimate', estimateSchema);
