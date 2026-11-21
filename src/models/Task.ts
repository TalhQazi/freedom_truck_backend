import mongoose, { Document, Schema } from 'mongoose';

export type TaskDepartment =
  | 'SERVICE_WRITER'
  | 'TECHNICIAN'
  | 'QC_TECHNICIAN'
  | 'OFFICE_ASSISTANT'
  | 'MANAGEMENT';

export type TaskStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'BLOCKED';

export interface ITaskChecklistItem {
  item: string;
  completed: boolean;
  completedAt?: Date;
}

export interface ITaskComment {
  user: mongoose.Types.ObjectId;
  userName: string;
  role: string;
  text: string;
  createdAt: Date;
}

export interface ITask extends Document {
  taskId: string;
  sopId: string; // e.g. SW-001, TECH-009, OFF-005
  title: string;
  department: TaskDepartment;
  responsibleRole: string;
  assignedTo?: mongoose.Types.ObjectId;
  assignedEmployeeName?: string;
  triggerDescription: string;
  checklist: ITaskChecklistItem[];
  requiredEvidence: string;
  status: TaskStatus;
  dueDate: Date;
  completedBy?: mongoose.Types.ObjectId;
  completedEmployeeName?: string;
  completedAt?: Date;
  evidenceNotes?: string;
  evidenceAttachmentUrl?: string;
  supervisorReview?: {
    reviewer: mongoose.Types.ObjectId;
    reviewerName?: string;
    reviewedAt: Date;
    notes?: string;
    approved: boolean;
  };
  escalated: boolean;
  escalationReason?: string;
  comments: ITaskComment[];
  createdAt: Date;
  updatedAt: Date;
}

const checklistItemSchema = new Schema<ITaskChecklistItem>({
  item: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
});

const taskCommentSchema = new Schema<ITaskComment>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  role: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const taskSchema = new Schema<ITask>(
  {
    taskId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    sopId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      enum: [
        'SERVICE_WRITER',
        'TECHNICIAN',
        'QC_TECHNICIAN',
        'OFFICE_ASSISTANT',
        'MANAGEMENT',
      ],
      required: true,
      index: true,
    },
    responsibleRole: {
      type: String,
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignedEmployeeName: {
      type: String,
    },
    triggerDescription: {
      type: String,
      required: true,
    },
    checklist: [checklistItemSchema],
    requiredEvidence: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'BLOCKED'],
      default: 'PENDING',
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    completedEmployeeName: {
      type: String,
    },
    completedAt: {
      type: Date,
    },
    evidenceNotes: {
      type: String,
    },
    evidenceAttachmentUrl: {
      type: String,
    },
    supervisorReview: {
      reviewer: { type: Schema.Types.ObjectId, ref: 'User' },
      reviewerName: { type: String },
      reviewedAt: { type: Date },
      notes: { type: String },
      approved: { type: Boolean },
    },
    escalated: {
      type: Boolean,
      default: false,
    },
    escalationReason: {
      type: String,
    },
    comments: [taskCommentSchema],
  },
  {
    timestamps: true,
  }
);

export const Task = mongoose.model<ITask>('Task', taskSchema);
