import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. No access token provided.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'freedom_car_and_truck_secret_key_2025_secure_jwt'
    ) as { id: string };

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({
        success: false,
        message: 'This user account is inactive. Access denied.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User authentication required.',
      });
      return;
    }

    if (!roles.includes(req.user.role) && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource. Required: [${roles.join(', ')}]`,
      });
      return;
    }

    next();
  };
};

export const recordAuditLog = async (
  req: AuthRequest,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, any>
) => {
  try {
    if (!req.user) return;
    await AuditLog.create({
      action,
      employeeId: req.user.employeeId,
      employeeName: req.user.name,
      user: req.user._id,
      entityType,
      entityId,
      details,
      ipAddress: req.ip || req.socket.remoteAddress,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};
