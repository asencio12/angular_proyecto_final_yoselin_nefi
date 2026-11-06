import { Student } from './student.model';
import { Enrollment } from './enrollment.model';

export interface BackupFile {
  version: string;
  exportadoEn: string;
  estudiantes: Student[];
  inscripciones: Enrollment[];
}