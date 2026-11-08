import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { BackupService } from '../../../services/backup.service';
import { BackupFile } from '../../../models/backup.model';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';

const MAX_ERRORES_VISIBLES = 10;

@Component({
  selector: 'app-backup',
  imports: [MatButtonModule, MatIconModule, MatCardModule, MatProgressBarModule],
  templateUrl: './backup.html',
  styleUrl: './backup.css'
})
export class Backup {
  private backupService = inject(BackupService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  resumen = signal(this.backupService.resumen());
  archivo = signal<string | null>(null);
  errores = signal<string[]>([]);
  exito = signal<string | null>(null);
  procesando = signal(false);

  readonly maxVisibles = MAX_ERRORES_VISIBLES;

  exportar() {
    const r = this.backupService.exportar();
    this.snack.open(
      `Respaldo exportado: ${r.estudiantes} estudiantes y ${r.inscripciones} inscripciones`,
      'Cerrar', { duration: 4000 }
    );
  }

  alElegirArchivo(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';   // permite volver a elegir el mismo archivo
    if (!archivo) return;

    this.errores.set([]);
    this.exito.set(null);
    this.archivo.set(archivo.name);
    this.procesando.set(true);

    // 1. Se valida todo; todavía no se toca ningún dato
    this.backupService.validarArchivo(archivo).subscribe(r => {
      this.procesando.set(false);
      if (!r.ok || !r.datos) {
        this.errores.set(r.errores);
        return;
      }
      this.pedirConfirmacion(r.datos);
    });
  }

  // 2. Advertencia y confirmación antes de reemplazar
  private pedirConfirmacion(datos: BackupFile) {
    const actual = this.backupService.resumen();
    this.dialog
      .open(ConfirmDialog, {
        data: {
          titulo: 'Importar y reemplazar datos',
          mensaje:
            `El archivo es válido y contiene ${datos.estudiantes.length} estudiantes y ` +
            `${datos.inscripciones.length} inscripciones. Al continuar se ELIMINARÁN los datos actuales ` +
            `(${actual.estudiantes} estudiantes y ${actual.inscripciones} inscripciones) y se reemplazarán ` +
            'por los del archivo. Esta acción no se puede deshacer. ' +
            'Si no tiene un respaldo de los datos actuales, cancele y expórtelos primero.',
          textoConfirmar: 'Reemplazar datos'
        }
      })
      .afterClosed()
      .subscribe(confirmado => {
        if (!confirmado) {
          this.archivo.set(null);
          return;
        }
        const r = this.backupService.aplicar(datos);
        if (!r.ok) {
          this.errores.set([r.mensaje ?? 'No se pudo importar el archivo.']);
          return;
        }
        this.resumen.set(this.backupService.resumen());
        this.exito.set(
          `Importación completada: ${datos.estudiantes.length} estudiantes y ` +
          `${datos.inscripciones.length} inscripciones.`
        );
        this.snack.open('Datos importados correctamente', 'Cerrar', { duration: 4000 });
      });
  }
}