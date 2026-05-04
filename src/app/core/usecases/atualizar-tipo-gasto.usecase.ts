import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TipoGastoPort } from '../ports/tipo-gasto.port';

@Injectable({ providedIn: 'root' })
export class AtualizarTipoGastoUseCase {
  private port = inject(TipoGastoPort);
  execute(id: number, tipoGasto: Partial<import('../models/tipo-gasto.model').TipoGasto>): Observable<void> {
    return this.port.atualizar(id, tipoGasto);
  }
}
