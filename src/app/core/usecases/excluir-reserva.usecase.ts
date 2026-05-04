import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReservaPort } from '../ports/reserva.port';

@Injectable({ providedIn: 'root' })
export class ExcluirReservaUseCase {
  private port = inject(ReservaPort);
  execute(id: number): Observable<void> { return this.port.excluir(id); }
}
