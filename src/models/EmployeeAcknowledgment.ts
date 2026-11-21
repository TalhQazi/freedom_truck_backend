import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployeeAcknowledgment extends Document {
  employee: mongoose.Types.ObjectId;
  employeeName: string;
  employeeIdNumber: string;
  policyType:
    | 'PASSWORD_POLICY'
    | 'NO_PERSONAL_ACCOUNTS'
    | 'DATA_STORAGE'
    | 'INDIVIDUAL_CREDENTIALS';
  policyTitle: string;
  termsVersion: string;
  acknowledged: boolean;
  signature: string; // Base64
  signedAt: Date;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const employeeAcknowledgmentSchema = new Schema<IEmployeeAcknowledgment>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    employeeIdNumber: {
      type: String,
      required: true,
    },
    policyType: {
      type: String,
      enum: [
        'PASSWORD_POLICY',
        'NO_PERSONAL_ACCOUNTS',
        'DATA_STORAGE',
        'INDIVIDUAL_CREDENTIALS',
      ],
      required: true,
      index: true,
    },
    policyTitle: {
      type: String,
      required: true,
    },
    termsVersion: {
      type: String,
      default: '2025.1',
    },
    acknowledged: {
      type: Boolean,
      required: true,
      default: true,
    },
    signature: {
      type: String,
      required: true,
    },
    signedAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const EmployeeAcknowledgment = mongoose.model<IEmployeeAcknowledgment>(
  'EmployeeAcknowledgment',
  employeeAcknowledgmentSchema
);
