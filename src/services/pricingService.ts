import { MarkupMatrix } from '../models/MarkupMatrix.js';
import { CompanySetting } from '../models/CompanySetting.js';
import { IEstimateLineItem } from '../models/Estimate.js';

export class PricingService {
  /**
   * Calculate selling price for a part using company-approved markup matrix tiers (SW-004)
   */
  static async calculatePartPrice(costPrice: number): Promise<{
    sellingPrice: number;
    markupPercent: number;
    multiplier: number;
  }> {
    const cost = Math.max(0, Number(costPrice) || 0);

    const activeMatrix = await MarkupMatrix.findOne({ isActive: true });
    const tiers = activeMatrix?.tiers && activeMatrix.tiers.length > 0
      ? activeMatrix.tiers
      : [
          { minCost: 0, maxCost: 25, markupPercent: 100, multiplier: 2.0 },
          { minCost: 25.01, maxCost: 50, markupPercent: 80, multiplier: 1.8 },
          { minCost: 50.01, maxCost: 100, markupPercent: 60, multiplier: 1.6 },
          { minCost: 100.01, maxCost: 300, markupPercent: 45, multiplier: 1.45 },
          { minCost: 300.01, maxCost: 1000, markupPercent: 35, multiplier: 1.35 },
          { minCost: 1000.01, maxCost: 999999, markupPercent: 25, multiplier: 1.25 },
        ];

    const matchedTier = tiers.find(
      (t) => cost >= t.minCost && cost <= t.maxCost
    ) || tiers[tiers.length - 1];

    const multiplier = matchedTier.multiplier || 1 + matchedTier.markupPercent / 100;
    const rawSellingPrice = cost * multiplier;
    const roundedSellingPrice = Math.round(rawSellingPrice * 100) / 100;

    return {
      sellingPrice: roundedSellingPrice,
      markupPercent: matchedTier.markupPercent,
      multiplier,
    };
  }

  /**
   * Calculate tire selling price strictly as Cost + $20.00 flat markup per tire (SW-005)
   */
  static async calculateTirePrice(costPrice: number): Promise<{
    sellingPrice: number;
    flatMarkup: number;
  }> {
    const cost = Math.max(0, Number(costPrice) || 0);
    const settings = await CompanySetting.findOne();
    const flatMarkup = settings?.tireMarkupFlat ?? 20.0;
    const sellingPrice = Math.round((cost + flatMarkup) * 100) / 100;

    return {
      sellingPrice,
      flatMarkup,
    };
  }

  /**
   * Recalculate totals for an estimate or repair order line items
   */
  static async calculateEstimateTotals(
    lineItems: IEstimateLineItem[],
    taxRateInput?: number,
    discountInput?: number
  ) {
    const settings = await CompanySetting.findOne();
    const taxRate = taxRateInput ?? settings?.taxRateDefault ?? 0.0825;
    const discount = Math.max(0, Number(discountInput) || 0);

    let partsTotal = 0;
    let tiresTotal = 0;
    let laborTotal = 0;
    let subletAndFeesTotal = 0;

    const processedLineItems: IEstimateLineItem[] = [];

    for (const item of lineItems) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const cost = Math.max(0, Number(item.costPrice) || 0);
      let sellingPrice = Number(item.sellingPrice) || 0;
      let markupApplied = item.markupApplied || 0;

      if (item.itemType === 'part') {
        if (!sellingPrice || sellingPrice <= cost) {
          const calc = await this.calculatePartPrice(cost);
          sellingPrice = calc.sellingPrice;
          markupApplied = calc.markupPercent;
        }
        const subtotal = Math.round(qty * sellingPrice * 100) / 100;
        partsTotal += subtotal;
        processedLineItems.push({
          ...item,
          quantity: qty,
          costPrice: cost,
          sellingPrice,
          subtotal,
          markupApplied,
        });
      } else if (item.itemType === 'tire') {
        const calc = await this.calculateTirePrice(cost);
        sellingPrice = calc.sellingPrice;
        markupApplied = calc.flatMarkup;
        const subtotal = Math.round(qty * sellingPrice * 100) / 100;
        tiresTotal += subtotal;
        processedLineItems.push({
          ...item,
          quantity: qty,
          costPrice: cost,
          sellingPrice,
          subtotal,
          markupApplied,
        });
      } else if (item.itemType === 'labor') {
        const hours = Math.max(0, Number(item.laborHours) || 0);
        const rate =
          Number(item.laborRatePerHour) ||
          settings?.laborRateDefault ||
          145.0;
        const subtotal = Math.round(hours * rate * 100) / 100;
        laborTotal += subtotal;
        processedLineItems.push({
          ...item,
          laborHours: hours,
          laborRatePerHour: rate,
          sellingPrice: rate,
          subtotal,
        });
      } else {
        const subtotal = Math.round(qty * sellingPrice * 100) / 100;
        subletAndFeesTotal += subtotal;
        processedLineItems.push({
          ...item,
          quantity: qty,
          subtotal,
        });
      }
    }

    const subtotal = Math.round((partsTotal + tiresTotal + laborTotal + subletAndFeesTotal) * 100) / 100;

    // Shop supplies calculation (commonly 7% of labor, capped at $45, standard commercial practice)
    const rawShopSupplies = Math.min(45.0, laborTotal * 0.07);
    const shopSupplies = Math.round(rawShopSupplies * 100) / 100;

    const taxableAmount = Math.max(0, partsTotal + tiresTotal + shopSupplies - discount);
    const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;

    const grandTotal = Math.round((subtotal + shopSupplies + taxAmount - discount) * 100) / 100;

    // SOP SW-008: 50% deposit required if total > $500
    const depositThreshold = settings?.depositThreshold ?? 500.0;
    const depositPercentage = (settings?.depositPercentage ?? 50) / 100;
    const depositRequired =
      grandTotal > depositThreshold
        ? Math.round(grandTotal * depositPercentage * 100) / 100
        : 0;

    return {
      lineItems: processedLineItems,
      partsTotal: Math.round(partsTotal * 100) / 100,
      tiresTotal: Math.round(tiresTotal * 100) / 100,
      laborTotal: Math.round(laborTotal * 100) / 100,
      shopSupplies,
      subtotal,
      taxRate,
      taxAmount,
      discount,
      grandTotal,
      depositRequired,
    };
  }
}
