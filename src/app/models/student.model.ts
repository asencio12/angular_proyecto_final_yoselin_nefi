import { CatalogItem } from './catalog.model';

export type TipoContacto = 'movil' | 'casa' | 'trabajo' | 'otro';

export interface Contacto {
  numero: string;
  tipo: TipoContacto;
  activo: boolean;
}

export interface Student {
  carnet: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  genero: CatalogItem;
  email: string;
  direccion: string;
  pais: CatalogItem;
  departamento: CatalogItem;
  municipio: CatalogItem;
  carrera: CatalogItem;
  semestre: number;
  contactos: Contacto[];
}