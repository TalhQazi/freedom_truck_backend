import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  paymentNumber: string;
  invoice: mongoose.Types.ObjectId;
  repairOrder: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CHECK' | 'FLEET_ACCOUNT';
  referenceNumber?: string;
  processedBy: mongoose.Types.ObjectId;
  processedAt: Date;
  receiptNumber: string;
  officeReceiptSigned: boolean;
  officeSignature?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    invoice: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
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
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'CHECK', 'FLEET_ACCOUNT'],
      required: true,
      default: 'CREDIT_CARD',
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    officeReceiptSigned: {
      type: Boolean,
      default: false,
    },
    officeSignature: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
