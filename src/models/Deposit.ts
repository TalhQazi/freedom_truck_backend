import mongoose, { Document, Schema } from 'mongoose';

export interface IDeposit extends Document {
  depositNumber: string;
  repairOrder: mongoose.Types.ObjectId;
  estimate: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  requiredAmount: number; // 50% of estimate if > $500
  paidAmount: number;
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CHECK' | 'FLEET_ACCOUNT';
  transactionReference?: string;
  collectedBy: mongoose.Types.ObjectId;
  collectedAt: Date;
  status: 'PAID' | 'REFUNDED' | 'APPLIED_TO_INVOICE';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const depositSchema = new Schema<IDeposit>(
  {
    depositNumber: {
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
    estimate: {
      type: Schema.Types.ObjectId,
      ref: 'Estimate',
      required: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    requiredAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'CHECK', 'FLEET_ACCOUNT'],
      required: true,
      default: 'CREDIT_CARD',
    },
    transactionReference: {
      type: String,
      trim: true,
    },
    collectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collectedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['PAID', 'REFUNDED', 'APPLIED_TO_INVOICE'],
      default: 'PAID',
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Deposit = mongoose.model<IDeposit>('Deposit', depositSchema);
