import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'APPROVAL_REQUIRED'
  | 'DEPOSIT_REQUIRED'
  | 'DISPATCH_READY'
  | 'QC_FAILED'
  | 'DISCREPANCY_FLAGGED'
  | 'RO_COMPLETED'
  | 'PAYMENT_RECEIVED'
  | 'SECURITY_ALERT'
  | 'TASK_ASSIGNED';

export interface INotification extends Document {
  recipient?: mongoose.Types.ObjectId;
  targetRole?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    targetRole: {
      type: String,
      index: true,
    },
    type: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);
