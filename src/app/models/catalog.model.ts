export interface CatalogItem {
  id: number;
  value: string;
  paisId?: number;
  departamentoId?: number;
}

export interface Catalogo {
  genero: CatalogItem[];
  jornada: CatalogItem[];
  modalidad: CatalogItem[];
  estado: CatalogItem[];
  periodo: CatalogItem[];
  carrera: CatalogItem[];
  pais: CatalogItem[];
  departamento: CatalogItem[];
  municipio: CatalogItem[];
}