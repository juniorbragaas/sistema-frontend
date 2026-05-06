import { Injectable, inject } from '@angular/core';
import { TipoVeiculoPort } from '../ports/tipo-veiculo.port';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExcluirTipoVeiculoUseCase {
  private tipoVeiculoPort = inject(TipoVeiculoPort);

  execute(id: string): Observable<void> {
    return this.tipoVeiculoPort.excluir(id);
  }
}
