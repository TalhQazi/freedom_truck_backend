import mongoose, { Document, Schema } from 'mongoose';

export interface IVehicle extends Document {
  customer: mongoose.Types.ObjectId;
  vin: string;
  licensePlate: string;
  year: number;
  make: string;
  model: string;
  subModel?: string;
  engine?: string;
  color?: string;
  currentMileage: number;
  previousMileage?: number;
  unitNumber?: string;
  registrationDetails?: {
    state?: string;
    expirationDate?: string;
  };
  outstandingIssues: string[];
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicle>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    vin: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    licensePlate: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
    },
    make: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    subModel: {
      type: String,
      trim: true,
    },
    engine: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    currentMileage: {
      type: Number,
      required: true,
      min: 0,
    },
    previousMileage: {
      type: Number,
      min: 0,
    },
    unitNumber: {
      type: String,
      trim: true,
    },
    registrationDetails: {
      state: { type: String, trim: true, uppercase: true },
      expirationDate: { type: String, trim: true },
    },
    outstandingIssues: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

vehicleSchema.index({ customer: 1, licensePlate: 1 });

export const Vehicle = mongoose.model<IVehicle>('Vehicle', vehicleSchema);
