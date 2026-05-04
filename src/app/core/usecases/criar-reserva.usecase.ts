import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Reserva } from '../models/reserva.model';
import { ReservaPort } from '../ports/reserva.port';

@Injectable({ providedIn: 'root' })
export class CriarReservaUseCase {
  private port = inject(ReservaPort);
  execute(reserva: Partial<Reserva>): Observable<Reserva> { return this.port.criar(reserva); }
}
