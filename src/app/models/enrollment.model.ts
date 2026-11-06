export interface Enrollment {
  id: string;
  estudianteId: string;
  periodoId: string;
  cursoIds: string[];
  estado: string;
  jornada: string;
  modalidad: string;
  fechaCreacion: string;
}