import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {

  get<T>(clave: string, porDefecto: T): T {
    try {
      const texto = localStorage.getItem(clave);
      return texto ? (JSON.parse(texto) as T) : porDefecto;
    } catch {
      return porDefecto;
    }
  }

  set<T>(clave: string, valor: T): void {
    localStorage.setItem(clave, JSON.stringify(valor, null, 2));
  }

  remove(clave: string): void {
    localStorage.removeItem(clave);
  }
}