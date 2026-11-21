import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  customerNumber: string;
  name: string;
  phone: string;
  email?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  notes?: string;
  status: 'active' | 'inactive' | 'vip' | 'flagged';
  registrationDate: Date;
  vehicles: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    customerNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zip: { type: String, trim: true },
    },
    notes: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'vip', 'flagged'],
      default: 'active',
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    vehicles: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Vehicle',
      },
    ],
  },
  {
    timestamps: true,
  }
);

customerSchema.index({ phone: 1, name: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
