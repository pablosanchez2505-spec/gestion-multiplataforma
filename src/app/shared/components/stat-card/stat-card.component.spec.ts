import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { StatCardComponent } from './stat-card.component';

@Component({
  imports: [StatCardComponent],
  template: `
    <app-stat-card label="Productos" [value]="12" hint="en catálogo" tone="success"
                   [clickable]="clickable" (selected)="clicks = clicks + 1" />
  `,
})
class HostComponent {
  clickable = false;
  clicks = 0;
}

describe('StatCardComponent', () => {
  function setup(clickable: boolean) {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.clickable = clickable;
    fixture.detectChanges();
    return fixture;
  }

  it('muestra etiqueta, valor y pista recibidos por input', () => {
    const el: HTMLElement = setup(false).nativeElement;
    expect(el.querySelector('.label')?.textContent).toContain('Productos');
    expect(el.querySelector('.value')?.textContent).toContain('12');
    expect(el.querySelector('.hint')?.textContent).toContain('en catálogo');
  });

  it('si no es clicable no pinta un botón', () => {
    expect(setup(false).nativeElement.querySelector('button')).toBeNull();
  });

  it('si es clicable emite `selected` al pulsar', () => {
    const fixture = setup(true);
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(fixture.componentInstance.clicks).toBe(1);
  });
});
