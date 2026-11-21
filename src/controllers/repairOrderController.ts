import { Response, NextFunction } from 'express';
import { RepairOrder, RepairOrderStatus } from '../models/RepairOrder.js';
import { Estimate } from '../models/Estimate.js';
import { TechnicianWorksheet } from '../models/TechnicianWorksheet.js';
import { User } from '../models/User.js';
import { WorkflowService } from '../services/workflowService.js';
import { AuthRequest, recordAuditLog } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const getRepairOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      status,
      technicianId,
      serviceWriterId,
      search,
      page = 1,
      limit = 25,
    } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (technicianId) query.assignedTechnician = technicianId;
    if (serviceWriterId) query.serviceWriter = serviceWriterId;

    const skip = (Number(page) - 1) * Number(limit);
    const [repairOrders, total] = await Promise.all([
      RepairOrder.find(query)
        .populate('customer', 'name phone email customerNumber')
        .populate('vehicle', 'year make model licensePlate vin currentMileage')
        .populate('serviceWriter', 'name employeeId')
        .populate('assignedTechnician', 'name employeeId')
        .populate('qcTechnician', 'name employeeId')
        .populate('currentEstimate')
        .populate('deposit')
        .populate('authorization')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      RepairOrder.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: repairOrders,
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

export const getRepairOrderById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const ro = await RepairOrder.findById(id)
      .populate('customer')
      .populate('vehicle')
      .populate('serviceWriter', 'name employeeId email')
      .populate('assignedTechnician', 'name employeeId')
      .populate('qcTechnician', 'name employeeId')
      .populate('currentEstimate')
      .populate('authorization')
      .populate('additionalAuthorizations')
      .populate('deposit')
      .populate('worksheet')
      .populate('invoice')
      .populate('timeline.performedBy', 'name employeeId');

    if (!ro) throw new AppError('Repair Order not found', 404);

    res.json({
      success: true,
      repairOrder: ro,
    });
  } catch (err) {
    next(err);
  }
};

export const createIntakeRepairOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { customer, vehicle, mileageIn, customerComplaint, requestedServices, notes } =
      req.body;

    if (!customer || !vehicle || mileageIn === undefined || !customerComplaint) {
      throw new AppError(
        'SOP SW-001, SW-002, SW-003: Customer, Vehicle, Mileage In, and Customer Complaint are required.',
        400
      );
    }

    const count = await RepairOrder.countDocuments();
    const roNumber = `RO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const ro = await RepairOrder.create({
      roNumber,
      customer,
      vehicle,
      mileageIn: Number(mileageIn),
      customerComplaint: customerComplaint.trim(),
      requestedServices: Array.isArray(requestedServices) ? requestedServices : [],
      status: 'INTAKE',
      serviceWriter: req.user!._id,
      notes,
      timeline: [
        {
          status: 'INTAKE',
          timestamp: new Date(),
          performedBy: req.user!._id,
          notes: 'Customer intake completed and vehicle checked in.',
        },
      ],
    });

    await recordAuditLog(
      req,
      'RO_INTAKE_CREATED',
      'RepairOrder',
      ro._id.toString(),
      { roNumber: ro.roNumber }
    );

    res.status(201).json({
      success: true,
      message: `Intake Repair Order #${ro.roNumber} created successfully.`,
      repairOrder: ro,
    });
  } catch (err) {
    next(err);
  }
};

export const dispatchTechnician = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { technicianId } = req.body;

    if (!technicianId) {
      throw new AppError('Technician assignment is required for dispatch.', 400);
    }

    const ro = await RepairOrder.findById(id);
    if (!ro) throw new AppError('Repair Order not found', 404);

    const techUser = await User.findById(technicianId);
    if (!techUser || techUser.status !== 'active') {
      throw new AppError('Assigned technician does not exist or is inactive.', 400);
    }

    // MANDATORY BACKEND ENFORCEMENT: Validate Rule 1 & Rule 2
    await WorkflowService.validateDispatchEligibility(ro);

    // Assign Tech and update status to DISPATCHED
    ro.assignedTechnician = techUser._id as any;
    ro.dispatchedAt = new Date();
    ro.status = 'DISPATCHED';

    // Auto-create or link Technician Worksheet (TECH-001)
    if (!ro.worksheet) {
      const count = await TechnicianWorksheet.countDocuments();
      const worksheetNumber = `TWS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      // Default inspection checklist items based on TECH-004 & TECH-005
      const standardInspectionItems = [
        { name: 'Steering Components & Linkage', category: 'Underbody & Steering', status: 'GREEN' },
        { name: 'Front Suspension & Shocks/Struts', category: 'Suspension', status: 'GREEN' },
        { name: 'Rear Suspension & Bushings', category: 'Suspension', status: 'GREEN' },
        { name: 'Wheel Bearings & Hubs', category: 'Wheels & Tires', status: 'GREEN' },
        { name: 'Tires Tread Depth & Wear Pattern', category: 'Wheels & Tires', status: 'GREEN', measurement: '8/32"' },
        { name: 'Front Brake Pads & Rotors', category: 'Braking System', status: 'GREEN', measurement: '8mm' },
        { name: 'Rear Brake Pads/Shoes & Drums/Rotors', category: 'Braking System', status: 'GREEN', measurement: '7mm' },
        { name: 'Engine Oil Leaks / Inspection', category: 'Engine & Leaks', status: 'GREEN' },
        { name: 'Transmission Leaks / Pan Inspection', category: 'Drivetrain', status: 'GREEN' },
        { name: 'Underbody Structural Integrity', category: 'Safety & Body', status: 'GREEN' },
        { name: 'Exhaust System & Catalytic Converter', category: 'Exhaust', status: 'GREEN' },
        { name: 'Drive Belts & Radiator Hoses', category: 'Underhood', status: 'GREEN' },
        { name: 'Battery Condition & Terminals', category: 'Electrical', status: 'GREEN' },
      ];

      // Lighting items based on TECH-002
      const lightingItems = [
        { name: 'Low Beam Headlights', status: 'GREEN' },
        { name: 'High Beam Headlights', status: 'GREEN' },
        { name: 'Left Turn Signals (Front/Rear)', status: 'GREEN' },
        { name: 'Right Turn Signals (Front/Rear)', status: 'GREEN' },
        { name: 'Parking & Marker Lights', status: 'GREEN' },
        { name: 'Primary Brake Lights', status: 'GREEN' },
        { name: 'Taillights', status: 'GREEN' },
        { name: 'Reverse Back-Up Lights', status: 'GREEN' },
        { name: 'Third Center Brake Light', status: 'GREEN' },
      ];

      // Fluid items based on TECH-006 & TECH-007
      const fluidItems = [
        { fluidName: 'Engine Oil', specVerified: false, levelOk: true, leakChecked: true },
        { fluidName: 'Automatic / Manual Transmission Fluid', specVerified: false, levelOk: true, leakChecked: true },
        { fluidName: 'Brake Fluid DOT 3/4', specVerified: false, levelOk: true, leakChecked: true },
        { fluidName: 'Engine Coolant / Antifreeze', specVerified: false, levelOk: true, leakChecked: true },
        { fluidName: 'Power Steering Fluid', specVerified: false, levelOk: true, leakChecked: true },
        { fluidName: 'Differential / Transfer Case Fluid', specVerified: false, levelOk: true, leakChecked: true },
      ];

      const worksheet = await TechnicianWorksheet.create({
        worksheetNumber,
        repairOrder: ro._id,
        vehicle: ro.vehicle,
        customer: ro.customer,
        recordedMileage: ro.mileageIn,
        lightingInspection: {
          performed: false,
          operatorEmployee: techUser._id,
          observerEmployee: req.user!._id,
          items: lightingItems,
        },
        liftSafetyInspection: {
          performed: false,
          padsPositioned: false,
          locksEngaged: false,
          verifiedBy: techUser._id,
        },
        fullVehicleInspection: {
          performed: false,
          items: standardInspectionItems,
          hasRedFlags: false,
          redFlagCount: 0,
          yellowFlagCount: 0,
        },
        fluidVerification: {
          performed: false,
          fluids: fluidItems,
        },
        initialSignoff: {
          technician: techUser._id,
          employeeId: techUser.employeeId,
        },
        qcInspection: {
          qcTechnician: undefined,
          employeeId: '',
          reinspectionResult: 'PENDING',
        },
        exitObservation: {
          performed: false,
          leaksObservedOnExit: false,
          abnormalNoisesOrExhaust: false,
          exitPassed: false,
        },
        finalReleaseVerification: {
          verified: false,
          bothTechSignaturesVerified: false,
          allSafetyIssuesResolved: false,
          releasePermitted: false,
        },
        status: 'IN_PROGRESS',
      });

      ro.worksheet = worksheet._id as any;
    }

    ro.timeline.push({
      status: 'DISPATCHED',
      timestamp: new Date(),
      performedBy: req.user!._id,
      notes: `Dispatched to Technician ${techUser.name} (${techUser.employeeId}). Authorization & deposit requirements verified (SW-009).`,
    });

    await ro.save();

    await recordAuditLog(
      req,
      'TECHNICIAN_DISPATCHED',
      'RepairOrder',
      ro._id.toString(),
      {
        roNumber: ro.roNumber,
        technician: techUser.name,
        technicianId: techUser.employeeId,
      }
    );

    res.json({
      success: true,
      message: `Technician ${techUser.name} dispatched to Repair Order #${ro.roNumber} (SW-009).`,
      repairOrder: ro,
    });
  } catch (err) {
    next(err);
  }
};

export const updateROStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const ro = await RepairOrder.findById(id);
    if (!ro) throw new AppError('Repair Order not found', 404);

    const isManager = ['manager', 'admin'].includes(req.user!.role);
    WorkflowService.validateStatusTransition(ro.status, status, isManager);

    // If moving to RELEASED or CLOSED, validate release rules (Rule 4 & Rule 5)
    if (status === 'RELEASED' || status === 'CLOSED') {
      await WorkflowService.validateReleaseEligibility(ro);
    }

    ro.status = status;
    ro.timeline.push({
      status,
      timestamp: new Date(),
      performedBy: req.user!._id,
      notes: notes || `Status updated to ${status}.`,
    });

    await ro.save();

    await recordAuditLog(
      req,
      'RO_STATUS_CHANGED',
      'RepairOrder',
      ro._id.toString(),
      { roNumber: ro.roNumber, newStatus: status }
    );

    res.json({
      success: true,
      message: `Repair Order status updated to ${status}.`,
      repairOrder: ro,
    });
  } catch (err) {
    next(err);
  }
};

export const managerOverride = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, reason, correctiveAction, targetStatus } = req.body;

    if (!['manager', 'admin'].includes(req.user!.role)) {
      throw new AppError('Only Managers or Administrators may execute operational overrides.', 403);
    }

    if (!action || !reason || !correctiveAction) {
      throw new AppError(
        'SOP Mandatory Rule 8: Every exception requires specific reason, manager identity, timestamp, and corrective action.',
        400
      );
    }

    const ro = await RepairOrder.findById(id);
    if (!ro) throw new AppError('Repair Order not found', 404);

    // Rule 9: Safety exceptions must NEVER bypass safe vehicle release
    if (action.includes('SAFETY_RELEASE_OVERRIDE') || targetStatus === 'RELEASED') {
      if (ro.hasSafetyConcerns) {
        throw new AppError(
          'SOP Mandatory Rule 9: Safety exceptions must NEVER bypass safe vehicle release. Vehicles with unresolved RED safety defects cannot be released under any circumstances.',
          403
        );
      }
    }

    const overrideEntry = {
      action,
      reason,
      managerId: req.user!._id,
      timestamp: new Date(),
      correctiveAction,
    };

    ro.overrideHistory.push(overrideEntry as any);

    if (targetStatus) {
      ro.status = targetStatus;
    }

    ro.timeline.push({
      status: ro.status,
      timestamp: new Date(),
      performedBy: req.user!._id,
      notes: `MANAGERIAL OVERRIDE [${action}]: ${reason}. Action: ${correctiveAction}. Performed by ${req.user!.name} (${req.user!.employeeId}).`,
    });

    await ro.save();

    await recordAuditLog(
      req,
      'MANAGERIAL_OVERRIDE_EXECUTED',
      'RepairOrder',
      ro._id.toString(),
      {
        roNumber: ro.roNumber,
        action,
        reason,
        correctiveAction,
        manager: req.user!.name,
      }
    );

    res.json({
      success: true,
      message: `Managerial override documented and executed for RO #${ro.roNumber}.`,
      repairOrder: ro,
    });
  } catch (err) {
    next(err);
  }
};
