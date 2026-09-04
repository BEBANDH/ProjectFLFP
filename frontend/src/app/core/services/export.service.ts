import { Injectable } from '@angular/core';

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
    // Add Header row
    csvContent.push(labels.map(l => `"${l.replace(/"/g, '""')}"`).join(','));

    // Add Data rows
    rows.forEach(row => {
      const line = keys.map(key => {
        let val = (row as any)[key];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'object') val = JSON.stringify(val);
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
      csvContent.push(line);
    });

    const blob = new Blob(['\ufeff' + csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
