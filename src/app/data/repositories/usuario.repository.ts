import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../../core/models/usuario.model';
import { UsuarioPort } from '../../core/ports/usuario.port';

const API_URL = 'https://localhost:7116/api/Usuarios';

@Injectable({ providedIn: 'root' })
export class UsuarioRepository extends UsuarioPort {
  private http = inject(HttpClient);

  // GET /api/Usuarios
  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(API_URL);
  }

  // POST /api/Usuarios
  criar(usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.post<Usuario>(API_URL, usuario);
  }

  // PUT /api/Usuarios/{id}
  atualizar(id: string, usuario: Partial<Usuario>): Observable<void> {
    return this.http.put<void>(`${API_URL}/${id}`, usuario);
  }

  // DELETE /api/Usuarios/{id}
  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }
}
