import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  /**
   * Export an array of objects to a CSV / Excel-compatible file download
   */
  exportToCsv(filename: string, rows: object[], headers?: { key: string; label: string }[]) {
    if (!rows || !rows.length) {
      console.warn('No data available to export');
      return;
    }

    let keys: string[] = [];
    let labels: string[] = [];

    if (headers && headers.length) {
      keys = headers.map(h => h.key);
      labels = headers.map(h => h.label);
    } else {
      keys = Object.keys(rows[0]);
      labels = keys.map(k => k.charAt(0).toUpperCase() + k.slice(1));
    }

    const csvContent: string[] = [];
    csvContent.push(labels.map(l => `"${l.replace(/"/g, '""')}"`).join(','));

    rows.forEach(row => {
      const line = keys.map(key => {
        const val = (row as any)[key];
        return this.formatCsvCell(val);
      }).join(',');
      csvContent.push(line);
    });

    this.downloadCsv(filename, csvContent.join('\n'));
  }

  /**
   * Export all portfolio data into one comprehensive CSV matching the PDF report structure.
   * Numbers are exported as bare numerics so Excel treats them as numbers, not text.
   */
  exportAllToCsv(
    filename: string,
    investments: any[],
    investmentHeaders: { key: string; label: string }[],
    expenses: any[],
    credits: any[],
    dashboardSummary?: any,
    fireSummary?: any
  ) {
    const rows: string[] = [];
    const dateStr = new Date().toLocaleString('en-IN');

    // ── Header ─────────────────────────────────────────────────
    rows.push('"FLFP — Portfolio Financial Report"');
    rows.push(`"Generated: ${dateStr}"`);
    rows.push('');

    // ── Portfolio Snapshot & Projections ───────────────────────
    if (dashboardSummary) {
      rows.push('"PORTFOLIO SNAPSHOT & PROJECTIONS"');
      rows.push('"Metric","Value"');
      rows.push(`"Current Balance",${dashboardSummary.currentBalance ?? 0}`);
      rows.push(`"+30 Day Projection",${dashboardSummary.projectedBalance30Days ?? 0}`);
      rows.push(`"+1 Year Projection",${dashboardSummary.projectedBalance1Year ?? 0}`);
      rows.push(`"Calculated At","${dashboardSummary.calculatedAt ? new Date(dashboardSummary.calculatedAt).toLocaleString('en-IN') : 'N/A'}"`);
      rows.push('');
    }

    // ── FIRE Summary ───────────────────────────────────────────
    if (fireSummary) {
      const fireStatus = fireSummary.isFireAchieved ? 'ACHIEVED' : `${fireSummary.fireProgressPercent ?? 0}% of target`;
      const fireDate = fireSummary.fireCrossoverDate
        ? new Date(fireSummary.fireCrossoverDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })
        : 'Not yet determined';
      rows.push('"FIRE INDEPENDENCE SUMMARY"');
      rows.push('"Metric","Value"');
      rows.push(`"Monthly Income",${fireSummary.monthlyIncome ?? 0}`);
      rows.push(`"Monthly Expenses",${fireSummary.monthlyExpenses ?? 0}`);
      rows.push(`"Savings Rate (%)",${fireSummary.savingsRatePercent ?? 0}`);
      rows.push(`"FIRE Target (25x expenses)",${fireSummary.fireTargetNumber ?? 0}`);
      rows.push(`"Current Nest Egg",${fireSummary.currentPortfolioNestEgg ?? 0}`);
      rows.push(`"FIRE Progress","${fireStatus}"`);
      rows.push(`"Projected FIRE Date","${fireDate}"`);
      rows.push('');
    }

    // ── Investments ────────────────────────────────────────────
    if (investments.length > 0) {
      rows.push('"INVESTMENTS"');
      rows.push(investmentHeaders.map(h => `"${h.label}"`).join(','));
      investments.forEach(inv => {
        rows.push(investmentHeaders.map(h => this.formatCsvCell(inv[h.key])).join(','));
      });
      rows.push('');
    }

    // ── Expenses ───────────────────────────────────────────────
    if (expenses.length > 0) {
      const expKeys = Object.keys(expenses[0]);
      rows.push('"EXPENSES"');
      rows.push(expKeys.map(k => `"${k.charAt(0).toUpperCase() + k.slice(1)}"`).join(','));
      expenses.forEach(exp => {
        rows.push(expKeys.map(k => this.formatCsvCell(exp[k])).join(','));
      });
      rows.push('');
    }

    // ── Credits ────────────────────────────────────────────────
    if (credits.length > 0) {
      const crdKeys = Object.keys(credits[0]);
      rows.push('"CREDITS / LOANS"');
      rows.push(crdKeys.map(k => `"${k.charAt(0).toUpperCase() + k.slice(1)}"`).join(','));
      credits.forEach(crd => {
        rows.push(crdKeys.map(k => this.formatCsvCell(crd[k])).join(','));
      });
    }

    this.downloadCsv(filename, rows.join('\n'));
  }

  private formatCsvCell(val: any): string {
    if (val === null || val === undefined) return '';
    if (typeof val === 'number') return String(val);           // bare number — Excel reads as numeric
    if (typeof val === 'boolean') return val ? '"Yes"' : '"No"';
    if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
    const str = String(val);
    // If it looks like a pure number string, emit without quotes
    if (/^-?\d+(\.\d+)?$/.test(str)) return str;
    return `"${str.replace(/"/g, '""')}"`;
  }

  private downloadCsv(filename: string, content: string) {
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private buildTableBody(rows: any[], headers?: { key: string; label: string }[]): { head: string[]; body: string[][] } {
    let head: string[] = [];
    let keys: string[] = [];

    if (headers && headers.length) {
      head = headers.map(h => h.label);
      keys = headers.map(h => h.key);
    } else if (rows.length > 0) {
      keys = Object.keys(rows[0]);
      head = keys.map(k => k.charAt(0).toUpperCase() + k.slice(1));
    }

    const body = rows.map(row =>
      keys.map(key => {
        const val = row[key];
        if (val === null || val === undefined) return '';
        return String(val);
      })
    );

    return { head, body };
  }

  /**
   * Export a single section to PDF
   */
  exportToPdf(filename: string, title: string, rows: any[], headers?: { key: string; label: string }[]) {
    if (!rows || !rows.length) {
      console.warn('No data available to export');
      return;
    }
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text(title, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated: ${date}`, 14, 26);

    const { head, body } = this.buildTableBody(rows, headers);

    autoTable(doc, {
      head: [head],
      body,
      startY: 32,
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 248, 250] },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  /**
   * Export all portfolio data (investments, expenses, credits) into a single PDF invoice
   */
  exportAllToPdf(
    filename: string,
    investments: any[],
    investmentHeaders: { key: string; label: string }[],
    expenses: any[],
    credits: any[],
    dashboardSummary?: any,
    fireSummary?: any
  ) {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    let currentY = 14;

    // ── Dark title header ──────────────────────────────────────
    doc.setFillColor(15, 15, 20);
    doc.rect(0, 0, 210, 36, 'F');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('FLFP — Portfolio Financial Invoice', 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 200);
    doc.text(`Generated: ${dateStr}`, 14, 26);
    doc.setTextColor(120, 120, 140);
    doc.text('Forward-Looking Finance Portfolio', 14, 33);
    currentY = 44;

    const fmt = (n: number | undefined | null) =>
      n != null ? n.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : 'N/A';

    const sectionTitle = (title: string, y: number, r: number, g: number, b: number): number => {
      doc.setFontSize(12);
      doc.setTextColor(r, g, b);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 14, y);
      doc.setFont('helvetica', 'normal');
      return y + 5;
    };

    // ── Dashboard Summary & Projections ────────────────────────
    if (dashboardSummary) {
      currentY = sectionTitle('Portfolio Snapshot & Projections', currentY, 99, 102, 241);
      autoTable(doc, {
        head: [['Metric', 'Value']],
        body: [
          ['Current Balance', `₹ ${fmt(dashboardSummary.currentBalance)}`],
          ['+30 Day Projection', `₹ ${fmt(dashboardSummary.projectedBalance30Days)}`],
          ['+1 Year Projection', `₹ ${fmt(dashboardSummary.projectedBalance1Year)}`],
          ['Calculated At', dashboardSummary.calculatedAt ? new Date(dashboardSummary.calculatedAt).toLocaleString('en-IN') : 'N/A']
        ],
        startY: currentY,
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 245, 255] },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 }, 1: { cellWidth: 100 } }
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // ── FIRE Summary ───────────────────────────────────────────
    if (fireSummary) {
      if (currentY > 220) { doc.addPage(); currentY = 14; }
      currentY = sectionTitle('FIRE Independence Summary', currentY, 245, 158, 11);
      const fireStatus = fireSummary.isFireAchieved ? '🔥 ACHIEVED' : `${fmt(fireSummary.fireProgressPercent)}% of target`;
      autoTable(doc, {
        head: [['Metric', 'Value']],
        body: [
          ['Monthly Income', `₹ ${fmt(fireSummary.monthlyIncome)}`],
          ['Monthly Expenses', `₹ ${fmt(fireSummary.monthlyExpenses)}`],
          ['Savings Rate', `${fmt(fireSummary.savingsRatePercent)}%`],
          ['FIRE Target (25× expenses)', `₹ ${fmt(fireSummary.fireTargetNumber)}`],
          ['Current Nest Egg', `₹ ${fmt(fireSummary.currentPortfolioNestEgg)}`],
          ['FIRE Progress', fireStatus],
          ['Projected FIRE Date', fireSummary.fireCrossoverDate ? new Date(fireSummary.fireCrossoverDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : 'Not yet determined']
        ],
        startY: currentY,
        headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [255, 252, 235] },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 }, 1: { cellWidth: 100 } }
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // ── Investments ────────────────────────────────────────────
    if (investments.length > 0) {
      if (currentY > 220) { doc.addPage(); currentY = 14; }
      currentY = sectionTitle('Investments', currentY, 99, 102, 241);
      const { head, body } = this.buildTableBody(investments, investmentHeaders);
      autoTable(doc, {
        head: [head],
        body,
        startY: currentY,
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 245, 250] },
        styles: { fontSize: 8.5, cellPadding: 3.5 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 12;
    }

    // ── Expenses ───────────────────────────────────────────────
    if (expenses.length > 0) {
      if (currentY > 220) { doc.addPage(); currentY = 14; }
      currentY = sectionTitle('Expenses', currentY, 239, 68, 68);
      const { head, body } = this.buildTableBody(expenses);
      autoTable(doc, {
        head: [head],
        body,
        startY: currentY,
        headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [255, 245, 245] },
        styles: { fontSize: 8.5, cellPadding: 3.5 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 12;
    }

    // ── Credits ────────────────────────────────────────────────
    if (credits.length > 0) {
      if (currentY > 220) { doc.addPage(); currentY = 14; }
      currentY = sectionTitle('Credits / Loans', currentY, 16, 185, 129);
      const { head, body } = this.buildTableBody(credits);
      autoTable(doc, {
        head: [head],
        body,
        startY: currentY,
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [240, 255, 248] },
        styles: { fontSize: 8.5, cellPadding: 3.5 }
      });
    }

    // ── Page footer ────────────────────────────────────────────
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 170);
      doc.text(`Page ${i} of ${totalPages} — FLFP Portfolio Invoice`, 14, 290);
    }

    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  }
}
