import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Observable, catchError, forkJoin, from, map, of, switchMap } from 'rxjs';

import { BackupFile } from '../models/backup.model';
import { CatalogItem } from '../models/catalog.model';
import { Enrollment } from '../models/enrollment.model';
import { Student } from '../models/student.model';
import { CatalogService } from './catalog.service';
import { EnrollmentService, Referencias } from './enrollment.service';
import { StudentService } from './student.service';

export const VERSION_FORMATO = '1.0';
const NOMBRE_ARCHIVO = 'uniregistro_respaldo.json';
const TAMANO_MAXIMO = 5 * 1024 * 1024;   // 5 MB

// Mismas reglas que el formulario de estudiante
const TIPOS_CONTACTO = ['movil', 'casa', 'trabajo', 'otro'];
const RE_CARNET = /^[A-Za-z0-9-]+$/;
const RE_NOMBRE = /^[\p{L}][\p{L}\s'.-]*$/u;
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RE_TELEFONO = /^\+?[0-9\s-]{8,15}$/;
const RE_ID_INSCRIPCION = /^INS-\d{3,}$/;

export interface ResultadoImportacion {
  ok: boolean;
  errores: string[];
  datos?: BackupFile;   // solo si todo es válido
}

export interface Resumen {
  estudiantes: number;
  inscripciones: number;
}

interface Catalogos {
  ref: Referencias;
  genero: CatalogItem[];
  departamento: CatalogItem[];
  carrera: CatalogItem[];
}

function esObjeto(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function fallo(...errores: string[]): ResultadoImportacion {
  return { ok: false, errores };
}

// Devuelve un mensaje si el texto no cumple, o null si es válido
function errorTexto(v: unknown, min: number, max: number, regex?: RegExp): string | null {
  if (typeof v !== 'string') return 'debe ser texto';
  const t = v.trim();
  if (t.length === 0) return 'es obligatorio';
  if (t.length < min || t.length > max) return `debe tener entre ${min} y ${max} caracteres`;
  if (regex && !regex.test(v)) return 'tiene un formato o caracteres no permitidos';
  return null;
}

function errorFechaNacimiento(v: unknown): string | null {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return 'debe tener formato AAAA-MM-DD';
  const f = new Date(v + 'T00:00:00');
  if (isNaN(f.getTime()) || f.toISOString().slice(0, 10) !== v) return 'no es una fecha válida';
  const hoy = new Date();
  if (f > hoy) return 'no puede ser una fecha futura';
  let edad = hoy.getFullYear() - f.getFullYear();
  if (hoy < new Date(hoy.getFullYear(), f.getMonth(), f.getDate())) edad--;
  if (edad < 15 || edad > 100) return 'corresponde a una edad fuera del rango permitido (15 a 100 años)';
  return null;
}

@Injectable({ providedIn: 'root' })
export class BackupService {
  private students = inject(StudentService);
  private enrollments = inject(EnrollmentService);
  private catalog = inject(CatalogService);
  private document = inject(DOCUMENT);

  resumen(): Resumen {
    return {
      estudiantes: this.students.getAll().length,
      inscripciones: this.enrollments.getAll().length
    };
  }

  // ---------------- EXPORTAR ----------------
  exportar(): Resumen {
    const datos: BackupFile = {
      version: VERSION_FORMATO,
      exportadoEn: new Date().toISOString(),
      estudiantes: this.students.getAll(),
      inscripciones: this.enrollments.getAll()
    };

    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = this.document.createElement('a');
    a.href = url;
    a.download = NOMBRE_ARCHIVO;
    this.document.body.appendChild(a);
    a.click();
    this.document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { estudiantes: datos.estudiantes.length, inscripciones: datos.inscripciones.length };
  }

  // ---------------- IMPORTAR ----------------
  // Paso 1: lee y valida TODO el archivo. No modifica ningún dato.
  validarArchivo(archivo: File): Observable<ResultadoImportacion> {
    if (!archivo.name.toLowerCase().endsWith('.json')) {
      return of(fallo('El archivo debe tener extensión .json.'));
    }
    if (archivo.size > TAMANO_MAXIMO) {
      return of(fallo('El archivo es demasiado grande (máximo 5 MB).'));
    }
    return from(archivo.text()).pipe(
      catchError(() => of(null)),
      switchMap(texto =>
        texto === null ? of(fallo('No se pudo leer el archivo.')) : this.validarTexto(texto)
      )
    );
  }

  // Paso 2 (solo después de que la persona confirme): reemplaza los datos.
  aplicar(datos: BackupFile): { ok: boolean; mensaje?: string } {
    const estudiantesAntes = this.students.getAll();
    const inscripcionesAntes = this.enrollments.getAll();
    try {
      this.students.replaceAll(datos.estudiantes);
      this.enrollments.replaceAll(datos.inscripciones);
      return { ok: true };
    } catch {
      // Si algo falla (por ejemplo, almacenamiento lleno) se restaura lo anterior
      try {
        this.students.replaceAll(estudiantesAntes);
        this.enrollments.replaceAll(inscripcionesAntes);
      } catch { /* sin más recursos */ }
      return {
        ok: false,
        mensaje: 'No se pudieron guardar los datos importados. Se conservaron los datos anteriores.'
      };
    }
  }

  // ---------------- Validación ----------------
  private validarTexto(texto: string): Observable<ResultadoImportacion> {
    // 1. Sintaxis
    let crudo: unknown;
    try {
      crudo = JSON.parse(texto);
    } catch {
      return of(fallo('El archivo está dañado o no contiene JSON válido.'));
    }

    // 2. Estructura
    const errEstructura = this.validarEstructura(crudo);
    if (errEstructura.length > 0) return of({ ok: false, errores: errEstructura });
    const raiz = crudo as Record<string, unknown>;

    return forkJoin({
      ref: this.enrollments.getReferencias(),
      genero: this.catalog.getLista('genero'),
      departamento: this.catalog.getLista('departamento'),
      carrera: this.catalog.getLista('carrera')
    }).pipe(
      map((cat: Catalogos): ResultadoImportacion => {
        // 3. Estudiantes
        const errEst: string[] = [];
        const estudiantes: Student[] = [];
        const carnets = new Set<string>();
        (raiz['estudiantes'] as unknown[]).forEach((e, i) => {
          const errs = this.validarEstudiante(e, i, cat);
          if (errs.length > 0) { errEst.push(...errs); return; }
          const est = e as Student;
          const clave = est.carnet.toLowerCase();
          if (carnets.has(clave)) {
            errEst.push(`Estudiante ${i + 1}: el carnet "${est.carnet}" está repetido en el archivo.`);
            return;
          }
          carnets.add(clave);
          estudiantes.push(est);
        });
        if (errEst.length > 0) return { ok: false, errores: errEst };

        // 4. Inscripciones: forma, y luego reglas y referencias
        const errIns: string[] = [];
        const inscripciones: Enrollment[] = [];
        const ids = new Set<string>();
        (raiz['inscripciones'] as unknown[]).forEach((x, i) => {
          const r = this.formaInscripcion(x, i);
          if (r.errores.length > 0) { errIns.push(...r.errores); return; }
          if (ids.has(r.ins!.id)) {
            errIns.push(`Inscripción ${i + 1}: el código "${r.ins!.id}" está repetido en el archivo.`);
            return;
          }
          ids.add(r.ins!.id);
          inscripciones.push(r.ins!);
        });
        if (errIns.length > 0) return { ok: false, errores: errIns };

        for (const ins of inscripciones) {
          // Se valida contra los estudiantes DEL ARCHIVO, no contra los actuales
          const errs = this.enrollments.validar(ins, estudiantes, cat.ref, inscripciones);
          errs.forEach(m => errIns.push(`Inscripción ${ins.id}: ${m}`));
        }
        if (errIns.length > 0) return { ok: false, errores: errIns };

        return {
          ok: true,
          errores: [],
          datos: {
            version: VERSION_FORMATO,
            exportadoEn: typeof raiz['exportadoEn'] === 'string' ? raiz['exportadoEn'] : '',
            estudiantes,
            inscripciones
          }
        };
      })
    );
  }

  private validarEstructura(crudo: unknown): string[] {
    if (!esObjeto(crudo)) {
      return ['El contenido debe ser un objeto JSON con el formato del respaldo de UMES.'];
    }
    const errores: string[] = [];
    if (typeof crudo['version'] !== 'string') {
      errores.push('Falta el campo "version".');
    } else if (crudo['version'] !== VERSION_FORMATO) {
      errores.push(`Versión de formato no soportada ("${crudo['version']}"). Se esperaba "${VERSION_FORMATO}".`);
    }
    if (!Array.isArray(crudo['estudiantes'])) errores.push('Falta la colección "estudiantes" o no es una lista.');
    if (!Array.isArray(crudo['inscripciones'])) errores.push('Falta la colección "inscripciones" o no es una lista.');
    return errores;
  }

  // Busca el valor en el catálogo (por id y value). Devuelve el elemento del catálogo.
  private itemCatalogo(
    v: unknown, lista: CatalogItem[], campo: string, prefijo: string, errores: string[]
  ): CatalogItem | null {
    if (!esObjeto(v) || typeof v['id'] !== 'number' || typeof v['value'] !== 'string') {
      errores.push(`${prefijo}: "${campo}" tiene un formato inválido.`);
      return null;
    }
    const item = lista.find(i => i.id === v['id'] && i.value === v['value']);
    if (!item) {
      errores.push(`${prefijo}: "${campo}" no corresponde a ningún valor del catálogo.`);
      return null;
    }
    return item;
  }

  private validarEstudiante(raw: unknown, i: number, cat: Catalogos): string[] {
    if (!esObjeto(raw)) return [`Estudiante ${i + 1}: no es un objeto válido.`];

    const carnet = typeof raw['carnet'] === 'string' ? raw['carnet'] : 'sin carnet';
    const p = `Estudiante ${i + 1} (${carnet})`;
    const errores: string[] = [];

    const textos: [string, number, number, RegExp?][] = [
      ['carnet', 4, 15, RE_CARNET],
      ['nombres', 2, 50, RE_NOMBRE],
      ['apellidos', 2, 50, RE_NOMBRE],
      ['email', 5, 100, RE_EMAIL],
      ['direccion', 5, 150]
    ];
    for (const [campo, min, max, regex] of textos) {
      const m = errorTexto(raw[campo], min, max, regex);
      if (m) errores.push(`${p}: "${campo}" ${m}.`);
    }

    const mf = errorFechaNacimiento(raw['fechaNacimiento']);
    if (mf) errores.push(`${p}: "fechaNacimiento" ${mf}.`);

    this.itemCatalogo(raw['genero'], cat.genero, 'genero', p, errores);
    const dep = this.itemCatalogo(raw['departamento'], cat.departamento, 'departamento', p, errores);
    this.itemCatalogo(raw['carrera'], cat.carrera, 'carrera', p, errores);


    const sem = raw['semestre'];
    if (typeof sem !== 'number' || !Number.isInteger(sem) || sem < 1 || sem > 10) {
      errores.push(`${p}: "semestre" debe ser un número entero entre 1 y 10.`);
    }

    const contactos = raw['contactos'];
    if (!Array.isArray(contactos) || contactos.length === 0) {
      errores.push(`${p}: "contactos" debe ser una lista con al menos un número.`);
    } else {
      contactos.forEach((c, j) => {
        const pc = `${p}, contacto ${j + 1}`;
        if (!esObjeto(c)) { errores.push(`${pc}: formato inválido.`); return; }
        if (typeof c['numero'] !== 'string' || !RE_TELEFONO.test(c['numero'])) {
          errores.push(`${pc}: "numero" debe tener de 8 a 15 dígitos.`);
        }
        if (typeof c['tipo'] !== 'string' || !TIPOS_CONTACTO.includes(c['tipo'])) {
          errores.push(`${pc}: "tipo" debe ser movil, casa, trabajo u otro.`);
        }
        if (typeof c['activo'] !== 'boolean') {
          errores.push(`${pc}: "activo" debe ser verdadero o falso.`);
        }
      });
    }

    return errores;
  }

  // Revisa que la inscripción tenga los campos y tipos esperados
  private formaInscripcion(raw: unknown, i: number): { ins?: Enrollment; errores: string[] } {
    if (!esObjeto(raw)) return { errores: [`Inscripción ${i + 1}: no es un objeto válido.`] };

    const p = `Inscripción ${i + 1} (${typeof raw['id'] === 'string' ? raw['id'] : 'sin código'})`;
    const errores: string[] = [];

    if (typeof raw['id'] !== 'string' || !RE_ID_INSCRIPCION.test(raw['id'])) {
      errores.push(`${p}: "id" debe tener el formato INS-001.`);
    }
    for (const campo of ['estudianteId', 'periodoId', 'estado', 'jornada', 'modalidad']) {
      if (typeof raw[campo] !== 'string' || (raw[campo] as string).trim() === '') {
        errores.push(`${p}: falta el campo "${campo}" o no es texto.`);
      }
    }
    const cursos = raw['cursoIds'];
    if (!Array.isArray(cursos) || cursos.some(c => typeof c !== 'string')) {
      errores.push(`${p}: "cursoIds" debe ser una lista de códigos de curso.`);
    }
    if (typeof raw['fechaCreacion'] !== 'string' || isNaN(Date.parse(raw['fechaCreacion']))) {
      errores.push(`${p}: "fechaCreacion" no es una fecha válida.`);
    }

    return errores.length > 0 ? { errores } : { ins: raw as unknown as Enrollment, errores: [] };
  }
}