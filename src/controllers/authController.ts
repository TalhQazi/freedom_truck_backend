import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { EmployeeAcknowledgment } from '../models/EmployeeAcknowledgment.js';
import { AuthRequest, recordAuditLog } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const generateToken = (user: IUser): string => {
  return jwt.sign(
    { id: user._id, role: user.role, employeeId: user.employeeId },
    process.env.JWT_SECRET || 'freedom_car_and_truck_secret_key_2025_secure_jwt',
    { expiresIn: '7d' }
  );
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { emailOrEmployeeId, password } = req.body;

    if (!emailOrEmployeeId || !password) {
      throw new AppError('Please provide employee ID / email and password.', 400);
    }

    const user = await User.findOne({
      $or: [
        { email: emailOrEmployeeId.toLowerCase().trim() },
        { employeeId: emailOrEmployeeId.toUpperCase().trim() },
      ],
    });

    if (!user) {
      throw new AppError('Invalid credentials.', 401);
    }

    if (user.status !== 'active') {
      throw new AppError('Account is inactive. Contact management.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid credentials.', 401);
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    await recordAuditLog(
      { user, ip: req.ip, socket: req.socket } as any,
      'USER_LOGIN',
      'User',
      user._id.toString(),
      { employeeId: user.employeeId, role: user.role }
    );

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        passwordPolicyAcknowledged: user.passwordPolicyAcknowledged,
        workstationLockedAcknowledged: user.workstationLockedAcknowledged,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const register = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { employeeId, name, email, password, role, phone, department } = req.body;

    if (!employeeId || !name || !email || !password || !role) {
      throw new AppError('All required employee fields must be provided.', 400);
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { employeeId: employeeId.toUpperCase() }],
    });

    if (existingUser) {
      throw new AppError('User with this email or Employee ID already exists.', 400);
    }

    const user = await User.create({
      employeeId: employeeId.toUpperCase().trim(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      phone: phone?.trim(),
      department: department?.trim() || 'Workshop Operations',
      status: 'active',
    });

    await recordAuditLog(
      req,
      'USER_CREATED',
      'User',
      user._id.toString(),
      { newEmployeeId: user.employeeId, role: user.role }
    );

    res.status(201).json({
      success: true,
      message: 'Employee registered successfully.',
      user: {
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.json({
      success: true,
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
};

export const getUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role, status } = req.query;
    const filter: any = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const users = await User.find(filter).select('-password').sort({ employeeId: 1 });
    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    next(err);
  }
};

export const updateUserStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, role } = req.body;

    const user = await User.findById(id);
    if (!user) throw new AppError('User not found', 404);

    if (status) user.status = status;
    if (role) user.role = role;
    await user.save();

    await recordAuditLog(
      req,
      'USER_STATUS_UPDATED',
      'User',
      user._id.toString(),
      { status, role }
    );

    res.json({
      success: true,
      message: 'User updated successfully.',
      user: {
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const acknowledgePolicy = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { policyType, signature } = req.body;
    if (!policyType || !signature) {
      throw new AppError('Policy type and signature are required.', 400);
    }

    const titles: Record<string, string> = {
      PASSWORD_POLICY: 'OFF-007 Password Saving & Auto-Login Prohibition Policy',
      NO_PERSONAL_ACCOUNTS: 'OFF-002 & OFF-003 Personal Accounts & Cloud Sync Prohibition',
      DATA_STORAGE: 'OFF-010 Authorized Business Data Storage Compliance',
      INDIVIDUAL_CREDENTIALS: 'OFF-011 Individual Credentials & No Shared Access Policy',
    };

    const ack = await EmployeeAcknowledgment.create({
      employee: req.user!._id,
      employeeName: req.user!.name,
      employeeIdNumber: req.user!.employeeId,
      policyType,
      policyTitle: titles[policyType] || policyType,
      termsVersion: '2025.1',
      acknowledged: true,
      signature,
      signedAt: new Date(),
      ipAddress: req.ip,
    });

    if (policyType === 'PASSWORD_POLICY') {
      req.user!.passwordPolicyAcknowledged = true;
      await req.user!.save();
    }

    await recordAuditLog(
      req,
      'POLICY_ACKNOWLEDGED',
      'EmployeeAcknowledgment',
      ack._id.toString(),
      { policyType }
    );

    res.json({
      success: true,
      message: 'Policy successfully acknowledged.',
      acknowledgment: ack,
    });
  } catch (err) {
    next(err);
  }
};
