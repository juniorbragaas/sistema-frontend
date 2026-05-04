import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TipoGastoPort } from '../ports/tipo-gasto.port';

@Injectable({ providedIn: 'root' })
export class ExcluirTipoGastoUseCase {
  private port = inject(TipoGastoPort);
  execute(id: number): Observable<void> { return this.port.excluir(id); }
}
