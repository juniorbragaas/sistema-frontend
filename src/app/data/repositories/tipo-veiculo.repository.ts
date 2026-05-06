import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TipoVeiculo } from '../../core/models/tipo-veiculo.model';
import { TipoVeiculoPort } from '../../core/ports/tipo-veiculo.port';

const API_URL = 'https://localhost:7116/api/TipoVeiculo';

@Injectable({ providedIn: 'root' })
export class TipoVeiculoRepository extends TipoVeiculoPort {
  private http = inject(HttpClient);

  listar(): Observable<TipoVeiculo[]> {
    return this.http.get<TipoVeiculo[]>(API_URL);
  }

  criar(tipoVeiculo: Partial<TipoVeiculo>): Observable<TipoVeiculo> {
    return this.http.post<TipoVeiculo>(API_URL, tipoVeiculo);
  }

  atualizar(id: string, tipoVeiculo: Partial<TipoVeiculo>): Observable<TipoVeiculo> {
    return this.http.put<TipoVeiculo>(`${API_URL}/${id}`, tipoVeiculo);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }
}
