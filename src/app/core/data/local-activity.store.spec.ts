import { firstValueFrom } from 'rxjs';

import { LocalActivityStore } from './local-activity.store';

describe('LocalActivityStore', () => {
  afterEach(() => localStorage.clear());

  it('guarda los eventos con el más reciente primero', async () => {
    const store = new LocalActivityStore();
    await store.add({ type: 'login', actor: 'Ana', detail: 'Inicio de sesión' });
    await store.add({ type: 'item_created', actor: 'Ana', detail: 'Creó "Ratón"' });

    const events = await firstValueFrom(store.events$);
    expect(events.map(e => e.type)).toEqual(['item_created', 'login']);
    store.destroy();
  });

  it('limita el historial a 50 eventos', async () => {
    const store = new LocalActivityStore();
    for (let i = 0; i < 60; i++) {
      await store.add({ type: 'login', actor: 'Ana', detail: `evento ${i}` });
    }
    expect((await firstValueFrom(store.events$)).length).toBe(50);
    store.destroy();
  });

  it('recupera el historial guardado al crear otro almacén', async () => {
    const first = new LocalActivityStore();
    await first.add({ type: 'login', actor: 'Ana', detail: 'x' });
    first.destroy();

    const second = new LocalActivityStore();
    expect((await firstValueFrom(second.events$)).length).toBe(1);
    second.destroy();
  });
});
