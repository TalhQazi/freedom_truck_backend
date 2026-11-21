import mongoose, { Document, Schema } from 'mongoose';

export interface IPaidOutDetail {
  reason: string;
  amount: number;
  recipient: string;
  receiptNumber?: string;
}

export interface IDailyCashUp extends Document {
  cashUpNumber: string;
  businessDate: string; // YYYY-MM-DD
  serviceWriter: mongoose.Types.ObjectId;
  serviceWriterName: string;
  serviceWriterEmployeeId: string;
  openingFloat: number; // e.g. 100.00
  cashSales: number;
  cashRefunds: number;
  paidOuts: number;
  paidOutDetails: IPaidOutDetail[];
  expectedCash: number; // openingFloat + cashSales - cashRefunds - paidOuts
  actualCountedCash: number;
  difference: number; // actualCountedCash - expectedCash
  cashRemovedForDeposit: number;
  closingDrawerBalance: number; // Exactly $100.00
  explanationOfVariance?: string;
  employeeSignature: string; // Base64
  employeeSignedAt: Date;
  requiresManagerReview: boolean;
  managerReview?: {
    reviewedBy: mongoose.Types.ObjectId;
    managerName?: string;
    reviewedAt: Date;
    decision: 'APPROVED' | 'DISCREPANCY_ESCALATED' | 'REJECTED';
    notes?: string;
    managerSignature?: string;
  };
  status: 'DRAFT' | 'SUBMITTED' | 'DISCREPANCY_PENDING_REVIEW' | 'APPROVED' | 'CLOSED';
  createdAt: Date;
  updatedAt: Date;
}

const paidOutSchema = new Schema<IPaidOutDetail>({
  reason: { type: String, required: true },
  amount: { type: Number, required: true },
  recipient: { type: String, required: true },
  receiptNumber: { type: String },
});

const dailyCashUpSchema = new Schema<IDailyCashUp>(
  {
    cashUpNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    businessDate: {
      type: String,
      required: true,
      index: true,
    },
    serviceWriter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    serviceWriterName: {
      type: String,
      required: true,
    },
    serviceWriterEmployeeId: {
      type: String,
      required: true,
    },
    openingFloat: {
      type: Number,
      required: true,
      default: 100.0,
    },
    cashSales: {
      type: Number,
      required: true,
      default: 0,
    },
    cashRefunds: {
      type: Number,
      required: true,
      default: 0,
    },
    paidOuts: {
      type: Number,
      required: true,
      default: 0,
    },
    paidOutDetails: [paidOutSchema],
    expectedCash: {
      type: Number,
      required: true,
      default: 100.0,
    },
    actualCountedCash: {
      type: Number,
      required: true,
      default: 100.0,
    },
    difference: {
      type: Number,
      required: true,
      default: 0,
    },
    cashRemovedForDeposit: {
      type: Number,
      required: true,
      default: 0,
    },
    closingDrawerBalance: {
      type: Number,
      required: true,
      default: 100.0, // Fixed exactly at $100
    },
    explanationOfVariance: {
      type: String,
    },
    employeeSignature: {
      type: String,
      required: true,
    },
    employeeSignedAt: {
      type: Date,
      default: Date.now,
    },
    requiresManagerReview: {
      type: Boolean,
      default: false,
    },
    managerReview: {
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      managerName: { type: String },
      reviewedAt: { type: Date },
      decision: {
        type: String,
        enum: ['APPROVED', 'DISCREPANCY_ESCALATED', 'REJECTED'],
      },
      notes: { type: String },
      managerSignature: { type: String },
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'DISCREPANCY_PENDING_REVIEW', 'APPROVED', 'CLOSED'],
      default: 'SUBMITTED',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const DailyCashUp = mongoose.model<IDailyCashUp>(
  'DailyCashUp',
  dailyCashUpSchema
);
