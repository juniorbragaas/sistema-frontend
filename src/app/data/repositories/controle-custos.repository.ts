import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ControleCustos } from '../../core/models/controle-custos.model';
import { ControleCustosPort } from '../../core/ports/controle-custos.port';

const API_URL = 'https://localhost:7116/api/ControleGastos';

@Injectable({ providedIn: 'root' })
export class ControleCustosRepository extends ControleCustosPort {
  private http = inject(HttpClient);

  // GET /api/ControleGastos
  listar(): Observable<ControleCustos[]> {
    return this.http.get<ControleCustos[]>(API_URL);
  }

  // POST /api/ControleGastos
  criar(controleCustos: Partial<ControleCustos>): Observable<ControleCustos> {
    return this.http.post<ControleCustos>(API_URL, controleCustos);
  }

  // PUT /api/ControleGastos/{id}
  atualizar(id: number, controleCustos: Partial<ControleCustos>): Observable<void> {
    return this.http.put<void>(`${API_URL}/${id}`, controleCustos);
  }

  // DELETE /api/ControleGastos/{id}
  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }
}
