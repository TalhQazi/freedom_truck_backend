import { Response, NextFunction } from 'express';
import { Task, TaskDepartment, TaskStatus } from '../models/Task.js';
import { AuthRequest, recordAuditLog } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const getTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { department, status, assignedTo, page = 1, limit = 50 } = req.query;
    const query: any = {};
    if (department) query.department = department;
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;

    const skip = (Number(page) - 1) * Number(limit);
    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('assignedTo', 'name employeeId role')
        .populate('completedBy', 'name employeeId')
        .populate('supervisorReview.reviewer', 'name employeeId')
        .sort({ dueDate: 1, sopId: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Task.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getTaskById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id)
      .populate('assignedTo', 'name employeeId role')
      .populate('completedBy', 'name employeeId')
      .populate('comments.user', 'name employeeId role');

    if (!task) throw new AppError('Task not found', 404);

    res.json({
      success: true,
      task,
    });
  } catch (err) {
    next(err);
  }
};

export const updateTaskStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, checklist, evidenceNotes, evidenceAttachmentUrl } = req.body;

    const task = await Task.findById(id);
    if (!task) throw new AppError('Task not found', 404);

    if (checklist) {
      task.checklist = checklist;
    }

    if (status) {
      task.status = status;
      if (status === 'COMPLETED') {
        task.completedBy = req.user!._id;
        task.completedEmployeeName = req.user!.name;
        task.completedAt = new Date();
      }
    }

    if (evidenceNotes) task.evidenceNotes = evidenceNotes;
    if (evidenceAttachmentUrl) task.evidenceAttachmentUrl = evidenceAttachmentUrl;

    await task.save();

    await recordAuditLog(
      req,
      'TASK_STATUS_UPDATED',
      'Task',
      task._id.toString(),
      {
        taskId: task.taskId,
        sopId: task.sopId,
        newStatus: task.status,
      }
    );

    res.json({
      success: true,
      message: `Task ${task.taskId} (${task.sopId}) updated to ${task.status}.`,
      task,
    });
  } catch (err) {
    next(err);
  }
};

export const reviewTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { approved, notes } = req.body;

    if (!['manager', 'admin'].includes(req.user!.role)) {
      throw new AppError('Only supervisors/managers can conduct SOP task reviews.', 403);
    }

    const task = await Task.findById(id);
    if (!task) throw new AppError('Task not found', 404);

    task.supervisorReview = {
      reviewer: req.user!._id,
      reviewerName: req.user!.name,
      reviewedAt: new Date(),
      notes,
      approved: Boolean(approved),
    };

    if (!approved) {
      task.status = 'IN_PROGRESS';
    }

    await task.save();

    await recordAuditLog(
      req,
      'TASK_SUPERVISOR_REVIEW',
      'Task',
      task._id.toString(),
      {
        taskId: task.taskId,
        sopId: task.sopId,
        approved,
      }
    );

    res.json({
      success: true,
      message: `Supervisor review recorded for task ${task.taskId}.`,
      task,
    });
  } catch (err) {
    next(err);
  }
};

export const addTaskComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      throw new AppError('Comment text cannot be empty.', 400);
    }

    const task = await Task.findById(id);
    if (!task) throw new AppError('Task not found', 404);

    task.comments.push({
      user: req.user!._id,
      userName: req.user!.name,
      role: req.user!.role,
      text: text.trim(),
      createdAt: new Date(),
    } as any);

    await task.save();

    res.json({
      success: true,
      message: 'Comment added.',
      comments: task.comments,
    });
  } catch (err) {
    next(err);
  }
};
