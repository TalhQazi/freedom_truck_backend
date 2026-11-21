import { Response, NextFunction } from 'express';
import { TechnicianWorksheet } from '../models/TechnicianWorksheet.js';
import { RepairOrder } from '../models/RepairOrder.js';
import { User } from '../models/User.js';
import { AuthRequest, recordAuditLog } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const getWorksheets = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, technicianId, page = 1, limit = 25 } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (technicianId) query['initialSignoff.technician'] = technicianId;

    const skip = (Number(page) - 1) * Number(limit);
    const [worksheets, total] = await Promise.all([
      TechnicianWorksheet.find(query)
        .populate('customer', 'name phone customerNumber')
        .populate('vehicle', 'year make model licensePlate vin currentMileage')
        .populate('repairOrder', 'roNumber status')
        .populate('initialSignoff.technician', 'name employeeId')
        .populate('qcInspection.qcTechnician', 'name employeeId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      TechnicianWorksheet.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: worksheets,
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

export const getWorksheetById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const worksheet = await TechnicianWorksheet.findById(id)
      .populate('customer')
      .populate('vehicle')
      .populate('repairOrder')
      .populate('lightingInspection.operatorEmployee', 'name employeeId')
      .populate('lightingInspection.observerEmployee', 'name employeeId')
      .populate('liftSafetyInspection.verifiedBy', 'name employeeId')
      .populate('initialSignoff.technician', 'name employeeId')
      .populate('qcInspection.qcTechnician', 'name employeeId')
      .populate('exitObservation.observer', 'name employeeId')
      .populate('finalReleaseVerification.serviceWriter', 'name employeeId');

    if (!worksheet) throw new AppError('Technician Worksheet not found', 404);

    res.json({
      success: true,
      worksheet,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * TECH-002: Two-Person Lighting Inspection
 */
export const updateLightingInspection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { operatorEmployeeId, observerEmployeeId, items } = req.body;

    const worksheet = await TechnicianWorksheet.findById(id);
    if (!worksheet) throw new AppError('Worksheet not found', 404);

    const operator = operatorEmployeeId || req.user!._id;
    const observer = observerEmployeeId;

    if (!observer) {
      throw new AppError(
        'SOP TECH-002 Violation: Two employees are required for lighting inspection. One operates controls while the other observes exterior lights.',
        400
      );
    }

    worksheet.lightingInspection = {
      performed: true,
      operatorEmployee: operator,
      observerEmployee: observer,
      items: Array.isArray(items) ? items : worksheet.lightingInspection.items,
    };

    await worksheet.save();

    await recordAuditLog(
      req,
      'TECH_LIGHTING_INSPECTION_COMPLETED',
      'TechnicianWorksheet',
      worksheet._id.toString(),
      { worksheetNumber: worksheet.worksheetNumber }
    );

    res.json({
      success: true,
      message: 'Two-person lighting inspection recorded (TECH-002).',
      worksheet,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * TECH-003: Vehicle Lift Safety Inspection
 */
export const updateLiftSafety = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { padsPositioned, locksEngaged } = req.body;

    if (!padsPositioned || !locksEngaged) {
      throw new AppError(
        'SOP TECH-003: Both arm pads positioning and mechanical lock engagement must be verified before working under vehicle.',
        400
      );
    }

    const worksheet = await TechnicianWorksheet.findById(id);
    if (!worksheet) throw new AppError('Worksheet not found', 404);

    worksheet.liftSafetyInspection = {
      performed: true,
      padsPositioned: true,
      locksEngaged: true,
      verifiedBy: req.user!._id,
      verifiedAt: new Date(),
    };

    await worksheet.save();

    await recordAuditLog(
      req,
      'TECH_LIFT_SAFETY_VERIFIED',
      'TechnicianWorksheet',
      worksheet._id.toString(),
      { worksheetNumber: worksheet.worksheetNumber }
    );

    res.json({
      success: true,
      message: 'Vehicle lift safety inspection verified (TECH-003).',
      worksheet,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * TECH-004 & TECH-005: Full Vehicle Inspection (GREEN, YELLOW, RED)
 */
export const updateFullInspection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('Inspection items array is required (TECH-004).', 400);
    }

    const worksheet = await TechnicianWorksheet.findById(id);
    if (!worksheet) throw new AppError('Worksheet not found', 404);

    const redCount = items.filter((i: any) => i.status === 'RED').length;
    const yellowCount = items.filter((i: any) => i.status === 'YELLOW').length;
    const hasRedFlags = redCount > 0;

    worksheet.fullVehicleInspection = {
      performed: true,
      items,
      hasRedFlags,
      redFlagCount: redCount,
      yellowFlagCount: yellowCount,
    };

    // Update Repair Order safety flags
    const ro = await RepairOrder.findById(worksheet.repairOrder);
    if (ro) {
      ro.hasSafetyConcerns = hasRedFlags;
      ro.unresolvedSafetyCount = redCount;
      if (hasRedFlags) {
        ro.timeline.push({
          status: ro.status,
          timestamp: new Date(),
          performedBy: req.user!._id,
          notes: `SAFETY WARNING: ${redCount} RED urgent safety concern(s) identified during vehicle inspection (TECH-005).`,
        });
      }
      await ro.save();
    }

    await worksheet.save();

    await recordAuditLog(
      req,
      'TECH_FULL_INSPECTION_RECORDED',
      'TechnicianWorksheet',
      worksheet._id.toString(),
      {
        worksheetNumber: worksheet.worksheetNumber,
        redCount,
        yellowCount,
      }
    );

    res.json({
      success: true,
      message: `Full vehicle inspection recorded (TECH-004, TECH-005). ${redCount} RED flag(s), ${yellowCount} YELLOW flag(s).`,
      worksheet,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * TECH-006 & TECH-007: Fluid Specification & Service Verification
 */
export const updateFluidsVerification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { fluids } = req.body;

    if (!Array.isArray(fluids)) {
      throw new AppError('Fluids array is required (TECH-006).', 400);
    }

    const worksheet = await TechnicianWorksheet.findById(id);
    if (!worksheet) throw new AppError('Worksheet not found', 404);

    worksheet.fluidVerification = {
      performed: true,
      fluids,
    };

    await worksheet.save();

    await recordAuditLog(
      req,
      'TECH_FLUIDS_VERIFIED',
      'TechnicianWorksheet',
      worksheet._id.toString(),
      { worksheetNumber: worksheet.worksheetNumber }
    );

    res.json({
      success: true,
      message: 'Manufacturer fluid specifications and leak checks verified (TECH-006, TECH-007).',
      worksheet,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * TECH-008: Initial Technician Signoff (Tech #1)
 */
export const initialTechnicianSignoff = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { signature, laborCompletedNotes } = req.body;

    if (!signature) {
      throw new AppError('SOP TECH-008: Technician signature is mandatory for initial signoff.', 400);
    }

    const worksheet = await TechnicianWorksheet.findById(id);
    if (!worksheet) throw new AppError('Worksheet not found', 404);

    // Verify prerequisites
    if (!worksheet.liftSafetyInspection?.performed) {
      throw new AppError('SOP TECH-003: Vehicle lift safety must be verified before signoff.', 400);
    }
    if (!worksheet.fullVehicleInspection?.performed) {
      throw new AppError('SOP TECH-004: Full vehicle inspection must be completed before signoff.', 400);
    }

    worksheet.initialSignoff = {
      technician: req.user!._id,
      employeeId: req.user!.employeeId,
      signature,
      signedAt: new Date(),
      laborCompletedNotes,
    };
    worksheet.status = 'TECH1_COMPLETE';
    await worksheet.save();

    const ro = await RepairOrder.findById(worksheet.repairOrder);
    if (ro) {
      ro.status = 'QC_PENDING';
      ro.timeline.push({
        status: 'TECH1_SIGNED',
        timestamp: new Date(),
        performedBy: req.user!._id,
        notes: `Technician #1 (${req.user!.name}, ${req.user!.employeeId}) completed repairs and signed worksheet (TECH-008). Queued for independent QC.`,
      });
      await ro.save();
    }

    await recordAuditLog(
      req,
      'TECH1_SIGNOFF_COMPLETED',
      'TechnicianWorksheet',
      worksheet._id.toString(),
      {
        worksheetNumber: worksheet.worksheetNumber,
        technician: req.user!.name,
        technicianId: req.user!.employeeId,
      }
    );

    res.json({
      success: true,
      message: 'Initial technician signoff recorded (TECH-008). Ready for independent QC inspection.',
      worksheet,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * TECH-009, TECH-010, TECH-011: Independent Quality Control Signoff (Tech #2)
 * MANDATORY ENFORCEMENT: Tech #2 must != Tech #1!
 */
export const independentQCSignoff = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      workCompletedVerified,
      safetyConcernsVerified,
      fluidsVerified,
      leaksVerified,
      lightsVerified,
      tiresTorquedVerified,
      fastenersTorquedVerified,
      originalComplaintResolved,
      discrepanciesFound,
      discrepancyDetails,
      correctiveActionTaken,
      reinspectionResult,
      signature,
    } = req.body;

    const worksheet = await TechnicianWorksheet.findById(id);
    if (!worksheet) throw new AppError('Worksheet not found', 404);

    if (!worksheet.initialSignoff?.technician) {
      throw new AppError('Cannot perform QC inspection before Tech #1 completes and signs work (TECH-008).', 400);
    }

    // MANDATORY SOP RULE 4 ENFORCEMENT: Tech #1 != Tech #2
    const tech1Id = worksheet.initialSignoff.technician.toString();
    const currentUserId = req.user!._id.toString();

    if (tech1Id === currentUserId) {
      throw new AppError(
        'SOP MANDATORY RULE 4 VIOLATION: Independent Quality Control (Tech #2) CANNOT be signed by the primary technician (Tech #1). An independent technician or manager must perform this inspection (TECH-009, TECH-011).',
        403
      );
    }

    if (discrepanciesFound && (!correctiveActionTaken || reinspectionResult !== 'PASSED')) {
      // Discrepancy logged - vehicle release stopped under TECH-010
      worksheet.qcInspection = {
        qcTechnician: req.user!._id,
        employeeId: req.user!.employeeId,
        workCompletedVerified: Boolean(workCompletedVerified),
        safetyConcernsVerified: Boolean(safetyConcernsVerified),
        fluidsVerified: Boolean(fluidsVerified),
        leaksVerified: Boolean(leaksVerified),
        lightsVerified: Boolean(lightsVerified),
        tiresTorquedVerified: Boolean(tiresTorquedVerified),
        fastenersTorquedVerified: Boolean(fastenersTorquedVerified),
        originalComplaintResolved: Boolean(originalComplaintResolved),
        discrepanciesFound: true,
        discrepancyDetails,
        correctiveActionTaken,
        reinspectionResult: 'FAILED',
        signature,
        signedAt: new Date(),
      };
      worksheet.status = 'QC_DISCREPANCY';
      await worksheet.save();

      const ro = await RepairOrder.findById(worksheet.repairOrder);
      if (ro) {
        ro.status = 'QC_DISCREPANCY';
        ro.qcTechnician = req.user!._id as any;
        ro.timeline.push({
          status: 'QC_DISCREPANCY',
          timestamp: new Date(),
          performedBy: req.user!._id,
          notes: `QC DISCREPANCY FLAGGED by ${req.user!.name} (${req.user!.employeeId}): ${discrepancyDetails}. Release STOPPED (TECH-010).`,
        });
        await ro.save();
      }

      await recordAuditLog(
        req,
        'QC_DISCREPANCY_FLAGGED',
        'TechnicianWorksheet',
        worksheet._id.toString(),
        { discrepancyDetails, qcTechnician: req.user!.name }
      );

      res.status(400).json({
        success: false,
        message: `QC Discrepancy logged: ${discrepancyDetails}. Vehicle release stopped pending corrective action and reinspection (TECH-010).`,
        worksheet,
      });
      return;
    }

    if (!signature) {
      throw new AppError('QC Technician signature is required (TECH-011).', 400);
    }

    worksheet.qcInspection = {
      qcTechnician: req.user!._id,
      employeeId: req.user!.employeeId,
      workCompletedVerified: Boolean(workCompletedVerified),
      safetyConcernsVerified: Boolean(safetyConcernsVerified),
      fluidsVerified: Boolean(fluidsVerified),
      leaksVerified: Boolean(leaksVerified),
      lightsVerified: Boolean(lightsVerified),
      tiresTorquedVerified: Boolean(tiresTorquedVerified),
      fastenersTorquedVerified: Boolean(fastenersTorquedVerified),
      originalComplaintResolved: Boolean(originalComplaintResolved),
      discrepanciesFound: false,
      discrepancyDetails: undefined,
      correctiveActionTaken: correctiveActionTaken || 'All items verified and passed inspection.',
      reinspectionResult: 'PASSED',
      reinspectedAt: new Date(),
      signature,
      signedAt: new Date(),
    };
    worksheet.status = 'QC_PASSED';
    await worksheet.save();

    const ro = await RepairOrder.findById(worksheet.repairOrder);
    if (ro) {
      ro.qcTechnician = req.user!._id as any;
      ro.status = 'QC_APPROVED';
      ro.timeline.push({
        status: 'QC_APPROVED',
        timestamp: new Date(),
        performedBy: req.user!._id,
        notes: `Independent QC passed and signed by Technician #2 (${req.user!.name}, ${req.user!.employeeId}) (TECH-009, TECH-011).`,
      });
      await ro.save();
    }

    await recordAuditLog(
      req,
      'QC_INDEPENDENT_SIGNOFF_PASSED',
      'TechnicianWorksheet',
      worksheet._id.toString(),
      {
        worksheetNumber: worksheet.worksheetNumber,
        tech1Id: worksheet.initialSignoff.employeeId,
        tech2Id: req.user!.employeeId,
      }
    );

    res.json({
      success: true,
      message: `Independent QC inspection verified and signed by ${req.user!.name} (${req.user!.employeeId}) (TECH-009, TECH-011).`,
      worksheet,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * TECH-012: Vehicle Exit Observation
 */
export const updateExitObservation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { leaksObservedOnExit, abnormalNoisesOrExhaust, exitNotes } = req.body;

    const worksheet = await TechnicianWorksheet.findById(id);
    if (!worksheet) throw new AppError('Worksheet not found', 404);

    const exitPassed = !leaksObservedOnExit && !abnormalNoisesOrExhaust;

    worksheet.exitObservation = {
      performed: true,
      observer: req.user!._id,
      observedAt: new Date(),
      leaksObservedOnExit: Boolean(leaksObservedOnExit),
      abnormalNoisesOrExhaust: Boolean(abnormalNoisesOrExhaust),
      exitNotes,
      exitPassed,
    };

    if (exitPassed) {
      worksheet.status = 'RELEASE_READY';
    }

    await worksheet.save();

    const ro = await RepairOrder.findById(worksheet.repairOrder);
    if (ro) {
      ro.status = exitPassed ? 'EXIT_OBSERVED' : 'QC_DISCREPANCY';
      ro.timeline.push({
        status: ro.status,
        timestamp: new Date(),
        performedBy: req.user!._id,
        notes: exitPassed
          ? `Vehicle exit observation completed. No leaks or abnormal noises detected (TECH-012). Ready for Service Writer verification.`
          : `Exit observation FLAGGED leaks or abnormal noises: ${exitNotes}. Delivery halted.`,
      });
      await ro.save();
    }

    await recordAuditLog(
      req,
      'VEHICLE_EXIT_OBSERVED',
      'TechnicianWorksheet',
      worksheet._id.toString(),
      { exitPassed, observer: req.user!.name }
    );

    res.json({
      success: true,
      message: exitPassed
        ? 'Vehicle exit observation passed (TECH-012).'
        : 'Exit observation flagged issues; delivery stopped.',
      worksheet,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * SW-010: Service Writer Final Release Verification
 */
export const serviceWriterReleaseVerification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const worksheet = await TechnicianWorksheet.findById(id);
    if (!worksheet) throw new AppError('Worksheet not found', 404);

    // Rule 4: Verify two distinct technician signatures
    const tech1Sign = worksheet.initialSignoff?.signature;
    const qcSign = worksheet.qcInspection?.signature;
    const tech1Id = worksheet.initialSignoff?.technician?.toString();
    const tech2Id = worksheet.qcInspection?.qcTechnician?.toString();

    if (!tech1Sign || !qcSign || !tech1Id || !tech2Id) {
      throw new AppError(
        'SOP SW-010 Violation: Both Tech #1 initial signature and Tech #2 QC signature must be present before release verification.',
        400
      );
    }

    if (tech1Id === tech2Id) {
      throw new AppError(
        'SOP Mandatory Rule 4 Violation: Technician #1 and QC Technician #2 MUST be distinct employees.',
        403
      );
    }

    // Rule 5: Unresolved safety issues check
    if (worksheet.fullVehicleInspection?.hasRedFlags) {
      throw new AppError(
        'SOP Mandatory Rule 5 Violation: Unresolved RED safety defects exist. Cannot release vehicle (SW-010).',
        400
      );
    }

    worksheet.finalReleaseVerification = {
      verified: true,
      serviceWriter: req.user!._id,
      verifiedAt: new Date(),
      bothTechSignaturesVerified: true,
      allSafetyIssuesResolved: true,
      releasePermitted: true,
      notes,
    };

    await worksheet.save();

    const ro = await RepairOrder.findById(worksheet.repairOrder);
    if (ro) {
      ro.status = 'READY_FOR_INVOICE';
      ro.timeline.push({
        status: 'READY_FOR_INVOICE',
        timestamp: new Date(),
        performedBy: req.user!._id,
        notes: `Final worksheet verified by Service Writer ${req.user!.name}. Dual technician signatures confirmed (SW-010). Ready for invoicing.`,
      });
      await ro.save();
    }

    await recordAuditLog(
      req,
      'SERVICE_WRITER_FINAL_RELEASE_VERIFIED',
      'TechnicianWorksheet',
      worksheet._id.toString(),
      { worksheetNumber: worksheet.worksheetNumber }
    );

    res.json({
      success: true,
      message: 'Service writer release verification complete. Ready for invoice generation (SW-010, SW-011).',
      worksheet,
    });
  } catch (err) {
    next(err);
  }
};
