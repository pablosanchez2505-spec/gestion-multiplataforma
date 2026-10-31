import { TestBed } from '@angular/core/testing';

import { ChartComponent } from './chart.component';

describe('ChartComponent', () => {
  it('se crea y expone el canvas como imagen accesible', () => {
    const fixture = TestBed.createComponent(ChartComponent);
    fixture.componentRef.setInput('labels', ['A', 'B']);
    fixture.componentRef.setInput('series', [{ label: 'Uds', data: [1, 2] }]);
    fixture.componentRef.setInput('ariaLabel', 'Gráfico de prueba');
    fixture.componentRef.setInput('summary', 'A: 1; B: 2');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const canvas = el.querySelector('canvas');
    expect(canvas?.getAttribute('role')).toBe('img');
    expect(canvas?.getAttribute('aria-label')).toBe('Gráfico de prueba');
    expect(el.querySelector('figcaption')?.textContent).toContain('A: 1');
    fixture.destroy();
  });
});
