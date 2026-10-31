import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { AlertController } from '@ionic/angular';

/** Contrato que implementan las páginas con formularios editables. */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/**
 * canDeactivate: se ejecuta al intentar SALIR de la ruta.
 * Si hay cambios sin guardar pide confirmación con un ion-alert.
 */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = async component => {
  // inject() debe llamarse antes del primer await (contexto de inyección)
  const alertCtrl = inject(AlertController);

  if (!component?.hasUnsavedChanges()) {
    return true;
  }

  const alert = await alertCtrl.create({
    header: 'Cambios sin guardar',
    message: 'Si sales ahora perderás los cambios. ¿Quieres salir?',
    buttons: [
      { text: 'Quedarme', role: 'cancel' },
      { text: 'Salir', role: 'confirm' },
    ],
  });
  await alert.present();
  const { role } = await alert.onDidDismiss();
  return role === 'confirm';
};
