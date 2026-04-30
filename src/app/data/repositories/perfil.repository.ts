import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Perfil } from '../../core/models/perfil.model';
import { PerfilPort } from '../../core/ports/perfil.port';

const API_URL = 'https://localhost:7116/api/Perfis';

@Injectable({ providedIn: 'root' })
export class PerfilRepository extends PerfilPort {
  private http = inject(HttpClient);

  listar(): Observable<Perfil[]> {
    return this.http.get<Perfil[]>(API_URL);
  }

  criar(perfil: Partial<Perfil>): Observable<Perfil> {
    return this.http.post<Perfil>(API_URL, perfil);
  }

  atualizar(id: string, perfil: Partial<Perfil>): Observable<Perfil> {
    return this.http.put<Perfil>(`${API_URL}/${id}`, perfil);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }
}
