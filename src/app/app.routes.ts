import { Routes } from '@angular/router';
import { StudentList } from './pages/students/student-list/student-list';
import { StudentForm } from './pages/students/student-form/student-form';
import { EnrollmentList } from './pages/enrollments/enrollment-list/enrollment-list';
import { EnrollmentForm } from './pages/enrollments/enrollment-form/enrollment-form';
import { Backup } from './pages/backup/backup/backup';

export const routes: Routes = [
  { path: '', redirectTo: 'estudiantes', pathMatch: 'full'},
  {path:'estudiantes', component: StudentList},
  {path: 'estudiantes/nuevo', component: StudentForm},
  {path: 'estudiantes/carnet/editar', component: StudentForm},
  {path: 'inscripciones', component: EnrollmentList},
  {path: 'inscripciones/nuevo', component: EnrollmentForm},
  {path: 'inscipciones/id/editar', component: EnrollmentForm},
  {path: 'respaldo', component: Backup},
  {path: '**', redirectTo: 'estudiantes'}
];