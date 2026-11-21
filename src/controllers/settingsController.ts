import { Response, NextFunction } from 'express';
import { CompanySetting } from '../models/CompanySetting.js';
import { MarkupMatrix } from '../models/MarkupMatrix.js';
import { PricingService } from '../services/pricingService.js';
import { AuthRequest, recordAuditLog } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const getSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let settings = await CompanySetting.findOne();
    if (!settings) {
      settings = await CompanySetting.create({});
    }

    const activeMatrix = await MarkupMatrix.findOne({ isActive: true });

    res.json({
      success: true,
      settings,
      markupMatrix: activeMatrix,
    });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!['manager', 'admin'].includes(req.user!.role)) {
      throw new AppError('Only Managers or Administrators may update shop configuration.', 403);
    }

    let settings = await CompanySetting.findOne();
    if (!settings) {
      settings = new CompanySetting();
    }

    const {
      companyName,
      legalName,
      tagline,
      address,
      phone,
      email,
      website,
      licenseNumber,
      taxRateDefault,
      laborRateDefault,
      tireMarkupFlat,
      depositThreshold,
      depositPercentage,
      drawerClosingTarget,
      mitchellManagerIntegrationEnabled,
      electronicPartsCatalogUrl,
    } = req.body;

    if (companyName) settings.companyName = companyName;
    if (legalName) settings.legalName = legalName;
    if (tagline) settings.tagline = tagline;
    if (address) settings.address = address;
    if (phone) settings.phone = phone;
    if (email) settings.email = email;
    if (website) settings.website = website;
    if (licenseNumber) settings.licenseNumber = licenseNumber;
    if (taxRateDefault !== undefined) settings.taxRateDefault = Number(taxRateDefault);
    if (laborRateDefault !== undefined) settings.laborRateDefault = Number(laborRateDefault);
    if (tireMarkupFlat !== undefined) settings.tireMarkupFlat = Number(tireMarkupFlat);
    if (depositThreshold !== undefined) settings.depositThreshold = Number(depositThreshold);
    if (depositPercentage !== undefined) settings.depositPercentage = Number(depositPercentage);
    if (drawerClosingTarget !== undefined) settings.drawerClosingTarget = Number(drawerClosingTarget);
    if (mitchellManagerIntegrationEnabled !== undefined) {
      settings.mitchellManagerIntegrationEnabled = Boolean(mitchellManagerIntegrationEnabled);
    }
    if (electronicPartsCatalogUrl !== undefined) {
      settings.electronicPartsCatalogUrl = electronicPartsCatalogUrl;
    }

    settings.updatedBy = req.user!._id;
    await settings.save();

    await recordAuditLog(
      req,
      'COMPANY_SETTINGS_UPDATED',
      'CompanySetting',
      settings._id.toString(),
      { laborRate: settings.laborRateDefault, tireMarkup: settings.tireMarkupFlat }
    );

    res.json({
      success: true,
      message: 'Company configuration updated successfully.',
      settings,
    });
  } catch (err) {
    next(err);
  }
};

export const updateMarkupMatrix = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!['manager', 'admin'].includes(req.user!.role)) {
      throw new AppError('Only Managers or Administrators may modify the parts markup matrix.', 403);
    }

    const { tiers, tireFlatMarkup, laborRateDefault } = req.body;

    if (!Array.isArray(tiers) || tiers.length === 0) {
      throw new AppError('Markup tiers array is required.', 400);
    }

    let matrix = await MarkupMatrix.findOne({ isActive: true });
    if (!matrix) {
      matrix = new MarkupMatrix({ name: 'Standard Automotive Markup Matrix', isActive: true });
    }

    matrix.tiers = tiers.map((t: any) => ({
      minCost: Number(t.minCost),
      maxCost: Number(t.maxCost),
      markupPercent: Number(t.markupPercent),
      multiplier: Number(t.multiplier) || 1 + Number(t.markupPercent) / 100,
      marginPercent: Number(t.marginPercent) || Math.round((Number(t.markupPercent) / (100 + Number(t.markupPercent))) * 1000) / 10,
    }));

    if (tireFlatMarkup !== undefined) {
      matrix.tireFlatMarkup = Number(tireFlatMarkup);
    }
    if (laborRateDefault !== undefined) {
      matrix.laborRateDefault = Number(laborRateDefault);
    }

    matrix.updatedBy = req.user!._id;
    await matrix.save();

    await recordAuditLog(
      req,
      'MARKUP_MATRIX_UPDATED',
      'MarkupMatrix',
      matrix._id.toString(),
      { tierCount: matrix.tiers.length, tireFlatMarkup: matrix.tireFlatMarkup }
    );

    res.json({
      success: true,
      message: 'Parts Markup Matrix updated successfully (SW-004).',
      markupMatrix: matrix,
    });
  } catch (err) {
    next(err);
  }
};

export const calculateItemPrice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { itemType, costPrice } = req.body;

    if (itemType === 'tire') {
      const result = await PricingService.calculateTirePrice(Number(costPrice));
      res.json({
        success: true,
        itemType: 'tire',
        costPrice: Number(costPrice),
        sellingPrice: result.sellingPrice,
        formula: 'Cost + $20.00 flat markup per tire (SW-005)',
        markup: result.flatMarkup,
      });
    } else {
      const result = await PricingService.calculatePartPrice(Number(costPrice));
      res.json({
        success: true,
        itemType: 'part',
        costPrice: Number(costPrice),
        sellingPrice: result.sellingPrice,
        markupPercent: result.markupPercent,
        multiplier: result.multiplier,
        formula: `Cost * ${result.multiplier} (${result.markupPercent}% markup via company matrix SW-004)`,
      });
    }
  } catch (err) {
    next(err);
  }
};
