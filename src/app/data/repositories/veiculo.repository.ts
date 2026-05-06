import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Veiculo } from '../../core/models/veiculo.model';
import { VeiculoPort } from '../../core/ports/veiculo.port';

const API_URL = 'https://localhost:7116/api/Veiculos';

@Injectable({ providedIn: 'root' })
export class VeiculoRepository extends VeiculoPort {
  private http = inject(HttpClient);

  listar(): Observable<Veiculo[]> {
    return this.http.get<Veiculo[]>(API_URL);
  }

  criar(veiculo: Partial<Veiculo>): Observable<Veiculo> {
    return this.http.post<Veiculo>(API_URL, veiculo);
  }

  atualizar(id: string, veiculo: Partial<Veiculo>): Observable<Veiculo> {
    return this.http.put<Veiculo>(`${API_URL}/${id}`, veiculo);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }
}
