import mongoose, { Document, Schema } from 'mongoose';

export interface ICompanySetting extends Document {
  companyName: string;
  legalName: string;
  tagline: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  phone: string;
  email: string;
  website: string;
  licenseNumber: string;
  epaFacilityId?: string;
  taxRateDefault: number;
  laborRateDefault: number;
  tireMarkupFlat: number; // $20.00 SOP SW-005
  depositThreshold: number; // $500.00 SOP SW-008
  depositPercentage: number; // 50% SOP SW-008
  drawerClosingTarget: number; // $100.00 SOP SW-015
  electronicPartsCatalogUrl?: string; // Integration ready interface
  mitchellManagerIntegrationEnabled: boolean; // Integration ready interface
  documentRetentionYears: number;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const companySettingSchema = new Schema<ICompanySetting>(
  {
    companyName: {
      type: String,
      required: true,
      default: 'Freedom Car & Truck',
    },
    legalName: {
      type: String,
      default: 'Freedom Car & Truck Workshop Systems LLC',
    },
    tagline: {
      type: String,
      default: 'Commercial Fleet & Automotive Fleet Services',
    },
    address: {
      street: { type: String, default: '1244 Freedom Industrial Blvd' },
      city: { type: String, default: 'Dallas' },
      state: { type: String, default: 'TX' },
      zip: { type: String, default: '75201' },
    },
    phone: {
      type: String,
      default: '(214) 555-0199',
    },
    email: {
      type: String,
      default: 'service@freedomcartruck.com',
    },
    website: {
      type: String,
      default: 'https://freedomcartruck.com',
    },
    licenseNumber: {
      type: String,
      default: 'TX-MV-849201-COMM',
    },
    epaFacilityId: {
      type: String,
      default: 'EPA-TXR-904318',
    },
    taxRateDefault: {
      type: Number,
      default: 0.0825,
    },
    laborRateDefault: {
      type: Number,
      default: 145.0,
    },
    tireMarkupFlat: {
      type: Number,
      default: 20.0,
    },
    depositThreshold: {
      type: Number,
      default: 500.0,
    },
    depositPercentage: {
      type: Number,
      default: 50.0,
    },
    drawerClosingTarget: {
      type: Number,
      default: 100.0,
    },
    electronicPartsCatalogUrl: {
      type: String,
      default: '',
    },
    mitchellManagerIntegrationEnabled: {
      type: Boolean,
      default: false,
    },
    documentRetentionYears: {
      type: Number,
      default: 7,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const CompanySetting = mongoose.model<ICompanySetting>(
  'CompanySetting',
  companySettingSchema
);
