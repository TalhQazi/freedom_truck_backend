import mongoose, { Document, Schema } from 'mongoose';

export type ModificationActionType =
  | 'SOFTWARE_INSTALL'
  | 'SETTING_CHANGE'
  | 'HARDWARE_CHANGE'
  | 'PERMISSION_CHANGE'
  | 'SECURITY_OVERRIDE';

export type ModificationStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'IMPLEMENTED'
  | 'VERIFIED';

export interface IComputerModificationRequest extends Document {
  requestId: string;
  employee: mongoose.Types.ObjectId;
  employeeName: string;
  employeeIdNumber: string;
  workstationIdentifier: string;
  requestedAction: ModificationActionType;
  softwareOrSettingName: string;
  description: string;
  businessReason: string;
  approver?: mongoose.Types.ObjectId;
  decision?: 'APPROVED' | 'REJECTED';
  decisionNotes?: string;
  decisionTimestamp?: Date;
  implementedBy?: mongoose.Types.ObjectId;
  implementationTimestamp?: Date;
  implementationNotes?: string;
  status: ModificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const computerModificationRequestSchema =
  new Schema<IComputerModificationRequest>(
    {
      requestId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
      },
      employee: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      employeeName: {
        type: String,
        required: true,
      },
      employeeIdNumber: {
        type: String,
        required: true,
      },
      workstationIdentifier: {
        type: String,
        required: true,
      },
      requestedAction: {
        type: String,
        enum: [
          'SOFTWARE_INSTALL',
          'SETTING_CHANGE',
          'HARDWARE_CHANGE',
          'PERMISSION_CHANGE',
          'SECURITY_OVERRIDE',
        ],
        required: true,
      },
      softwareOrSettingName: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      businessReason: {
        type: String,
        required: true,
      },
      approver: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      decision: {
        type: String,
        enum: ['APPROVED', 'REJECTED'],
      },
      decisionNotes: {
        type: String,
      },
      decisionTimestamp: {
        type: Date,
      },
      implementedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      implementationTimestamp: {
        type: Date,
      },
      implementationNotes: {
        type: String,
      },
      status: {
        type: String,
        enum: [
          'SUBMITTED',
          'UNDER_REVIEW',
          'APPROVED',
          'REJECTED',
          'IMPLEMENTED',
          'VERIFIED',
        ],
        default: 'SUBMITTED',
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

export const ComputerModificationRequest =
  mongoose.model<IComputerModificationRequest>(
    'ComputerModificationRequest',
    computerModificationRequestSchema
  );
