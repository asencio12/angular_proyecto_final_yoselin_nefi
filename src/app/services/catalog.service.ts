import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';

import { Catalogo, CatalogItem } from '../models/catalog.model';
import { Course } from '../models/course.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);

  // Cada archivo se pide una sola vez y se reutiliza
  private catalogo$ = this.http.get<Catalogo>('/data/catalogo.json').pipe(shareReplay(1));
  private cursos$ = this.http.get<Course[]>('/data/cursos.json').pipe(shareReplay(1));

  // Una lista del catálogo, por ejemplo getLista('genero')
  getLista(nombre: keyof Catalogo): Observable<CatalogItem[]> {
    return this.catalogo$.pipe(map(c => c[nombre]));
  }

  // Departamentos que pertenecen a un país
  getDepartamentos(paisId: number): Observable<CatalogItem[]> {
    return this.getLista('departamento').pipe(
      map(lista => lista.filter(d => d.paisId === paisId))
    );
  }

  // Municipios que pertenecen a un departamento
  getMunicipios(departamentoId: number): Observable<CatalogItem[]> {
    return this.getLista('municipio').pipe(
      map(lista => lista.filter(m => m.departamentoId === departamentoId))
    );
  }

  getCursos(): Observable<Course[]> {
    return this.cursos$;
  }
}