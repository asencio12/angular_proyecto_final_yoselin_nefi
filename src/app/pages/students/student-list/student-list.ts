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

import { StudentService } from '../../../services/student.service';
import { CatalogService } from '../../../services/catalog.service';
import { Student } from '../../../models/student.model';

@Component({
  selector: 'app-student-list',
  imports: [RouterLink, MatTableModule, MatFormFieldModule, MatInputModule,
            MatSelectModule, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './student-list.html',
  styleUrl: './student-list.css'
})
export class StudentList {
  private studentService = inject(StudentService);
  private catalogService = inject(CatalogService);

  estudiantes = signal<Student[]>(this.studentService.getAll());
  carreras = toSignal(this.catalogService.getLista('carrera'), { initialValue: [] });
  semestres = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  busqueda = signal('');
  carreraId = signal<number | null>(null);
  semestre = signal<number | null>(null);

  columnas = ['carnet', 'nombre', 'email', 'carrera', 'semestre', 'acciones'];

  filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.estudiantes().filter(e => {
      const coincideTexto = !texto ||
        `${e.carnet} ${e.nombres} ${e.apellidos} ${e.email}`.toLowerCase().includes(texto);
      const coincideCarrera = this.carreraId() === null || e.carrera.id === this.carreraId();
      const coincideSemestre = this.semestre() === null || e.semestre === this.semestre();
      return coincideTexto && coincideCarrera && coincideSemestre;
    });
  });

  limpiarFiltros() {
    this.busqueda.set('');
    this.carreraId.set(null);
    this.semestre.set(null);
  }

  recargar() {
    this.estudiantes.set(this.studentService.getAll());
  }
}