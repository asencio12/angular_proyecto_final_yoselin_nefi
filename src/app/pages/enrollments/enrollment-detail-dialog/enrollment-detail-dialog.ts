import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { Enrollment } from '../../../models/enrollment.model';
import { Student } from '../../../models/student.model';
import { Course } from '../../../models/course.model';

export interface EnrollmentDetailData {
  inscripcion: Enrollment;
  estudiante?: Student;
  cursos: Course[];
}

@Component({
  selector: 'app-enrollment-detail-dialog',
  imports: [MatDialogModule, MatButtonModule, DatePipe],
  templateUrl: './enrollment-detail-dialog.html',
  styleUrl: './enrollment-detail-dialog.css'
})
export class EnrollmentDetailDialog {
  d = inject<EnrollmentDetailData>(MAT_DIALOG_DATA);

  get totalCreditos(): number {
    return this.d.cursos.reduce((suma, c) => suma + c.creditos, 0);
  }
}