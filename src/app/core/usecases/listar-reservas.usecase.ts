import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Reserva } from '../models/reserva.model';
import { ReservaPort } from '../ports/reserva.port';

@Injectable({ providedIn: 'root' })
export class ListarReservasUseCase {
  private port = inject(ReservaPort);
  execute(): Observable<Reserva[]> { return this.port.listar(); }
}
