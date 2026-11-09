import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';

import { StudentService } from '../../../services/student.service';
import { CatalogService } from '../../../services/catalog.service';
import { CatalogItem } from '../../../models/catalog.model';
import { Student, TipoContacto } from '../../../models/student.model';
import {
  fechaNacimientoValida, patronConMensaje, sinSoloEspacios
} from '../../../validators/validators';


@Component({
  selector: 'app-student-form',
  imports: [
    ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatRadioModule, MatCheckboxModule, MatButtonModule, MatIconModule, MatCardModule
  ],
  templateUrl: './student-form.html',
  styleUrl: './student-form.css'
})
export class StudentForm {
  private fb = inject(FormBuilder);
  private studentService = inject(StudentService);
  private catalog = inject(CatalogService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  private route = inject(ActivatedRoute);

  esEdicion = false;
  hoy = new Date().toISOString().slice(0, 10);
  semestres = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  tipos: { valor: TipoContacto; etiqueta: string}[] = [
    { valor: 'movil', etiqueta: 'Movil'},
    { valor: 'casa', etiqueta: 'Casa' },
    { valor: 'trabajo', etiqueta: 'Trabajo' },
    { valor: 'otro', etiqueta: 'Otro' }
  ];

  // Catálogos
  generos = toSignal(this.catalog.getLista('genero'), { initialValue: [] });
  carreras = toSignal(this.catalog.getLista('carrera'), { initialValue: [] });
    departamentos = toSignal(this.catalog.getLista('departamento'), { initialValue: [] as CatalogItem[] });
  // Validador de carnet duplicado (usa el servicio)
  private carnetUnico = (c: AbstractControl): ValidationErrors | null =>
    this.studentService.existe(c.value ?? '')
      ? { custom: 'Ya existe un estudiante con ese carnet' }
      : null;

  form = this.fb.group({
    carnet: ['', [
      Validators.required, sinSoloEspacios, Validators.minLength(4), Validators.maxLength(15),
      patronConMensaje(/^[A-Za-z0-9-]+$/, 'Solo letras, números y guiones, sin espacios'),
      this.carnetUnico
    ]],
    nombres: ['', [
      Validators.required, sinSoloEspacios, Validators.minLength(2), Validators.maxLength(50),
      patronConMensaje(/^[\p{L}][\p{L}\s'.-]*$/u, 'Solo letras y espacios')
    ]],
    apellidos: ['', [
      Validators.required, sinSoloEspacios, Validators.minLength(2), Validators.maxLength(50),
      patronConMensaje(/^[\p{L}][\p{L}\s'.-]*$/u, 'Solo letras y espacios')
    ]],
    fechaNacimiento: ['', [Validators.required, fechaNacimientoValida]],
    genero: [null as number | null, Validators.required],
    email: ['', [
      Validators.required, Validators.maxLength(100),
      patronConMensaje(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Ingrese un correo válido, ej. nombre@dominio.com')
    ]],
    direccion: ['', [
      Validators.required, sinSoloEspacios, Validators.minLength(5), Validators.maxLength(150)
    ]],
    departamento: [null as number | null, Validators.required],
    carrera: [null as number | null, Validators.required],
    semestre: [null as number | null, Validators.required],
    contactos: this.fb.array([this.nuevoContacto()], 
    Validators.minLength(1))
  });



  get contactos() {
  return this.form.controls.contactos;
}

private nuevoContacto() {
  return this.fb.group({
    numero: ['', [
      Validators.required, sinSoloEspacios,
      patronConMensaje(/^\+?[0-9\s-]{8,15}$/, 'Use de 8 a 15 dígitos (puede incluir +, espacios o guiones)')
    ]],
    tipo: ['movil' as TipoContacto, Validators.required],
    activo: [true]
  });
}

agregarContacto() {
  this.contactos.push(this.nuevoContacto());
}

quitarContacto(i: number) {
  if (this.contactos.length > 1) this.contactos.removeAt(i);
}

  private cargarParaEditar(carnet: string) {
  const s = this.studentService.getByCarnet(carnet);
  if (!s) {
    this.snack.open('El estudiante no existe', 'Cerrar', { duration: 3000 });
    this.router.navigate(['/estudiantes']);
    return;
  }

  this.esEdicion = true;
  this.form.controls.carnet.disable();   // el carnet es la llave, no se edita



  // Una fila de contacto por cada contacto guardado
  this.contactos.clear();
  s.contactos.forEach(() => this.contactos.push(this.nuevoContacto()));

  // emitEvent:false evita que se disparen los "reset" de las listas encadenadas
  this.form.patchValue({
    carnet: s.carnet,
    nombres: s.nombres,
    apellidos: s.apellidos,
    fechaNacimiento: s.fechaNacimiento,
    genero: s.genero.id,
    email: s.email,
    direccion: s.direccion,
    departamento: s.departamento.id,
    carrera: s.carrera.id,
    semestre: s.semestre,
    contactos: s.contactos
  }, { emitEvent: false });
  
}

  // Devuelve el mensaje de error de un control
  mensaje(c: AbstractControl | null): string {
    const e = c?.errors;
    if (!e) return '';
    if (e['required']) return 'Este campo es obligatorio';
    if (e['custom']) return e['custom'];
    if (e['minlength']) return `Mínimo ${e['minlength'].requiredLength} caracteres`;
    if (e['maxlength']) return `Máximo ${e['maxlength'].requiredLength} caracteres`;
    return 'Valor no válido';
  }

  private buscar(lista: CatalogItem[], id: number | null): CatalogItem {
    return lista.find(i => i.id === id)!;
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();

    const student: Student = {
      carnet: v.carnet!.trim(),
      nombres: v.nombres!.trim(),
      apellidos: v.apellidos!.trim(),
      fechaNacimiento: v.fechaNacimiento!,
      genero: this.buscar(this.generos(), v.genero),
      email: v.email!.trim(),
      direccion: v.direccion!.trim(),
      departamento: this.buscar(this.departamentos(), v.departamento),
      carrera: this.buscar(this.carreras(), v.carrera),
      semestre: v.semestre!,
      contactos: v.contactos.map(c => ({
        numero: c.numero!.trim(),
        tipo: c.tipo!,
        activo: !!c.activo
      }))   // se completa en el paso 4b
    };

    const r = this.esEdicion ? this.studentService.update(student) : this.studentService.add(student);
    if (!r.ok) {
      this.snack.open(r.mensaje ?? 'No se pudo guardar', 'Cerrar', { duration: 4000 });
      return;
    }
    this.snack.open('Estudiante guardado correctamente', 'Cerrar', { duration: 3000 });
    this.router.navigate(['/estudiantes']);
  }
}