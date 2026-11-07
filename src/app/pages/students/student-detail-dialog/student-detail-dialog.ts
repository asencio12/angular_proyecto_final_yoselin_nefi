import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { Student } from '../../../models/student.model';

@Component({
  selector: 'app-student-detail-dialog',
  imports: [
    MatDialogModule, 
    MatButtonModule, 
    DatePipe
  ],
  templateUrl: './student-detail-dialog.html',
  styleUrl: './student-detail-dialog.css'
})
export class StudentDetailDialog {
  e = inject<Student>(MAT_DIALOG_DATA);
}