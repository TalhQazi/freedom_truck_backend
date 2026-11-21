import { Response, NextFunction } from 'express';
import {
  ComputerModificationRequest,
  ModificationActionType,
} from '../models/ComputerModificationRequest.js';
import { DailySecurityChecklist } from '../models/DailySecurityChecklist.js';
import { SecurityIncident } from '../models/SecurityIncident.js';
import { AuthRequest, recordAuditLog } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Computer Modification Requests (OFF-004, OFF-005, OFF-006)
 */
export const getModificationRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, page = 1, limit = 25 } = req.query;
    const query: any = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [requests, total] = await Promise.all([
      ComputerModificationRequest.find(query)
        .populate('employee', 'name employeeId role')
        .populate('approver', 'name employeeId role')
        .populate('implementedBy', 'name employeeId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ComputerModificationRequest.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: requests,
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

export const submitModificationRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      workstationIdentifier,
      requestedAction,
      softwareOrSettingName,
      description,
      businessReason,
    } = req.body;

    if (
      !workstationIdentifier ||
      !requestedAction ||
      !softwareOrSettingName ||
      !description ||
      !businessReason
    ) {
      throw new AppError(
        'SOP OFF-005: Workstation Identifier, Requested Action, Software/Setting Name, Description, and Business Reason are mandatory.',
        400
      );
    }

    const count = await ComputerModificationRequest.countDocuments();
    const requestId = `CMR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const request = await ComputerModificationRequest.create({
      requestId,
      employee: req.user!._id,
      employeeName: req.user!.name,
      employeeIdNumber: req.user!.employeeId,
      workstationIdentifier: workstationIdentifier.trim(),
      requestedAction,
      softwareOrSettingName: softwareOrSettingName.trim(),
      description: description.trim(),
      businessReason: businessReason.trim(),
      status: 'SUBMITTED',
    });

    await recordAuditLog(
      req,
      'COMPUTER_MODIFICATION_REQUESTED',
      'ComputerModificationRequest',
      request._id.toString(),
      {
        requestId: request.requestId,
        requestedAction,
        softwareOrSettingName,
      }
    );

    res.status(201).json({
      success: true,
      message: `Computer modification request #${request.requestId} submitted for management review (OFF-005).`,
      request,
    });
  } catch (err) {
    next(err);
  }
};

export const reviewModificationRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { decision, decisionNotes } = req.body;

    if (!['manager', 'admin'].includes(req.user!.role)) {
      throw new AppError(
        'SOP OFF-006: Only Managers or System Administrators may review and approve computer modification requests.',
        403
      );
    }

    if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
      throw new AppError('Decision must be either APPROVED or REJECTED.', 400);
    }

    const request = await ComputerModificationRequest.findById(id);
    if (!request) throw new AppError('Modification request not found', 404);

    request.approver = req.user!._id;
    request.decision = decision;
    request.decisionNotes = decisionNotes;
    request.decisionTimestamp = new Date();
    request.status = decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';

    await request.save();

    await recordAuditLog(
      req,
      'COMPUTER_MODIFICATION_REVIEWED',
      'ComputerModificationRequest',
      request._id.toString(),
      {
        requestId: request.requestId,
        decision,
        manager: req.user!.name,
      }
    );

    res.json({
      success: true,
      message: `Computer modification request #${request.requestId} was ${decision} by ${req.user!.name} (OFF-006).`,
      request,
    });
  } catch (err) {
    next(err);
  }
};

export const implementModification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { implementationNotes } = req.body;

    const request = await ComputerModificationRequest.findById(id);
    if (!request) throw new AppError('Modification request not found', 404);

    // MANDATORY RULE 6: No computer modification without written management approval
    if (request.status !== 'APPROVED') {
      throw new AppError(
        'SOP Mandatory Rule 6 Violation: Cannot implement computer modification without documented management approval (OFF-004, OFF-006).',
        403
      );
    }

    request.implementedBy = req.user!._id;
    request.implementationTimestamp = new Date();
    request.implementationNotes = implementationNotes || 'Implemented per approved authorization.';
    request.status = 'IMPLEMENTED';

    await request.save();

    await recordAuditLog(
      req,
      'COMPUTER_MODIFICATION_IMPLEMENTED',
      'ComputerModificationRequest',
      request._id.toString(),
      {
        requestId: request.requestId,
        implementedBy: req.user!.name,
      }
    );

    res.json({
      success: true,
      message: `Modification #${request.requestId} recorded as IMPLEMENTED.`,
      request,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Daily Security Checklist (OFF-008, OFF-009, OFF-010)
 */
export const getDailySecurityChecklists = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { date, page = 1, limit = 25 } = req.query;
    const query: any = {};
    if (date) query.businessDate = String(date);

    const skip = (Number(page) - 1) * Number(limit);
    const [checklists, total] = await Promise.all([
      DailySecurityChecklist.find(query)
        .populate('completedBy', 'name employeeId role')
        .populate('managerReview.reviewedBy', 'name employeeId')
        .sort({ businessDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      DailySecurityChecklist.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: checklists,
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

export const submitDailySecurityChecklist = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      businessDate,
      companyAccountsOnlyVerified,
      personalEmailProhibitedVerified,
      personalCloudSyncDisabledVerified,
      noAutoLoginObserved,
      allWorkstationsLockedAtClose,
      allTerminalsSignedOut,
      businessDataStorageCompliant,
      noSharedCredentialsObserved,
      notes,
      signature,
    } = req.body;

    if (!businessDate || !signature) {
      throw new AppError(
        'SOP OFF-008/009: Business Date and Employee Signature are mandatory.',
        400
      );
    }

    const count = await DailySecurityChecklist.countDocuments();
    const checklistNumber = `SEC-CHK-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const checklist = await DailySecurityChecklist.create({
      checklistNumber,
      businessDate,
      completedBy: req.user!._id,
      employeeName: req.user!.name,
      employeeIdNumber: req.user!.employeeId,
      companyAccountsOnlyVerified: Boolean(companyAccountsOnlyVerified),
      personalEmailProhibitedVerified: Boolean(personalEmailProhibitedVerified),
      personalCloudSyncDisabledVerified: Boolean(personalCloudSyncDisabledVerified),
      noAutoLoginObserved: Boolean(noAutoLoginObserved),
      allWorkstationsLockedAtClose: Boolean(allWorkstationsLockedAtClose),
      allTerminalsSignedOut: Boolean(allTerminalsSignedOut),
      businessDataStorageCompliant: Boolean(businessDataStorageCompliant),
      noSharedCredentialsObserved: Boolean(noSharedCredentialsObserved),
      notes,
      signature,
      signedAt: new Date(),
      status: 'COMPLETED',
    });

    await recordAuditLog(
      req,
      'DAILY_SECURITY_CHECKLIST_SUBMITTED',
      'DailySecurityChecklist',
      checklist._id.toString(),
      {
        checklistNumber: checklist.checklistNumber,
        businessDate,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Daily information security checklist submitted successfully (OFF-008, OFF-009, OFF-010).',
      checklist,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Security Incident Reporting & Escalation (OFF-012)
 */
export const getSecurityIncidents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { severity, status, page = 1, limit = 25 } = req.query;
    const query: any = {};
    if (severity) query.severity = severity;
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [incidents, total] = await Promise.all([
      SecurityIncident.find(query)
        .populate('reportedBy', 'name employeeId role')
        .populate('assignedInvestigator', 'name employeeId')
        .populate('managementReview.manager', 'name employeeId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      SecurityIncident.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: incidents,
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

export const reportSecurityIncident = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      incidentType,
      severity,
      description,
      workstationOrDevice,
      systemsImpacted,
      immediateContainmentTaken,
    } = req.body;

    if (!title || !incidentType || !description || !workstationOrDevice) {
      throw new AppError(
        'SOP OFF-012: Title, Incident Type, Description, and Impacted Workstation/Device are mandatory.',
        400
      );
    }

    const count = await SecurityIncident.countDocuments();
    const incidentId = `SEC-INC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const incident = await SecurityIncident.create({
      incidentId,
      title: title.trim(),
      incidentType: incidentType.trim(),
      severity: severity || 'MEDIUM',
      description: description.trim(),
      reportedBy: req.user!._id,
      reporterName: req.user!.name,
      workstationOrDevice: workstationOrDevice.trim(),
      systemsImpacted: Array.isArray(systemsImpacted) ? systemsImpacted : [],
      immediateContainmentTaken,
      escalatedToManagement: true,
      status: 'OPEN',
    });

    await recordAuditLog(
      req,
      'SECURITY_INCIDENT_REPORTED',
      'SecurityIncident',
      incident._id.toString(),
      {
        incidentId: incident.incidentId,
        severity: incident.severity,
        title: incident.title,
      }
    );

    res.status(201).json({
      success: true,
      message: `Security incident #${incident.incidentId} reported and escalated to management (OFF-012).`,
      incident,
    });
  } catch (err) {
    next(err);
  }
};
