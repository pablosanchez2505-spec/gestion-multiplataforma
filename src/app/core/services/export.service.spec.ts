import { ExportColumn, ExportService } from './export.service';

interface Row { name: string; stock: number }

describe('ExportService', () => {
  const service = new ExportService();
  const columns: ExportColumn<Row>[] = [
    { header: 'Nombre', value: r => r.name },
    { header: 'Stock', value: r => r.stock },
  ];

  it('genera cabecera y una línea por fila, con BOM y separador ;', () => {
    const csv = service.toCsv(columns, [{ name: 'Ratón', stock: 3 }, { name: 'Teclado', stock: 0 }]);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv.slice(1).split('\r\n')).toEqual(['Nombre;Stock', 'Ratón;3', 'Teclado;0']);
  });

  it('entrecomilla los valores con ; comillas o saltos de línea', () => {
    const csv = service.toCsv(columns, [{ name: 'Mesa; "grande"', stock: 1 }]);
    expect(csv).toContain('"Mesa; ""grande"""');
  });

  it('neutraliza la inyección de fórmulas de Excel', () => {
    const csv = service.toCsv(columns, [{ name: '=SUMA(A1:A9)', stock: 1 }]);
    expect(csv).toContain("'=SUMA(A1:A9)");
  });

  it('no altera los números negativos', () => {
    const csv = service.toCsv(columns, [{ name: 'Ajuste', stock: -4 }]);
    expect(csv).toContain('Ajuste;-4');
  });
});
