import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole =
  | 'service_writer'
  | 'technician'
  | 'qc_technician'
  | 'office_assistant'
  | 'manager'
  | 'admin';

export interface IUser extends Document {
  employeeId: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  department: string;
  status: 'active' | 'inactive';
  lastLogin?: Date;
  passwordPolicyAcknowledged: boolean;
  workstationLockedAcknowledged?: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      required: true,
      enum: [
        'service_writer',
        'technician',
        'qc_technician',
        'office_assistant',
        'manager',
        'admin',
      ],
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      default: 'Workshop Operations',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    lastLogin: {
      type: Date,
    },
    passwordPolicyAcknowledged: {
      type: Boolean,
      default: false,
    },
    workstationLockedAcknowledged: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
