import { Response, NextFunction } from 'express';
import { Customer } from '../models/Customer.js';
import { Vehicle } from '../models/Vehicle.js';
import { RepairOrder } from '../models/RepairOrder.js';
import { TechnicianWorksheet } from '../models/TechnicianWorksheet.js';
import { Estimate } from '../models/Estimate.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { DailyCashUp } from '../models/DailyCashUp.js';
import { ComputerModificationRequest } from '../models/ComputerModificationRequest.js';
import { SecurityIncident } from '../models/SecurityIncident.js';
import { DailySecurityChecklist } from '../models/DailySecurityChecklist.js';
import { Task } from '../models/Task.js';
import { AuditLog } from '../models/AuditLog.js';
import { AuthRequest } from '../middleware/auth.js';

export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const role = req.user!.role;
    const userId = req.user!._id;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Common counts
    const [totalCustomers, totalVehicles] = await Promise.all([
      Customer.countDocuments(),
      Vehicle.countDocuments(),
    ]);

    let stats: Record<string, any> = {
      role,
      totalCustomers,
      totalVehicles,
    };

    if (role === 'admin' || role === 'manager') {
      const [
        activeROs,
        pendingApprovals,
        vehiclesUnderService,
        pendingTechInspections,
        pendingQCInspections,
        completedROs,
        unpaidInvoices,
        todayPayments,
        pendingDeposits,
        todayCashUp,
        recentActivity,
      ] = await Promise.all([
        RepairOrder.countDocuments({
          status: { $nin: ['RELEASED', 'CLOSED'] },
        }),
        Estimate.countDocuments({ status: 'PENDING_APPROVAL' }),
        RepairOrder.countDocuments({
          status: {
            $in: [
              'DISPATCHED',
              'INSPECTION_IN_PROGRESS',
              'REPAIR_IN_PROGRESS',
              'TECH1_SIGNED',
              'QC_PENDING',
              'QC_IN_PROGRESS',
            ],
          },
        }),
        TechnicianWorksheet.countDocuments({
          'initialSignoff.signature': { $exists: false },
        }),
        RepairOrder.countDocuments({
          status: { $in: ['QC_PENDING', 'QC_IN_PROGRESS', 'QC_DISCREPANCY'] },
        }),
        RepairOrder.countDocuments({ status: { $in: ['RELEASED', 'CLOSED'] } }),
        Invoice.find({ status: { $in: ['ISSUED', 'PARTIALLY_PAID'] } }),
        Payment.find({
          processedAt: { $gte: startOfToday, $lte: endOfToday },
        }),
        RepairOrder.countDocuments({ status: 'DEPOSIT_REQUIRED' }),
        DailyCashUp.findOne({
          businessDate: new Date().toISOString().split('T')[0],
        }),
        AuditLog.find().sort({ createdAt: -1 }).limit(10),
      ]);

      const dailySales = todayPayments.reduce((acc, p) => acc + p.amount, 0);
      const totalUnpaidAmount = unpaidInvoices.reduce(
        (acc, inv) => acc + inv.balanceDue,
        0
      );

      stats = {
        ...stats,
        activeROs,
        pendingApprovals,
        vehiclesUnderService,
        pendingTechInspections,
        pendingQCInspections,
        completedROs,
        unpaidInvoicesCount: unpaidInvoices.length,
        unpaidInvoicesTotal: Math.round(totalUnpaidAmount * 100) / 100,
        dailySales: Math.round(dailySales * 100) / 100,
        pendingDeposits,
        todayCashUpStatus: todayCashUp?.status || 'NOT_SUBMITTED',
        todayCashUpDifference: todayCashUp?.difference || 0,
        recentActivity,
      };
    } else if (role === 'service_writer') {
      const [
        intakeArrivals,
        pendingEstimates,
        pendingAuthorizations,
        pendingDeposits,
        activeROs,
        completedAwaitingRelease,
        pendingInvoices,
      ] = await Promise.all([
        RepairOrder.countDocuments({ status: 'INTAKE' }),
        Estimate.countDocuments({ status: { $in: ['DRAFT', 'REVISED'] } }),
        Estimate.countDocuments({ status: 'PENDING_APPROVAL' }),
        RepairOrder.countDocuments({ status: 'DEPOSIT_REQUIRED' }),
        RepairOrder.countDocuments({
          status: { $nin: ['INTAKE', 'RELEASED', 'CLOSED'] },
        }),
        RepairOrder.countDocuments({
          status: { $in: ['READY_FOR_INVOICE', 'INVOICED', 'PAID'] },
        }),
        Invoice.countDocuments({ status: { $in: ['ISSUED', 'PARTIALLY_PAID'] } }),
      ]);

      stats = {
        ...stats,
        intakeArrivals,
        pendingEstimates,
        pendingAuthorizations,
        pendingDeposits,
        activeROs,
        completedAwaitingRelease,
        pendingInvoices,
      };
    } else if (role === 'technician') {
      const [
        assignedVehicles,
        pendingInspections,
        activeWorkOrders,
        pendingWorksheets,
        qcRelatedIssues,
      ] = await Promise.all([
        RepairOrder.countDocuments({
          assignedTechnician: userId,
          status: { $nin: ['RELEASED', 'CLOSED'] },
        }),
        TechnicianWorksheet.countDocuments({
          'initialSignoff.technician': userId,
          'fullVehicleInspection.performed': false,
        }),
        RepairOrder.countDocuments({
          assignedTechnician: userId,
          status: { $in: ['DISPATCHED', 'INSPECTION_IN_PROGRESS', 'REPAIR_IN_PROGRESS'] },
        }),
        TechnicianWorksheet.countDocuments({
          'initialSignoff.technician': userId,
          'initialSignoff.signature': { $exists: false },
        }),
        RepairOrder.countDocuments({
          assignedTechnician: userId,
          status: 'QC_DISCREPANCY',
        }),
      ]);

      stats = {
        ...stats,
        assignedVehicles,
        pendingInspections,
        activeWorkOrders,
        pendingWorksheets,
        qcRelatedIssues,
      };
    } else if (role === 'qc_technician') {
      const [
        vehiclesAwaitingQC,
        inProgressQC,
        discrepanciesFlagged,
        approvedToday,
      ] = await Promise.all([
        RepairOrder.countDocuments({ status: 'QC_PENDING' }),
        RepairOrder.countDocuments({ status: 'QC_IN_PROGRESS' }),
        RepairOrder.countDocuments({ status: 'QC_DISCREPANCY' }),
        TechnicianWorksheet.countDocuments({
          'qcInspection.signedAt': { $gte: startOfToday, $lte: endOfToday },
          'qcInspection.reinspectionResult': 'PASSED',
        }),
      ]);

      stats = {
        ...stats,
        vehiclesAwaitingQC,
        inProgressQC,
        discrepanciesFlagged,
        approvedToday,
      };
    } else if (role === 'office_assistant') {
      const todayStr = new Date().toISOString().split('T')[0];
      const [
        modificationRequests,
        pendingManagementApprovals,
        openSecurityIncidents,
        todayChecklist,
      ] = await Promise.all([
        ComputerModificationRequest.countDocuments(),
        ComputerModificationRequest.countDocuments({ status: 'SUBMITTED' }),
        SecurityIncident.countDocuments({ status: { $in: ['OPEN', 'INVESTIGATING'] } }),
        DailySecurityChecklist.findOne({ businessDate: todayStr }),
      ]);

      stats = {
        ...stats,
        modificationRequests,
        pendingManagementApprovals,
        openSecurityIncidents,
        todaySecurityChecklistSubmitted: Boolean(todayChecklist),
      };
    }

    res.json({
      success: true,
      stats,
    });
  } catch (err) {
    next(err);
  }
};

export const getFinancialReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const filter: any = {};
    if (startDate && endDate) {
      filter.processedAt = {
        $gte: new Date(String(startDate)),
        $lte: new Date(String(endDate)),
      };
    }

    const [payments, invoices] = await Promise.all([
      Payment.find(filter).populate('customer', 'name'),
      Invoice.find().sort({ createdAt: -1 }),
    ]);

    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
    const cashTotal = payments.filter((p) => p.paymentMethod === 'CASH').reduce((acc, p) => acc + p.amount, 0);
    const cardTotal = payments.filter((p) => p.paymentMethod === 'CREDIT_CARD' || p.paymentMethod === 'DEBIT_CARD').reduce((acc, p) => acc + p.amount, 0);

    res.json({
      success: true,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      cashTotal: Math.round(cashTotal * 100) / 100,
      cardTotal: Math.round(cardTotal * 100) / 100,
      paymentsCount: payments.length,
      recentPayments: payments.slice(0, 50),
    });
  } catch (err) {
    next(err);
  }
};

export const getAuditTrail = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { action, employeeId, entityType, page = 1, limit = 50 } = req.query;
    const query: any = {};
    if (action) query.action = action;
    if (employeeId) query.employeeId = employeeId;
    if (entityType) query.entityType = entityType;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('user', 'name employeeId role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: logs,
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
