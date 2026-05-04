import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TipoGasto } from '../models/tipo-gasto.model';
import { TipoGastoPort } from '../ports/tipo-gasto.port';

@Injectable({ providedIn: 'root' })
export class CriarTipoGastoUseCase {
  private port = inject(TipoGastoPort);
  execute(tipoGasto: Partial<TipoGasto>): Observable<TipoGasto> { return this.port.criar(tipoGasto); }
}
