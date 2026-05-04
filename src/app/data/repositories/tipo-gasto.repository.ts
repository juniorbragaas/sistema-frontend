import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TipoGasto } from '../../core/models/tipo-gasto.model';
import { TipoGastoPort } from '../../core/ports/tipo-gasto.port';

const API_URL = 'https://localhost:7116/api/TipoGastos';

@Injectable({ providedIn: 'root' })
export class TipoGastoRepository extends TipoGastoPort {
  private http = inject(HttpClient);

  // GET /api/TipoGastos
  listar(): Observable<TipoGasto[]> {
    return this.http.get<TipoGasto[]>(API_URL);
  }

  // POST /api/TipoGastos
  criar(tipoGasto: Partial<TipoGasto>): Observable<TipoGasto> {
    return this.http.post<TipoGasto>(API_URL, tipoGasto);
  }

  // PUT /api/TipoGastos/{id}
  atualizar(id: number, tipoGasto: Partial<TipoGasto>): Observable<void> {
    return this.http.put<void>(`${API_URL}/${id}`, tipoGasto);
  }

  // DELETE /api/TipoGastos/{id}
  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }
}
