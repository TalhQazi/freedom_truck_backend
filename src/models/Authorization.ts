import mongoose, { Document, Schema } from 'mongoose';

export interface IAuthorization extends Document {
  authorizationNumber: string;
  repairOrder: mongoose.Types.ObjectId;
  estimate: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  authorizedTotal: number;
  approvedItems: string[];
  customerSignature: string; // Base64 data URL
  customerSignerName: string;
  signerPhone?: string;
  signedAt: Date;
  authorizationType: 'INITIAL' | 'ADDITIONAL_WORK';
  serviceWriterWitness: mongoose.Types.ObjectId;
  termsAccepted: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const authorizationSchema = new Schema<IAuthorization>(
  {
    authorizationNumber: {
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
    authorizedTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    approvedItems: [
      {
        type: String,
        required: true,
      },
    ],
    customerSignature: {
      type: String,
      required: true, // Mandatory signature
    },
    customerSignerName: {
      type: String,
      required: true,
    },
    signerPhone: {
      type: String,
    },
    signedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    authorizationType: {
      type: String,
      enum: ['INITIAL', 'ADDITIONAL_WORK'],
      default: 'INITIAL',
      required: true,
    },
    serviceWriterWitness: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    termsAccepted: {
      type: Boolean,
      required: true,
      default: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Authorization = mongoose.model<IAuthorization>(
  'Authorization',
  authorizationSchema
);
