import mongoose, { Document, Schema } from 'mongoose';

export type InspectionStatus = 'GREEN' | 'YELLOW' | 'RED';

export interface IInspectionItem {
  name: string;
  category: string;
  status: InspectionStatus;
  measurement?: string;
  findings?: string;
  recommendations?: string;
}

export interface ILightingItem {
  name: string;
  status: 'GREEN' | 'YELLOW' | 'RED' | 'NA';
  notes?: string;
}

export interface IFluidCheckItem {
  fluidName: string;
  specVerified: boolean;
  fluidType?: string;
  grade?: string;
  capacity?: string;
  levelOk: boolean;
  leakChecked: boolean;
  notes?: string;
}

export interface ITechnicianWorksheet extends Document {
  worksheetNumber: string;
  repairOrder: mongoose.Types.ObjectId;
  vehicle: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  recordedMileage: number;

  // TECH-002 Two-Person Lighting Inspection
  lightingInspection: {
    performed: boolean;
    operatorEmployee: mongoose.Types.ObjectId;
    observerEmployee: mongoose.Types.ObjectId;
    items: ILightingItem[];
  };

  // TECH-003 Vehicle Lift Safety Inspection
  liftSafetyInspection: {
    performed: boolean;
    padsPositioned: boolean;
    locksEngaged: boolean;
    verifiedBy: mongoose.Types.ObjectId;
    verifiedAt?: Date;
  };

  // TECH-004 & TECH-005 Full Vehicle Inspection
  fullVehicleInspection: {
    performed: boolean;
    items: IInspectionItem[];
    hasRedFlags: boolean;
    redFlagCount: number;
    yellowFlagCount: number;
  };

  // TECH-006 & TECH-007 Fluid Specification & Service Verification
  fluidVerification: {
    performed: boolean;
    fluids: IFluidCheckItem[];
  };

  // TECH-008 Initial Technician Signoff (Tech #1)
  initialSignoff: {
    technician: mongoose.Types.ObjectId;
    employeeId: string;
    signature: string; // Base64
    signedAt?: Date;
    laborCompletedNotes?: string;
  };

  // TECH-009, TECH-010, TECH-011 Independent Quality Control (Tech #2)
  qcInspection: {
    qcTechnician: mongoose.Types.ObjectId;
    employeeId: string;
    workCompletedVerified: boolean;
    safetyConcernsVerified: boolean;
    fluidsVerified: boolean;
    leaksVerified: boolean;
    lightsVerified: boolean;
    tiresTorquedVerified: boolean;
    fastenersTorquedVerified: boolean;
    originalComplaintResolved: boolean;
    discrepanciesFound: boolean;
    discrepancyDetails?: string;
    correctiveActionTaken?: string;
    reinspectionResult: 'PENDING' | 'PASSED' | 'FAILED';
    reinspectedAt?: Date;
    signature?: string; // Base64
    signedAt?: Date;
  };

  // TECH-012 Vehicle Exit Observation
  exitObservation: {
    performed: boolean;
    observer: mongoose.Types.ObjectId;
    observedAt?: Date;
    leaksObservedOnExit: boolean;
    abnormalNoisesOrExhaust: boolean;
    exitNotes?: string;
    exitPassed: boolean;
  };

  // SW-010 Service Writer Final Release Verification
  finalReleaseVerification: {
    verified: boolean;
    serviceWriter: mongoose.Types.ObjectId;
    verifiedAt?: Date;
    bothTechSignaturesVerified: boolean;
    allSafetyIssuesResolved: boolean;
    releasePermitted: boolean;
    notes?: string;
  };

  status: 'IN_PROGRESS' | 'TECH1_COMPLETE' | 'QC_IN_PROGRESS' | 'QC_DISCREPANCY' | 'QC_PASSED' | 'RELEASE_READY';
  createdAt: Date;
  updatedAt: Date;
}

const technicianWorksheetSchema = new Schema<ITechnicianWorksheet>(
  {
    worksheetNumber: {
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
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    recordedMileage: {
      type: Number,
      required: true,
    },
    lightingInspection: {
      performed: { type: Boolean, default: false },
      operatorEmployee: { type: Schema.Types.ObjectId, ref: 'User' },
      observerEmployee: { type: Schema.Types.ObjectId, ref: 'User' },
      items: [
        {
          name: { type: String, required: true },
          status: { type: String, enum: ['GREEN', 'YELLOW', 'RED', 'NA'], default: 'GREEN' },
          notes: { type: String },
        },
      ],
    },
    liftSafetyInspection: {
      performed: { type: Boolean, default: false },
      padsPositioned: { type: Boolean, default: false },
      locksEngaged: { type: Boolean, default: false },
      verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      verifiedAt: { type: Date },
    },
    fullVehicleInspection: {
      performed: { type: Boolean, default: false },
      items: [
        {
          name: { type: String, required: true },
          category: { type: String, required: true },
          status: { type: String, enum: ['GREEN', 'YELLOW', 'RED'], default: 'GREEN' },
          measurement: { type: String },
          findings: { type: String },
          recommendations: { type: String },
        },
      ],
      hasRedFlags: { type: Boolean, default: false },
      redFlagCount: { type: Number, default: 0 },
      yellowFlagCount: { type: Number, default: 0 },
    },
    fluidVerification: {
      performed: { type: Boolean, default: false },
      fluids: [
        {
          fluidName: { type: String, required: true },
          specVerified: { type: Boolean, default: false },
          fluidType: { type: String },
          grade: { type: String },
          capacity: { type: String },
          levelOk: { type: Boolean, default: false },
          leakChecked: { type: Boolean, default: false },
          notes: { type: String },
        },
      ],
    },
    initialSignoff: {
      technician: { type: Schema.Types.ObjectId, ref: 'User' },
      employeeId: { type: String },
      signature: { type: String },
      signedAt: { type: Date },
      laborCompletedNotes: { type: String },
    },
    qcInspection: {
      qcTechnician: { type: Schema.Types.ObjectId, ref: 'User' },
      employeeId: { type: String },
      workCompletedVerified: { type: Boolean, default: false },
      safetyConcernsVerified: { type: Boolean, default: false },
      fluidsVerified: { type: Boolean, default: false },
      leaksVerified: { type: Boolean, default: false },
      lightsVerified: { type: Boolean, default: false },
      tiresTorquedVerified: { type: Boolean, default: false },
      fastenersTorquedVerified: { type: Boolean, default: false },
      originalComplaintResolved: { type: Boolean, default: false },
      discrepanciesFound: { type: Boolean, default: false },
      discrepancyDetails: { type: String },
      correctiveActionTaken: { type: String },
      reinspectionResult: {
        type: String,
        enum: ['PENDING', 'PASSED', 'FAILED'],
        default: 'PENDING',
      },
      reinspectedAt: { type: Date },
      signature: { type: String },
      signedAt: { type: Date },
    },
    exitObservation: {
      performed: { type: Boolean, default: false },
      observer: { type: Schema.Types.ObjectId, ref: 'User' },
      observedAt: { type: Date },
      leaksObservedOnExit: { type: Boolean, default: false },
      abnormalNoisesOrExhaust: { type: Boolean, default: false },
      exitNotes: { type: String },
      exitPassed: { type: Boolean, default: false },
    },
    finalReleaseVerification: {
      verified: { type: Boolean, default: false },
      serviceWriter: { type: Schema.Types.ObjectId, ref: 'User' },
      verifiedAt: { type: Date },
      bothTechSignaturesVerified: { type: Boolean, default: false },
      allSafetyIssuesResolved: { type: Boolean, default: false },
      releasePermitted: { type: Boolean, default: false },
      notes: { type: String },
    },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'TECH1_COMPLETE', 'QC_IN_PROGRESS', 'QC_DISCREPANCY', 'QC_PASSED', 'RELEASE_READY'],
      default: 'IN_PROGRESS',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const TechnicianWorksheet = mongoose.model<ITechnicianWorksheet>(
  'TechnicianWorksheet',
  technicianWorksheetSchema
);
