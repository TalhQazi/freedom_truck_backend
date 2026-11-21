import { Response, NextFunction } from 'express';
import { Authorization } from '../models/Authorization.js';
import { RepairOrder } from '../models/RepairOrder.js';
import { Estimate } from '../models/Estimate.js';
import { AuthRequest, recordAuditLog } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const createAuthorization = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      repairOrderId,
      estimateId,
      customerSignature,
      customerSignerName,
      signerPhone,
      approvedItems,
      authorizedTotal,
      authorizationType = 'INITIAL',
      notes,
    } = req.body;

    if (!customerSignature || !customerSignerName) {
      throw new AppError(
        'SOP SW-007: Customer Signature and Signer Name are mandatory for work authorization.',
        400
      );
    }

    if (!repairOrderId && !estimateId) {
      throw new AppError(
        'SOP SW-007: Either Repair Order ID or Estimate ID must be provided.',
        400
      );
    }

    let est = null;
    let ro = null;

    if (repairOrderId) {
      ro = await RepairOrder.findById(repairOrderId);
      if (!ro) throw new AppError('Repair Order not found', 404);
      if (estimateId) {
        est = await Estimate.findById(estimateId);
      } else if (ro.currentEstimate) {
        est = await Estimate.findById(ro.currentEstimate);
      }
    } else if (estimateId) {
      est = await Estimate.findById(estimateId);
      if (!est) throw new AppError('Estimate not found', 404);
      if (est.repairOrder) {
        ro = await RepairOrder.findById(est.repairOrder);
      } else {
        // Auto-create Repair Order from estimate (SW-006)
        const count = await RepairOrder.countDocuments();
        const roNumber = `RO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
        ro = await RepairOrder.create({
          roNumber,
          customer: est.customer,
          vehicle: est.vehicle,
          currentEstimate: est._id,
          estimates: [est._id],
          mileageIn: est.mileageIn,
          customerComplaint: est.customerComplaint || 'General service requested',
          status: 'INTAKE',
          serviceWriter: req.user!._id,
          timeline: [
            {
              status: 'INTAKE',
              timestamp: new Date(),
              performedBy: req.user!._id,
              notes: `Repair Order generated from Estimate #${est.estimateNumber} (SW-006).`,
            },
          ],
        });
        est.repairOrder = ro._id as any;
      }
    }

    if (!est) throw new AppError('Associated Estimate not found for authorization.', 404);
    if (!ro) throw new AppError('Associated Repair Order not found.', 404);

    const totalToAuthorize = authorizedTotal !== undefined ? Number(authorizedTotal) : est.grandTotal;

    const count = await Authorization.countDocuments();
    const authorizationNumber = `AUTH-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const authorization = await Authorization.create({
      authorizationNumber,
      repairOrder: ro._id,
      estimate: est._id,
      customer: ro.customer,
      authorizedTotal: totalToAuthorize,
      approvedItems: Array.isArray(approvedItems) && approvedItems.length > 0
        ? approvedItems
        : est.lineItems.map((i) => i.description),
      customerSignature, // Canvas base64 signature
      customerSignerName: customerSignerName.trim(),
      signerPhone: signerPhone?.trim(),
      signedAt: new Date(),
      authorizationType,
      serviceWriterWitness: req.user!._id,
      termsAccepted: true,
      notes,
    });

    // Update Estimate status
    est.status = 'APPROVED';
    await est.save();

    // Link authorization to Repair Order
    if (authorizationType === 'INITIAL' || !ro.authorization) {
      ro.authorization = authorization._id as any;
      // If deposit required, move to DEPOSIT_REQUIRED, otherwise AUTHORIZED
      ro.status = est.depositRequired > 0 && (!ro.deposit) ? 'DEPOSIT_REQUIRED' : 'AUTHORIZED';
    } else {
      ro.additionalAuthorizations.push(authorization._id as any);
    }

    ro.timeline.push({
      status: ro.status,
      timestamp: new Date(),
      performedBy: req.user!._id,
      notes: `Customer authorization (#${authorization.authorizationNumber}) captured and signed by ${customerSignerName} (SW-007).`,
    });

    await ro.save();

    await recordAuditLog(
      req,
      'CUSTOMER_AUTHORIZATION_RECORDED',
      'Authorization',
      authorization._id.toString(),
      {
        authorizationNumber: authorization.authorizationNumber,
        roNumber: ro.roNumber,
        authorizedTotal: totalToAuthorize,
        signer: customerSignerName,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Customer authorization and signature captured successfully (SW-007).',
      authorization,
      repairOrder: ro,
    });
  } catch (err) {
    next(err);
  }
};

export const getAuthorizationsByRO = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { roId } = req.params;
    const authorizations = await Authorization.find({ repairOrder: roId })
      .populate('serviceWriterWitness', 'name employeeId')
      .sort({ signedAt: -1 });

    res.json({
      success: true,
      authorizations,
    });
  } catch (err) {
    next(err);
  }
};
