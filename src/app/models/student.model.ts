export type TipoContacto = 'movil' | 'casa' | 'trabajo' | 'otro';

export interface Contacto {
  numero: string;
  tipo: TipoContacto;
  activo: boolean;
}

export interface Student {
  id: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  genero: string;
  email: string;
  direccion: string;
  carreraId: string;
  nacionalidad: string;
  fechaIngreso: string;
  contactos: Contacto[];
}