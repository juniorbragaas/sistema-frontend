import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MenuApi } from '../../core/models/menu.model';
import { MenuPort } from '../../core/ports/menu.port';

const API_URL = 'https://localhost:7116/api/Menus';

@Injectable({ providedIn: 'root' })
export class MenuRepository extends MenuPort {
  private http = inject(HttpClient);

  listar(): Observable<MenuApi[]> {
    return this.http.get<MenuApi[]>(API_URL);
  }

  criar(menu: Partial<MenuApi>): Observable<MenuApi> {
    return this.http.post<MenuApi>(
      API_URL,
      menu,
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  atualizar(id: string, menu: Partial<MenuApi>): Observable<MenuApi> {
    return this.http.put<MenuApi>(
      `${API_URL}/${id}`,
      menu,
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }
}
