import { Response, NextFunction } from 'express';
import { Notification } from '../models/Notification.js';
import { AuthRequest } from '../middleware/auth.js';

export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const role = req.user!.role;

    const notifications = await Notification.find({
      $or: [{ recipient: userId }, { targetRole: role }, { targetRole: 'all' }],
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = notifications.filter((n) => !n.read).length;

    res.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (err) {
    next(err);
  }
};

export const markNotificationAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { read: true });

    res.json({
      success: true,
      message: 'Notification marked as read.',
    });
  } catch (err) {
    next(err);
  }
};

export const markAllNotificationsAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const role = req.user!.role;

    await Notification.updateMany(
      {
        $or: [{ recipient: userId }, { targetRole: role }, { targetRole: 'all' }],
        read: false,
      },
      { read: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (err) {
    next(err);
  }
};
