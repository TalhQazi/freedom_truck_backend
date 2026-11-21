import mongoose, { Document, Schema } from 'mongoose';

export interface IDailySecurityChecklist extends Document {
  checklistNumber: string;
  businessDate: string; // YYYY-MM-DD
  completedBy: mongoose.Types.ObjectId;
  employeeName: string;
  employeeIdNumber: string;

  // OFF-001 & OFF-002: Authorized company accounts verified
  companyAccountsOnlyVerified: boolean;
  personalEmailProhibitedVerified: boolean;

  // OFF-003: OneDrive / personal cloud sync disabled check
  personalCloudSyncDisabledVerified: boolean;

  // OFF-007: Password-saving & auto-login policy observed
  noAutoLoginObserved: boolean;

  // OFF-008: Workstations locked when unattended/closing
  allWorkstationsLockedAtClose: boolean;

  // OFF-009: Daily account sign-out completed
  allTerminalsSignedOut: boolean;

  // OFF-010: Authorized business-data storage compliance
  businessDataStorageCompliant: boolean;

  // OFF-011: Individual credentials check (no shared logins)
  noSharedCredentialsObserved: boolean;

  notes?: string;
  signature: string; // Base64
  signedAt: Date;
  status: 'COMPLETED' | 'FLAGGED_DEFECT' | 'REVIEWED';
  managerReview?: {
    reviewedBy: mongoose.Types.ObjectId;
    reviewedAt: Date;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const dailySecurityChecklistSchema = new Schema<IDailySecurityChecklist>(
  {
    checklistNumber: {
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
    completedBy: {
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
    companyAccountsOnlyVerified: {
      type: Boolean,
      required: true,
      default: true,
    },
    personalEmailProhibitedVerified: {
      type: Boolean,
      required: true,
      default: true,
    },
    personalCloudSyncDisabledVerified: {
      type: Boolean,
      required: true,
      default: true,
    },
    noAutoLoginObserved: {
      type: Boolean,
      required: true,
      default: true,
    },
    allWorkstationsLockedAtClose: {
      type: Boolean,
      required: true,
      default: true,
    },
    allTerminalsSignedOut: {
      type: Boolean,
      required: true,
      default: true,
    },
    businessDataStorageCompliant: {
      type: Boolean,
      required: true,
      default: true,
    },
    noSharedCredentialsObserved: {
      type: Boolean,
      required: true,
      default: true,
    },
    notes: {
      type: String,
    },
    signature: {
      type: String,
      required: true,
    },
    signedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'FLAGGED_DEFECT', 'REVIEWED'],
      default: 'COMPLETED',
    },
    managerReview: {
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: { type: Date },
      notes: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

export const DailySecurityChecklist =
  mongoose.model<IDailySecurityChecklist>(
    'DailySecurityChecklist',
    dailySecurityChecklistSchema
  );
