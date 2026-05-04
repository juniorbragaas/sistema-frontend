import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reserva } from '../../core/models/reserva.model';
import { ReservaPort } from '../../core/ports/reserva.port';

const API_URL = 'https://localhost:7116/api/Reservas';

@Injectable({ providedIn: 'root' })
export class ReservaRepository extends ReservaPort {
  private http = inject(HttpClient);

  listar(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(API_URL);
  }

  criar(reserva: Partial<Reserva>): Observable<Reserva> {
    return this.http.post<Reserva>(API_URL, reserva);
  }

  atualizar(id: number, reserva: Partial<Reserva>): Observable<void> {
    return this.http.put<void>(`${API_URL}/${id}`, reserva);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }
}
