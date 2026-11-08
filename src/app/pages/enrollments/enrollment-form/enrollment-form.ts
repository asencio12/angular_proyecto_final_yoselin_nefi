import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';

import { StudentService } from '../../../services/student.service';
import { CatalogService } from '../../../services/catalog.service';
import {
  ESTADO_CANCELADA, EnrollmentService, NuevaInscripcion
} from '../../../services/enrollment.service';
import { CatalogItem } from '../../../models/catalog.model';
import { Course } from '../../../models/course.model';
import { Student } from '../../../models/student.model';

@Component({
  selector: 'app-enrollment-form',
  imports: [
    ReactiveFormsModule, RouterLink, MatFormFieldModule, MatSelectModule, MatRadioModule,
    MatListModule, MatButtonModule, MatIconModule, MatCardModule
  ],
  templateUrl: './enrollment-form.html',
  styleUrl: './enrollment-form.css'
})
export class EnrollmentForm {
  private fb = inject(FormBuilder);
  private studentService = inject(StudentService);
  private enrollmentService = inject(EnrollmentService);
  private catalog = inject(CatalogService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snack = inject(MatSnackBar);

  idEdicion: string | null = null;
  get esEdicion() { return this.idEdicion !== null; }

  // Datos para los controles
  estudiantes: Student[] = this.studentService.getAll();
  cursos = toSignal(this.catalog.getCursos(), { initialValue: [] as Course[] });
  periodos = toSignal(this.catalog.getLista('periodo'), { initialValue: [] as CatalogItem[] });
  jornadas = toSignal(this.catalog.getLista('jornada'), { initialValue: [] as CatalogItem[] });
  modalidades = toSignal(this.catalog.getLista('modalidad'), { initialValue: [] as CatalogItem[] });
  private todosEstados = toSignal(this.catalog.getLista('estado'), { initialValue: [] as CatalogItem[] });

  // "Cancelada" no se elige aquí: tiene su propia acción en el listado
  estados = computed(() => this.todosEstados().filter(e => e.value !== ESTADO_CANCELADA));

  form = this.fb.group({
    estudianteId: [null as string | null, Validators.required],
    periodoId: [null as string | null, Validators.required],
    jornada: [null as string | null, Validators.required],
    modalidad: [null as string | null, Validators.required],
    estado: ['Registrada' as string | null, Validators.required],
    cursoIds: [[] as string[], Validators.required]   // required falla con arreglo vacío
  });

  // Estado de la pantalla
  estudianteSel = signal<Student | undefined>(undefined);
  seleccion = signal<string[]>([]);
  erroresServicio = signal<string[]>([]);

  // Solo los cursos de la carrera del estudiante elegido
  cursosDisponibles = computed(() => {
    const est = this.estudianteSel();
    return est ? this.cursos().filter(c => c.carreraId === est.carrera.id) : [];
  });

  creditos = computed(() =>
    this.cursos()
      .filter(c => this.seleccion().includes(c.id))
      .reduce((suma, c) => suma + c.creditos, 0)
  );

  constructor() {
    // Al cambiar de estudiante, cambian los cursos disponibles y se limpia la selección
    this.form.controls.estudianteId.valueChanges.subscribe(carnet => {
      this.estudianteSel.set(this.estudiantes.find(s => s.carnet === carnet));
      this.form.controls.cursoIds.reset([]);
    });

    this.form.controls.cursoIds.valueChanges.subscribe(v => this.seleccion.set(v ?? []));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.cargarParaEditar(id);
  }

  private cargarParaEditar(id: string) {
    const ins = this.enrollmentService.getById(id);
    if (!ins) {
      this.snack.open('La inscripción no existe', 'Cerrar', { duration: 3000 });
      this.router.navigate(['/inscripciones']);
      return;
    }
    if (ins.estado === ESTADO_CANCELADA) {
      this.snack.open('Una inscripción cancelada no se puede modificar', 'Cerrar', { duration: 4000 });
      this.router.navigate(['/inscripciones']);
      return;
    }

    this.idEdicion = id;
    this.estudianteSel.set(this.estudiantes.find(s => s.carnet === ins.estudianteId));

    // El estudiante no se cambia al editar; emitEvent:false evita limpiar los cursos
    this.form.controls.estudianteId.setValue(ins.estudianteId, { emitEvent: false });
    this.form.controls.estudianteId.disable();

    this.form.patchValue({
      periodoId: ins.periodoId,
      jornada: ins.jornada,
      modalidad: ins.modalidad,
      estado: ins.estado
    });
    this.form.controls.cursoIds.setValue(ins.cursoIds);
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();   // getRawValue incluye el estudiante aunque esté deshabilitado
    const datos: NuevaInscripcion = {
      estudianteId: v.estudianteId!,
      periodoId: v.periodoId!,
      cursoIds: v.cursoIds!,
      estado: v.estado!,
      jornada: v.jornada!,
      modalidad: v.modalidad!
    };

    const operacion = this.idEdicion
      ? this.enrollmentService.update(this.idEdicion, datos)
      : this.enrollmentService.add(datos);

    operacion.subscribe(r => {
      if (!r.ok) {
        this.erroresServicio.set(r.errores);   // se muestran en pantalla
        return;
      }
      this.erroresServicio.set([]);
      this.snack.open('Inscripción guardada correctamente', 'Cerrar', { duration: 3000 });
      this.router.navigate(['/inscripciones']);
    });
  }
}
