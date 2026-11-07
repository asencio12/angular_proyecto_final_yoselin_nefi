import { Injectable, inject } from '@angular/core';

import { Student } from '../models/student.model';
import { StorageService } from './storage.service';

const CLAVE = 'umes_students';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private storage = inject(StorageService);

  // Consultar: devuelve todos los estudiantes guardados
  getAll(): Student[] {
    return this.storage.get<Student[]>(CLAVE, []);
  }

  // Consultar uno por carnet
  getByCarnet(carnet: string): Student | undefined {
    return this.getAll().find(s => s.carnet === carnet);
  }

  // Evitar duplicados: ¿ya existe ese carnet?
  existe(carnet: string): boolean {
    return this.getAll().some(s => s.carnet.toLowerCase() === carnet.trim().toLowerCase());
  }

  // Crear: rechaza si el carnet ya existe
  add(student: Student): { ok: boolean; mensaje?: string } {
    if (this.existe(student.carnet)) {
      return { ok: false, mensaje: 'Ya existe un estudiante con ese carnet.' };
    }
    const lista = this.getAll();
    lista.push(student);
    this.storage.set(CLAVE, lista);
    return { ok: true };
  }

  // Modificar: reemplaza el estudiante que tenga ese carnet
  update(student: Student): { ok: boolean; mensaje?: string } {
    const lista = this.getAll();
    const i = lista.findIndex(s => s.carnet === student.carnet);
    if (i === -1) {
      return { ok: false, mensaje: 'El estudiante no existe.' };
    }
    lista[i] = student;
    this.storage.set(CLAVE, lista);
    return { ok: true };
  }

  // Eliminar por carnet
  delete(carnet: string): void {
    const lista = this.getAll().filter(s => s.carnet !== carnet);
    this.storage.set(CLAVE, lista);
  }
}