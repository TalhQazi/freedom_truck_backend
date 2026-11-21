import mongoose, { Document, Schema } from 'mongoose';

export type RepairOrderStatus =
  | 'INTAKE'
  | 'ESTIMATE_PENDING'
  | 'ESTIMATE_CREATED'
  | 'AUTHORIZATION_PENDING'
  | 'AUTHORIZED'
  | 'DEPOSIT_REQUIRED'
  | 'DEPOSIT_PAID'
  | 'DISPATCHED'
  | 'INSPECTION_IN_PROGRESS'
  | 'REPAIR_IN_PROGRESS'
  | 'TECH1_SIGNED'
  | 'QC_PENDING'
  | 'QC_IN_PROGRESS'
  | 'QC_DISCREPANCY'
  | 'REINSPECTED'
  | 'QC_APPROVED'
  | 'EXIT_OBSERVED'
  | 'READY_FOR_INVOICE'
  | 'INVOICED'
  | 'PAID'
  | 'RELEASED'
  | 'CLOSED';

export interface IRepairOrder extends Document {
  roNumber: string;
  customer: mongoose.Types.ObjectId;
  vehicle: mongoose.Types.ObjectId;
  mileageIn: number;
  mileageOut?: number;
  customerComplaint: string;
  requestedServices: string[];
  currentEstimate?: mongoose.Types.ObjectId;
  authorization?: mongoose.Types.ObjectId;
  additionalAuthorizations: mongoose.Types.ObjectId[];
  deposit?: mongoose.Types.ObjectId;
  status: RepairOrderStatus;
  serviceWriter: mongoose.Types.ObjectId;
  assignedTechnician?: mongoose.Types.ObjectId;
  qcTechnician?: mongoose.Types.ObjectId;
  dispatchedAt?: Date;
  worksheet?: mongoose.Types.ObjectId;
  invoice?: mongoose.Types.ObjectId;
  hasSafetyConcerns: boolean;
  unresolvedSafetyCount: number;
  timeline: {
    status: RepairOrderStatus;
    timestamp: Date;
    performedBy: mongoose.Types.ObjectId;
    notes?: string;
  }[];
  overrideHistory: {
    action: string;
    reason: string;
    managerId: mongoose.Types.ObjectId;
    timestamp: Date;
    correctiveAction: string;
  }[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const repairOrderSchema = new Schema<IRepairOrder>(
  {
    roNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
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
    mileageIn: {
      type: Number,
      required: true,
    },
    mileageOut: {
      type: Number,
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
    currentEstimate: {
      type: Schema.Types.ObjectId,
      ref: 'Estimate',
    },
    authorization: {
      type: Schema.Types.ObjectId,
      ref: 'Authorization',
    },
    additionalAuthorizations: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Authorization',
      },
    ],
    deposit: {
      type: Schema.Types.ObjectId,
      ref: 'Deposit',
    },
    status: {
      type: String,
      required: true,
      default: 'INTAKE',
      index: true,
    },
    serviceWriter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedTechnician: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    qcTechnician: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    dispatchedAt: {
      type: Date,
    },
    worksheet: {
      type: Schema.Types.ObjectId,
      ref: 'TechnicianWorksheet',
    },
    invoice: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
    },
    hasSafetyConcerns: {
      type: Boolean,
      default: false,
    },
    unresolvedSafetyCount: {
      type: Number,
      default: 0,
    },
    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        notes: { type: String },
      },
    ],
    overrideHistory: [
      {
        action: { type: String, required: true },
        reason: { type: String, required: true },
        managerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        timestamp: { type: Date, default: Date.now },
        correctiveAction: { type: String, required: true },
      },
    ],
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const RepairOrder = mongoose.model<IRepairOrder>(
  'RepairOrder',
  repairOrderSchema
);
