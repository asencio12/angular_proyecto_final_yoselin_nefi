import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'estudiantes', pathMatch: 'full' },
  {
    path: 'estudiantes',
    loadComponent: () => import('./pages/students/student-list/student-list').then(m => m.StudentList)
  },
  {
    path: 'estudiantes/nuevo',
    loadComponent: () => import('./pages/students/student-form/student-form').then(m => m.StudentForm)
  },
  {
    path: 'estudiantes/:carnet/editar',
    loadComponent: () => import('./pages/students/student-form/student-form').then(m => m.StudentForm)
  },
  {
    path: 'inscripciones',
    loadComponent: () => import('./pages/enrollments/enrollment-list/enrollment-list').then(m => m.EnrollmentList)
  },
  {
    path: 'inscripciones/nueva',
    loadComponent: () => import('./pages/enrollments/enrollment-form/enrollment-form').then(m => m.EnrollmentForm)
  },
  {
    path: 'inscripciones/:id/editar',
    loadComponent: () => import('./pages/enrollments/enrollment-form/enrollment-form').then(m => m.EnrollmentForm)
  },
  {
    path: 'respaldo',
    loadComponent: () => import('./pages/backup/backup/backup').then(m => m.Backup)
  },
  { path: '**', redirectTo: 'estudiantes' }
];