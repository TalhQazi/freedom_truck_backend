import PDFDocument from 'pdfkit';

export class PDFService {
  /**
   * Helper to draw clean branded header
   */
  private static drawBrandedHeader(
    doc: PDFKit.PDFDocument,
    title: string,
    subtitle: string,
    docNumber: string
  ) {
    // Top banner
    doc.rect(0, 0, doc.page.width, 70).fill('#0f172a');

    // Title
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold');
    doc.text('FREEDOM CAR & TRUCK', 40, 20);

    doc.fillColor('#ea580c').fontSize(9).font('Helvetica-Bold');
    doc.text('WORKSHOP MANAGEMENT SYSTEMS', 40, 38);

    doc.fillColor('#94a3b8').fontSize(8).font('Helvetica');
    doc.text('1244 Freedom Industrial Blvd, Dallas, TX 75201 | (214) 555-0199', 40, 50);

    // Document type badge on right
    doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold');
    doc.text(title.toUpperCase(), 350, 20, { align: 'right', width: 220 });

    doc.fillColor('#f59e0b').fontSize(10).font('Helvetica-Bold');
    doc.text(docNumber, 350, 38, { align: 'right', width: 220 });

    doc.fillColor('#cbd5e1').fontSize(8).font('Helvetica');
    doc.text(subtitle, 350, 52, { align: 'right', width: 220 });

    doc.fillColor('#0f172a'); // reset
  }

  /**
   * Generate Invoice PDF
   */
  static generateInvoicePDF(invoice: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      this.drawBrandedHeader(
        doc,
        'Commercial Invoice',
        `Date: ${new Date(invoice.issuedAt).toLocaleDateString()}`,
        invoice.invoiceNumber
      );

      let y = 90;

      // Customer & Vehicle Panels
      doc.rect(40, y, 260, 80).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.rect(310, y, 260, 80).fillAndStroke('#f8fafc', '#cbd5e1');

      // Customer Info
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
      doc.text('BILL TO:', 50, y + 10);
      doc.font('Helvetica').fontSize(9);
      doc.text(invoice.customer?.name || 'Customer Name', 50, y + 24);
      doc.text(`Phone: ${invoice.customer?.phone || 'N/A'}`, 50, y + 36);
      doc.text(`Email: ${invoice.customer?.email || 'N/A'}`, 50, y + 48);
      doc.text(
        `${invoice.customer?.address?.street || ''}, ${invoice.customer?.address?.city || ''} ${invoice.customer?.address?.state || ''}`,
        50,
        y + 60
      );

      // Vehicle Info
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text('VEHICLE DETAILS:', 320, y + 10);
      doc.font('Helvetica').fontSize(9);
      doc.text(
        `${invoice.vehicle?.year || ''} ${invoice.vehicle?.make || ''} ${invoice.vehicle?.model || ''}`,
        320,
        y + 24
      );
      doc.text(`VIN: ${invoice.vehicle?.vin || 'N/A'}`, 320, y + 36);
      doc.text(`License Plate: ${invoice.vehicle?.licensePlate || 'N/A'}`, 320, y + 48);
      doc.text(`Repair Order Ref: ${invoice.repairOrder?.roNumber || 'N/A'}`, 320, y + 60);

      y += 95;

      // Table Header
      doc.rect(40, y, 530, 20).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('TYPE', 45, y + 6);
      doc.text('DESCRIPTION / PART #', 95, y + 6);
      doc.text('QTY', 360, y + 6, { width: 30, align: 'center' });
      doc.text('UNIT PRICE', 410, y + 6, { width: 60, align: 'right' });
      doc.text('TOTAL', 490, y + 6, { width: 70, align: 'right' });

      y += 24;

      // Line items
      const items = invoice.lineItems || [];
      items.forEach((item: any, idx: number) => {
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, y - 2, 530, 18).fill(bg);

        doc.fillColor('#0f172a').fontSize(8).font('Helvetica');
        doc.text(item.itemType?.toUpperCase() || 'ITEM', 45, y + 2);
        const desc = item.partNumber ? `${item.description} (${item.partNumber})` : item.description;
        doc.text(desc || '', 95, y + 2, { width: 255, ellipsis: true });
        doc.text(String(item.quantity || 1), 360, y + 2, { width: 30, align: 'center' });
        doc.text(`$${Number(item.unitPrice || 0).toFixed(2)}`, 410, y + 2, {
          width: 60,
          align: 'right',
        });
        doc.font('Helvetica-Bold');
        doc.text(`$${Number(item.subtotal || 0).toFixed(2)}`, 490, y + 2, {
          width: 70,
          align: 'right',
        });

        y += 18;
      });

      y += 10;

      // Summary Block on bottom right
      const sumX = 350;
      doc.rect(sumX, y, 220, 120).fillAndStroke('#f8fafc', '#94a3b8');

      doc.fillColor('#334155').fontSize(8).font('Helvetica');
      doc.text('Parts Total:', sumX + 10, y + 10);
      doc.text(`$${Number(invoice.partsTotal || 0).toFixed(2)}`, sumX + 120, y + 10, {
        align: 'right',
        width: 80,
      });

      doc.text('Tires Total (SW-005):', sumX + 10, y + 22);
      doc.text(`$${Number(invoice.tiresTotal || 0).toFixed(2)}`, sumX + 120, y + 22, {
        align: 'right',
        width: 80,
      });

      doc.text('Labor Total:', sumX + 10, y + 34);
      doc.text(`$${Number(invoice.laborTotal || 0).toFixed(2)}`, sumX + 120, y + 34, {
        align: 'right',
        width: 80,
      });

      doc.text('Shop Supplies & Disposal:', sumX + 10, y + 46);
      doc.text(`$${Number(invoice.shopSupplies || 0).toFixed(2)}`, sumX + 120, y + 46, {
        align: 'right',
        width: 80,
      });

      doc.text(`Sales Tax (${((invoice.taxRate || 0.0825) * 100).toFixed(2)}%):`, sumX + 10, y + 58);
      doc.text(`$${Number(invoice.taxAmount || 0).toFixed(2)}`, sumX + 120, y + 58, {
        align: 'right',
        width: 80,
      });

      doc.font('Helvetica-Bold');
      doc.text('Deposit Credit Applied (SW-008):', sumX + 10, y + 72);
      doc.fillColor('#15803d');
      doc.text(`-$${Number(invoice.depositCredit || 0).toFixed(2)}`, sumX + 120, y + 72, {
        align: 'right',
        width: 80,
      });

      // Total Balance Due
      doc.rect(sumX, y + 88, 220, 32).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
      doc.text('TOTAL BALANCE DUE:', sumX + 10, y + 98);
      doc.fillColor('#f59e0b').fontSize(12);
      doc.text(`$${Number(invoice.balanceDue || 0).toFixed(2)}`, sumX + 110, y + 96, {
        align: 'right',
        width: 100,
      });

      // Terms & Signature Notice
      y += 135;
      doc.fillColor('#64748b').fontSize(7).font('Helvetica');
      doc.text(
        'Freedom Car & Truck provides 12-month / 12,000-mile limited warranty on qualifying mechanical repairs. All replaced parts and labor comply with company standard operating procedures (SOP SW-001 through SW-015). Thank you for choosing Freedom Car & Truck.',
        40,
        y,
        { width: 530, align: 'center' }
      );

      doc.end();
    });
  }

  /**
   * Generate Daily Cash-Up Sheet PDF (SW-015)
   */
  static generateCashUpPDF(cashUp: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      this.drawBrandedHeader(
        doc,
        'Daily Cash-Up Sheet',
        `Business Date: ${cashUp.businessDate}`,
        cashUp.cashUpNumber
      );

      let y = 90;

      // Service Writer Block
      doc.rect(40, y, 530, 45).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
      doc.text('SERVICE WRITER INFORMATION', 50, y + 8);
      doc.font('Helvetica').fontSize(9);
      doc.text(`Name: ${cashUp.serviceWriterName} (ID: ${cashUp.serviceWriterEmployeeId})`, 50, y + 24);
      doc.text(`Status: ${cashUp.status}`, 350, y + 24);

      y += 55;

      // Financial Reconciliation Table
      doc.rect(40, y, 530, 22).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
      doc.text('REGISTER RECONCILIATION AUDIT (SOP SW-015)', 50, y + 6);

      y += 26;

      const rows = [
        ['Opening Float (Drawer start)', `$${Number(cashUp.openingFloat || 0).toFixed(2)}`],
        ['Total Cash Sales (+)', `$${Number(cashUp.cashSales || 0).toFixed(2)}`],
        ['Total Cash Refunds (-)', `-$${Number(cashUp.cashRefunds || 0).toFixed(2)}`],
        ['Total Paid-Outs (-)', `-$${Number(cashUp.paidOuts || 0).toFixed(2)}`],
        ['Expected Drawer Cash (Calculated)', `$${Number(cashUp.expectedCash || 0).toFixed(2)}`],
        ['Actual Counted Cash (Physical register audit)', `$${Number(cashUp.actualCountedCash || 0).toFixed(2)}`],
        ['Reconciliation Variance / Difference', `$${Number(cashUp.difference || 0).toFixed(2)}`],
        ['Cash Removed for Bank Deposit', `$${Number(cashUp.cashRemovedForDeposit || 0).toFixed(2)}`],
        ['Mandatory Closing Float Balance (Exact Target)', `$${Number(cashUp.closingDrawerBalance || 100).toFixed(2)}`],
      ];

      rows.forEach(([label, val], idx) => {
        const isHighlight = idx === 6 || idx === 8;
        const bg = isHighlight ? '#fef3c7' : idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, y, 530, 20).fill(bg);

        doc.fillColor(isHighlight ? '#92400e' : '#1e293b').fontSize(8.5);
        doc.font(isHighlight ? 'Helvetica-Bold' : 'Helvetica');
        doc.text(label, 50, y + 5);
        doc.text(val, 420, y + 5, { width: 140, align: 'right' });

        y += 20;
      });

      y += 15;

      // Variance Explanation if any
      if (cashUp.explanationOfVariance || cashUp.difference !== 0) {
        doc.rect(40, y, 530, 50).fillAndStroke('#fff1f2', '#fecdd3');
        doc.fillColor('#9f1239').fontSize(8.5).font('Helvetica-Bold');
        doc.text('EXPLANATION OF VARIANCE / DISCREPANCY:', 50, y + 8);
        doc.font('Helvetica').fontSize(8);
        doc.text(cashUp.explanationOfVariance || 'No explanation provided.', 50, y + 22, { width: 510 });
        y += 60;
      }

      // Signatures Block
      doc.rect(40, y, 260, 90).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.rect(310, y, 260, 90).fillAndStroke('#f8fafc', '#cbd5e1');

      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold');
      doc.text('SERVICE WRITER VERIFICATION & SIGNATURE', 50, y + 10);
      doc.font('Helvetica').fontSize(8);
      doc.text(`Employee: ${cashUp.serviceWriterName}`, 50, y + 26);
      doc.text(`Signed At: ${new Date(cashUp.employeeSignedAt).toLocaleString()}`, 50, y + 38);
      doc.text('[Digital Signature Record Verified]', 50, y + 65);

      doc.font('Helvetica-Bold');
      doc.text('MANAGEMENT REVIEW & ESCALATION', 320, y + 10);
      doc.font('Helvetica').fontSize(8);
      doc.text(`Reviewed By: ${cashUp.managerReview?.managerName || 'Pending Review'}`, 320, y + 26);
      doc.text(`Decision: ${cashUp.managerReview?.decision || 'PENDING'}`, 320, y + 38);
      doc.text(`Notes: ${cashUp.managerReview?.notes || 'None'}`, 320, y + 50);

      doc.end();
    });
  }
}
