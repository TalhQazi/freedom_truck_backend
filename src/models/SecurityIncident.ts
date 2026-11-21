import mongoose, { Document, Schema } from 'mongoose';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED' | 'CLOSED';

export interface ISecurityIncident extends Document {
  incidentId: string;
  title: string;
  incidentType: string; // e.g. Unauthorized Account Access, Personal Cloud Sync, Malware Alert, Unattended Workstation
  severity: IncidentSeverity;
  description: string;
  reportedBy: mongoose.Types.ObjectId;
  reporterName: string;
  workstationOrDevice: string;
  systemsImpacted: string[];
  immediateContainmentTaken?: string;
  assignedInvestigator?: mongoose.Types.ObjectId;
  investigationFindings?: string;
  remediationPlan?: string;
  escalatedToManagement: boolean;
  managementReview?: {
    manager: mongoose.Types.ObjectId;
    managerName?: string;
    reviewedAt: Date;
    notes?: string;
  };
  status: IncidentStatus;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const securityIncidentSchema = new Schema<ISecurityIncident>(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    incidentType: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reporterName: {
      type: String,
      required: true,
    },
    workstationOrDevice: {
      type: String,
      required: true,
    },
    systemsImpacted: [
      {
        type: String,
      },
    ],
    immediateContainmentTaken: {
      type: String,
    },
    assignedInvestigator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    investigationFindings: {
      type: String,
    },
    remediationPlan: {
      type: String,
    },
    escalatedToManagement: {
      type: Boolean,
      default: true,
    },
    managementReview: {
      manager: { type: Schema.Types.ObjectId, ref: 'User' },
      managerName: { type: String },
      reviewedAt: { type: Date },
      notes: { type: String },
    },
    status: {
      type: String,
      enum: ['OPEN', 'INVESTIGATING', 'MITIGATED', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const SecurityIncident = mongoose.model<ISecurityIncident>(
  'SecurityIncident',
  securityIncidentSchema
);
