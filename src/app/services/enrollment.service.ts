import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';

import { Enrollment } from '../models/enrollment.model';
import { Student } from '../models/student.model';
import { Course } from '../models/course.model';
import { CatalogService } from './catalog.service';
import { StorageService } from './storage.service';
import { StudentService } from './student.service';

const CLAVE = 'umes_enrollments';
export const ESTADO_CANCELADA = 'Cancelada';

// Datos que el formulario envía; el servicio agrega id y fecha
export type NuevaInscripcion = Omit<Enrollment, 'id' | 'fechaCreacion'>;

export interface Resultado {
  ok: boolean;
  errores: string[];
}

// Valores válidos tomados de los catálogos JSON
export interface Referencias {
  cursos: Course[];
  periodos: string[];
  estados: string[];
  jornadas: string[];
  modalidades: string[];
}

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private storage = inject(StorageService);
  private students = inject(StudentService);
  private catalog = inject(CatalogService);

  // ---------- Consultas ----------
  getAll(): Enrollment[] {
    return this.storage.get<Enrollment[]>(CLAVE, []);
  }

  getById(id: string): Enrollment | undefined {
    return this.getAll().find(i => i.id === id);
  }

  getByEstudiante(carnet: string): Enrollment[] {
    return this.getAll().filter(i => i.estudianteId === carnet);
  }

  // Siguiente id con formato INS-001, INS-002...
  siguienteId(): string {
    const max = this.getAll()
      .map(i => parseInt(i.id.replace('INS-', ''), 10))
      .filter(n => !isNaN(n))
      .reduce((a, b) => Math.max(a, b), 0);
    return 'INS-' + String(max + 1).padStart(3, '0');
  }

  // Catálogos necesarios para validar (se leen de los JSON)
  getReferencias(): Observable<Referencias> {
    return forkJoin({
      cursos: this.catalog.getCursos(),
      periodos: this.catalog.getLista('periodo'),
      estados: this.catalog.getLista('estado'),
      jornadas: this.catalog.getLista('jornada'),
      modalidades: this.catalog.getLista('modalidad')
    }).pipe(
      map(r => ({
        cursos: r.cursos,
        periodos: r.periodos.map(x => x.value),
        estados: r.estados.map(x => x.value),
        jornadas: r.jornadas.map(x => x.value),
        modalidades: r.modalidades.map(x => x.value)
      }))
    );
  }

  // ---------- Reglas de negocio ----------
  // Función pura: recibe todo lo que necesita, así la importación también la puede usar
  // (validando contra los estudiantes del ARCHIVO y no contra los actuales).
  validar(
    ins: Enrollment,
    estudiantes: Student[],
    ref: Referencias,
    todas: Enrollment[]
  ): string[] {
    const errores: string[] = [];

    // 1. El estudiante debe existir
    const est = estudiantes.find(s => s.carnet === ins.estudianteId);
    if (!est) errores.push(`El estudiante "${ins.estudianteId}" no existe.`);

    // 2. Valores de catálogo
    if (!ref.periodos.includes(ins.periodoId)) errores.push(`El período "${ins.periodoId}" no es válido.`);
    if (!ref.estados.includes(ins.estado)) errores.push(`El estado "${ins.estado}" no es válido.`);
    if (!ref.jornadas.includes(ins.jornada)) errores.push(`La jornada "${ins.jornada}" no es válida.`);
    if (!ref.modalidades.includes(ins.modalidad)) errores.push(`La modalidad "${ins.modalidad}" no es válida.`);

    // 3. Cursos
    if (!Array.isArray(ins.cursoIds) || ins.cursoIds.length === 0) {
      errores.push('Debe seleccionar al menos un curso.');
    } else {
      if (new Set(ins.cursoIds).size !== ins.cursoIds.length) {
        errores.push('Hay cursos repetidos en la inscripción.');
      }
      for (const cid of ins.cursoIds) {
        const curso = ref.cursos.find(c => c.id === cid);
        if (!curso) {
          errores.push(`El curso "${cid}" no existe.`);
        } else if (est && curso.carreraId !== est.carrera.id) {
          errores.push(`El curso "${curso.nombre}" no pertenece a la carrera del estudiante.`);
        }
      }
    }

    // 4. Un estudiante no puede tener dos inscripciones activas en el mismo período
    if (ins.estado !== ESTADO_CANCELADA) {
      const repetida = todas.some(o =>
        o.id !== ins.id &&
        o.estudianteId === ins.estudianteId &&
        o.periodoId === ins.periodoId &&
        o.estado !== ESTADO_CANCELADA
      );
      if (repetida) {
        errores.push(`El estudiante ya tiene una inscripción activa en el período ${ins.periodoId}.`);
      }
    }

    return errores;
  }

  // ---------- Crear / modificar / cancelar ----------
  add(datos: NuevaInscripcion): Observable<Resultado> {
    return this.getReferencias().pipe(
      map(ref => {
        const ins: Enrollment = {
          ...datos,
          id: this.siguienteId(),
          fechaCreacion: new Date().toISOString()
        };
        const errores = this.validar(ins, this.students.getAll(), ref, this.getAll());
        if (errores.length > 0) return { ok: false, errores };

        this.storage.set(CLAVE, [...this.getAll(), ins]);
        return { ok: true, errores: [] };
      })
    );
  }

  update(id: string, datos: NuevaInscripcion): Observable<Resultado> {
    return this.getReferencias().pipe(
      map(ref => {
        const lista = this.getAll();
        const i = lista.findIndex(x => x.id === id);
        if (i === -1) return { ok: false, errores: ['La inscripción no existe.'] };
        if (lista[i].estado === ESTADO_CANCELADA) {
          return { ok: false, errores: ['Una inscripción cancelada no se puede modificar.'] };
        }

        const ins: Enrollment = { ...datos, id, fechaCreacion: lista[i].fechaCreacion };
        const errores = this.validar(ins, this.students.getAll(), ref, lista);
        if (errores.length > 0) return { ok: false, errores };

        lista[i] = ins;
        this.storage.set(CLAVE, lista);
        return { ok: true, errores: [] };
      })
    );
  }

  // Cancelar no borra: cambia el estado para conservar el historial
  cancelar(id: string): boolean {
    const lista = this.getAll();
    const i = lista.findIndex(x => x.id === id);
    if (i === -1) return false;
    lista[i] = { ...lista[i], estado: ESTADO_CANCELADA };
    this.storage.set(CLAVE, lista);
    return true;
  }
}