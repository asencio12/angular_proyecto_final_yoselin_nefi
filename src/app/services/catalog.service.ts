import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private http = inject(HttpClient);
  
  // Ruta hacia tu archivo JSON en la carpeta assets
  private jsonUrl = 'assets/catalogo.json';

  // Método para obtener los catálogos
  getCatalogs(): Observable<any> {
    return this.http.get<any>(this.jsonUrl);
  }
}