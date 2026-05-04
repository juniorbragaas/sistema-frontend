import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReservaPort } from '../ports/reserva.port';
import { Reserva } from '../models/reserva.model';

@Injectable({ providedIn: 'root' })
export class AtualizarReservaUseCase {
  private port = inject(ReservaPort);
  execute(id: number, reserva: Partial<Reserva>): Observable<void> { return this.port.atualizar(id, reserva); }
}
