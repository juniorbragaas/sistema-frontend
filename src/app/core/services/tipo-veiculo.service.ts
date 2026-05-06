import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TipoVeiculo {
  id: string;
  nome: string;
}

@Injectable({ providedIn: 'root' })
export class TipoVeiculoService {
  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:7116/api/TipoVeiculo';

  listarTodos(): Observable<TipoVeiculo[]> {
    return this.http.get<TipoVeiculo[]>(this.apiUrl);
  }

  obterPorId(id: string): Observable<TipoVeiculo> {
    return this.http.get<TipoVeiculo>(`${this.apiUrl}/${id}`);
  }

  criar(tipoVeiculo: TipoVeiculo): Observable<TipoVeiculo> {
    return this.http.post<TipoVeiculo>(this.apiUrl, tipoVeiculo);
  }

  atualizar(id: string, tipoVeiculo: TipoVeiculo): Observable<TipoVeiculo> {
    return this.http.put<TipoVeiculo>(`${this.apiUrl}/${id}`, tipoVeiculo);
  }

  deletar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
