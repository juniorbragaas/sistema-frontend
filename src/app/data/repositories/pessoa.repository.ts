import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PessoaApi } from '../../core/models/pessoa-api.model';
import { PessoaPort } from '../../core/ports/pessoa.port';

const API_URL = 'https://localhost:7116/api/Pessoas';

@Injectable({ providedIn: 'root' })
export class PessoaRepository extends PessoaPort {
  private http = inject(HttpClient);

  listar(): Observable<PessoaApi[]> {
    return this.http.get<PessoaApi[]>(API_URL);
  }

  buscarPorId(id: string): Observable<PessoaApi> {
    return this.http.get<PessoaApi>(`${API_URL}/${id}`);
  }

  criar(pessoa: Partial<PessoaApi>): Observable<PessoaApi> {
    return this.http.post<PessoaApi>(API_URL, pessoa);
  }

  atualizar(id: string, pessoa: Partial<PessoaApi>): Observable<PessoaApi> {
    return this.http.put<PessoaApi>(`${API_URL}/${id}`, pessoa);
  }

  buscarPorCpf(cpf: string): Observable<PessoaApi> {
    return this.http.get<PessoaApi>(`${API_URL}/by-cpf/${cpf}`);
  }
}
