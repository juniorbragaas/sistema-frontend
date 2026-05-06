import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ingresso } from '../../core/models/ingresso.model';
import { IngressoPort } from '../../core/ports/ingresso.port';

const API_URL = 'https://localhost:7116/api/Ingressos';

@Injectable({ providedIn: 'root' })
export class IngressoRepository extends IngressoPort {
  private http = inject(HttpClient);

  listar(): Observable<Ingresso[]> {
    return this.http.get<Ingresso[]>(API_URL);
  }

  obterPorId(id: string): Observable<Ingresso> {
    return this.http.get<Ingresso>(`${API_URL}/${id}`);
  }

  criar(ingresso: Partial<Ingresso>): Observable<Ingresso> {
    return this.http.post<Ingresso>(API_URL, ingresso);
  }

  atualizar(id: string, ingresso: Partial<Ingresso>): Observable<Ingresso> {
    return this.http.put<Ingresso>(`${API_URL}/${id}`, ingresso);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }
}
