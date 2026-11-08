import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { EnrollmentService, ESTADO_CANCELADA } from '../../../services/enrollment.service';
import { StudentService } from '../../../services/student.service';
import { CatalogService } from '../../../services/catalog.service';
import { Enrollment } from '../../../models/enrollment.model';
import { CatalogItem } from '../../../models/catalog.model';
import { Course } from '../../../models/course.model';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import {
  EnrollmentDetailData, EnrollmentDetailDialog
} from '../enrollment-detail-dialog/enrollment-detail-dialog';

@Component({
  selector: 'app-enrollment-list',
  imports: [RouterLink, MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule,
            MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './enrollment-list.html',
  styleUrl: './enrollment-list.css'
})
export class EnrollmentList {
  private enrollmentService = inject(EnrollmentService);
  private studentService = inject(StudentService);
  private catalog = inject(CatalogService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  readonly CANCELADA = ESTADO_CANCELADA;

  inscripciones = signal<Enrollment[]>(this.enrollmentService.getAll());
  private estudiantes = this.studentService.getAll();

  cursos = toSignal(this.catalog.getCursos(), { initialValue: [] as Course[] });
  periodos = toSignal(this.catalog.getLista('periodo'), { initialValue: [] as CatalogItem[] });
  estados = toSignal(this.catalog.getLista('estado'), { initialValue: [] as CatalogItem[] });

  busqueda = signal('');
  periodo = signal<string | null>(null);
  estado = signal<string | null>(null);

  columnas = ['id', 'estudiante', 'periodo', 'cursos', 'estado', 'acciones'];

  // "EST-001 - María López" (o solo el carnet si el estudiante no se encuentra)
  nombreEstudiante(carnet: string): string {
    const e = this.estudiantes.find(s => s.carnet === carnet);
    return e ? `${e.carnet} - ${e.nombres} ${e.apellidos}` : carnet;
  }

  codigosCursos(ids: string[]): string {
    return ids.join(', ');
  }

  filtradas = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.inscripciones()
      .filter(i => {
        const coincideTexto = !texto ||
          `${this.nombreEstudiante(i.estudianteId)} ${i.id}`.toLowerCase().includes(texto);
        const coincidePeriodo = this.periodo() === null || i.periodoId === this.periodo();
        const coincideEstado = this.estado() === null || i.estado === this.estado();
        return coincideTexto && coincidePeriodo && coincideEstado;
      })
      .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion));   // más recientes primero
  });

  limpiarFiltros() {
    this.busqueda.set('');
    this.periodo.set(null);
    this.estado.set(null);
  }

  recargar() {
    this.inscripciones.set(this.enrollmentService.getAll());
  }

  ver(ins: Enrollment) {
    const data: EnrollmentDetailData = {
      inscripcion: ins,
      estudiante: this.estudiantes.find(s => s.carnet === ins.estudianteId),
      cursos: this.cursos().filter(c => ins.cursoIds.includes(c.id))
    };
    this.dialog.open(EnrollmentDetailDialog, { data, width: '600px', maxWidth: '95vw' });
  }

  cancelar(ins: Enrollment) {
    this.dialog
      .open(ConfirmDialog, {
        data: {
          titulo: 'Cancelar inscripción',
          mensaje: `¿Desea cancelar la inscripción ${ins.id} de ${this.nombreEstudiante(ins.estudianteId)}? ` +
                   'Una inscripción cancelada ya no se puede modificar.',
          textoConfirmar: 'Cancelar inscripción'
        }
      })
      .afterClosed()
      .subscribe(confirmado => {
        if (confirmado) {
          this.enrollmentService.cancelar(ins.id);
          this.recargar();
          this.snack.open('Inscripción cancelada', 'Cerrar', { duration: 3000 });
        }
      });
  }
}