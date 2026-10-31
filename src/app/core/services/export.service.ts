import { Injectable } from '@angular/core';

/** Una columna exportable: cabecera y cómo sacar su valor de cada fila. */
export interface ExportColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

/**
 * Exportación de informes tabulados a CSV y PDF.
 * - CSV: se genera a mano (es solo texto) y se descarga con un Blob.
 * - PDF: jsPDF + jspdf-autotable, descargados con import() solo al exportar.
 */
@Injectable({ providedIn: 'root' })
export class ExportService {
  /**
   * Construye el texto CSV.
   * Separador `;` y BOM UTF-8 para que Excel en español lo abra bien (tildes, columnas).
   */
  toCsv<T>(columns: readonly ExportColumn<T>[], rows: readonly T[]): string {
    const lines = [
      columns.map(c => this.escape(c.header)).join(';'),
      ...rows.map(row => columns.map(c => this.escape(c.value(row))).join(';')),
    ];
    return '﻿' + lines.join('\r\n');
  }

  downloadCsv<T>(filename: string, columns: readonly ExportColumn<T>[], rows: readonly T[]): void {
    const blob = new Blob([this.toCsv(columns, rows)], { type: 'text/csv;charset=utf-8' });
    this.save(blob, this.withExtension(filename, 'csv'));
  }

  async downloadPdf<T>(
    filename: string,
    title: string,
    columns: readonly ExportColumn<T>[],
    rows: readonly T[],
  ): Promise<void> {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 18);
    doc.setFontSize(9);
    doc.text(`Generado el ${new Date().toLocaleString('es-ES')}`, 14, 25);

    autoTable(doc, {
      startY: 30,
      head: [columns.map(c => c.header)],
      body: rows.map(row => columns.map(c => String(c.value(row)))),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save(this.withExtension(filename, 'pdf'));
  }

  /**
   * Escapa una celda: comillas dobles duplicadas y entre comillas si lleva
   * separador o saltos de línea. Además neutraliza la "inyección de fórmulas":
   * si empieza por = + - @ Excel podría ejecutarlo, así que se antepone una comilla.
   */
  private escape(value: string | number): string {
    let text = String(value ?? '');
    if (/^[=+\-@\t\r]/.test(text) && typeof value === 'string') {
      text = `'${text}`;
    }
    return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  private withExtension(filename: string, ext: string): string {
    return filename.toLowerCase().endsWith(`.${ext}`) ? filename : `${filename}.${ext}`;
  }

  private save(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
}
