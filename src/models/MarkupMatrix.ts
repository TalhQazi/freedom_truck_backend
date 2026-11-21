import mongoose, { Document, Schema } from 'mongoose';

export interface IMarkupTier {
  minCost: number;
  maxCost: number;
  markupPercent: number; // e.g. 100 for 100%
  multiplier: number; // e.g. 2.0
  marginPercent?: number;
}

export interface IMarkupMatrix extends Document {
  name: string;
  isActive: boolean;
  tireFlatMarkup: number; // $20.00 default as per SW-005
  laborRateDefault: number; // standard shop hourly labor rate
  tiers: IMarkupTier[];
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const markupMatrixSchema = new Schema<IMarkupMatrix>(
  {
    name: {
      type: String,
      required: true,
      default: 'Standard Automotive Markup Matrix',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tireFlatMarkup: {
      type: Number,
      required: true,
      default: 20.0, // SOP SW-005: Cost + $20 flat per tire
    },
    laborRateDefault: {
      type: Number,
      required: true,
      default: 145.0,
    },
    tiers: [
      {
        minCost: { type: Number, required: true },
        maxCost: { type: Number, required: true },
        markupPercent: { type: Number, required: true },
        multiplier: { type: Number, required: true },
        marginPercent: { type: Number },
      },
    ],
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const MarkupMatrix = mongoose.model<IMarkupMatrix>(
  'MarkupMatrix',
  markupMatrixSchema
);
