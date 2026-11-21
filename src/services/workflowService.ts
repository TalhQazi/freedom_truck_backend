import { IRepairOrder, RepairOrderStatus } from '../models/RepairOrder.js';
import { TechnicianWorksheet } from '../models/TechnicianWorksheet.js';
import { Authorization } from '../models/Authorization.js';
import { Deposit } from '../models/Deposit.js';
import { Estimate } from '../models/Estimate.js';
import { AppError } from '../middleware/errorHandler.js';

export class WorkflowService {
  /**
   * Validate if repair order is eligible for technician dispatch
   * Enforces Rule 1 & Rule 2
   */
  static async validateDispatchEligibility(ro: IRepairOrder): Promise<void> {
    if (!ro.currentEstimate) {
      throw new AppError(
        'SOP Violation: Cannot dispatch technician without an approved Estimate (SW-003, SW-006).'
      );
    }

    const estimate = await Estimate.findById(ro.currentEstimate);
    if (!estimate) {
      throw new AppError('Estimate not found for this Repair Order.');
    }

    // Rule 1: Customer Authorization with Signature
    if (!ro.authorization) {
      throw new AppError(
        'SOP Mandatory Rule 1 Violation: No technician dispatch without signed customer authorization (SW-007).'
      );
    }

    const auth = await Authorization.findById(ro.authorization);
    if (!auth || !auth.customerSignature || !auth.signedAt) {
      throw new AppError(
        'SOP Mandatory Rule 1 Violation: Valid customer digital signature and signed authorization record are required before dispatch.'
      );
    }

    // Rule 2: Deposit Requirement for ROs exceeding $500
    if (estimate.grandTotal > 500) {
      if (!ro.deposit) {
        throw new AppError(
          `SOP Mandatory Rule 2 Violation: Repair order total ($${estimate.grandTotal.toFixed(
            2
          )}) exceeds $500.00. A 50% deposit ($${estimate.depositRequired.toFixed(
            2
          )}) must be collected and verified before work starts (SW-008, SW-009).`
        );
      }

      const deposit = await Deposit.findById(ro.deposit);
      if (!deposit || deposit.status !== 'PAID' || deposit.paidAmount < estimate.depositRequired) {
        throw new AppError(
          `SOP Mandatory Rule 2 Violation: Deposit requirement not satisfied. Collected: $${
            deposit?.paidAmount || 0
          }, Required: $${estimate.depositRequired.toFixed(2)}.`
        );
      }
    }
  }

  /**
   * Validate if vehicle is eligible for final release
   * Enforces Rule 4 & Rule 5
   */
  static async validateReleaseEligibility(ro: IRepairOrder): Promise<void> {
    if (!ro.worksheet) {
      throw new AppError(
        'SOP Violation: Cannot release vehicle without a completed and verified Technician Worksheet (TECH-013, SW-010).'
      );
    }

    const worksheet = await TechnicianWorksheet.findById(ro.worksheet);
    if (!worksheet) {
      throw new AppError('Technician Worksheet not found for this Repair Order.');
    }

    // Rule 4: Mandatory Dual-Technician Verification with distinct employee IDs
    const tech1Id = worksheet.initialSignoff?.technician?.toString();
    const tech2Id = worksheet.qcInspection?.qcTechnician?.toString();

    if (!tech1Id || !worksheet.initialSignoff?.signature) {
      throw new AppError(
        'SOP Mandatory Rule 4 Violation: Initial technician (Tech #1) inspection and signature are missing (TECH-008).'
      );
    }

    if (!tech2Id || !worksheet.qcInspection?.signature) {
      throw new AppError(
        'SOP Mandatory Rule 4 Violation: Independent Quality Control technician (Tech #2) inspection and signature are missing (TECH-009, TECH-011).'
      );
    }

    if (tech1Id === tech2Id) {
      throw new AppError(
        'SOP Mandatory Rule 4 Violation: Technician #1 and Technician #2 MUST be two distinct employees. An independent QC inspection cannot be performed by the primary technician.'
      );
    }

    // Rule 5: No vehicle release with unresolved safety defects
    if (worksheet.fullVehicleInspection?.hasRedFlags) {
      const redItems = worksheet.fullVehicleInspection.items
        .filter((i) => i.status === 'RED')
        .map((i) => i.name)
        .join(', ');
      throw new AppError(
        `SOP Mandatory Rule 5 Violation: Vehicle release stopped due to urgent safety defects (RED inspection flags: ${redItems}). Safety items must be resolved or documented before release.`
      );
    }

    if (worksheet.qcInspection?.discrepanciesFound) {
      if (
        worksheet.qcInspection.reinspectionResult !== 'PASSED' ||
        !worksheet.qcInspection.correctiveActionTaken
      ) {
        throw new AppError(
          `SOP Mandatory Rule 5 Violation: QC flagged discrepancies that have not passed reinspection. Release stopped under TECH-010.`
        );
      }
    }

    // Exit observation check (TECH-012)
    if (!worksheet.exitObservation?.performed || !worksheet.exitObservation?.exitPassed) {
      throw new AppError(
        'SOP Violation: Vehicle exit observation must be performed and passed with no active leaks before vehicle delivery (TECH-012).'
      );
    }
  }

  /**
   * Enforce allowed status transitions for a Repair Order
   */
  static validateStatusTransition(
    currentStatus: RepairOrderStatus,
    newStatus: RepairOrderStatus,
    isManager: boolean
  ): void {
    const validTransitions: Record<RepairOrderStatus, RepairOrderStatus[]> = {
      INTAKE: ['ESTIMATE_PENDING', 'ESTIMATE_CREATED'],
      ESTIMATE_PENDING: ['ESTIMATE_CREATED'],
      ESTIMATE_CREATED: ['AUTHORIZATION_PENDING', 'AUTHORIZED'],
      AUTHORIZATION_PENDING: ['AUTHORIZED', 'ESTIMATE_PENDING'],
      AUTHORIZED: ['DEPOSIT_REQUIRED', 'DEPOSIT_PAID', 'DISPATCHED'],
      DEPOSIT_REQUIRED: ['DEPOSIT_PAID', 'AUTHORIZED'],
      DEPOSIT_PAID: ['DISPATCHED'],
      DISPATCHED: ['INSPECTION_IN_PROGRESS', 'REPAIR_IN_PROGRESS'],
      INSPECTION_IN_PROGRESS: ['REPAIR_IN_PROGRESS', 'TECH1_SIGNED'],
      REPAIR_IN_PROGRESS: ['TECH1_SIGNED'],
      TECH1_SIGNED: ['QC_PENDING', 'QC_IN_PROGRESS'],
      QC_PENDING: ['QC_IN_PROGRESS'],
      QC_IN_PROGRESS: ['QC_DISCREPANCY', 'QC_APPROVED'],
      QC_DISCREPANCY: ['REINSPECTED', 'QC_IN_PROGRESS'],
      REINSPECTED: ['QC_APPROVED', 'QC_DISCREPANCY'],
      QC_APPROVED: ['EXIT_OBSERVED', 'READY_FOR_INVOICE'],
      EXIT_OBSERVED: ['READY_FOR_INVOICE'],
      READY_FOR_INVOICE: ['INVOICED'],
      INVOICED: ['PAID'],
      PAID: ['RELEASED'],
      RELEASED: ['CLOSED'],
      CLOSED: [],
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus) && !isManager) {
      throw new AppError(
        `Invalid workflow stage transition: Cannot move Repair Order from '${currentStatus}' directly to '${newStatus}'. Workflow stages must be followed sequentially.`
      );
    }
  }
}
