import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Despesa } from '../../core/models/despesa.model';
import { DespesaPort } from '../../core/ports/despesa.port';

const API_URL = 'https://localhost:7116/api/Despesas';

@Injectable({ providedIn: 'root' })
export class DespesaRepository extends DespesaPort {
  private http = inject(HttpClient);

  listar(): Observable<Despesa[]> {
    return this.http.get<Despesa[]>(API_URL);
  }

  criar(despesa: Partial<Despesa>): Observable<Despesa> {
    return this.http.post<Despesa>(API_URL, despesa);
  }

  atualizar(id: number, despesa: Partial<Despesa>): Observable<void> {
    return this.http.put<void>(`${API_URL}/${id}`, despesa);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }
}
