import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Convidado } from '../../core/models/convidado.model';
import { ConvidadoPort } from '../../core/ports/convidado.port';

const API_URL = 'https://localhost:7116/api/Convidados';

@Injectable({ providedIn: 'root' })
export class ConvidadoRepository extends ConvidadoPort {
  private http = inject(HttpClient);

  listar(): Observable<Convidado[]> {
    return this.http.get<Convidado[]>(API_URL);
  }

  listarPorData(data: string): Observable<Convidado[]> {
    return this.http.get<Convidado[]>(`${API_URL}/por-data`, { params: { data } });
  }

  criar(convidado: Partial<Convidado>): Observable<Convidado> {
    return this.http.post<Convidado>(API_URL, convidado);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }
}
