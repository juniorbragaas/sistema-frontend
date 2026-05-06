import { Injectable, inject } from '@angular/core';
import { VeiculoPort } from '../ports/veiculo.port';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExcluirVeiculoUseCase {
  private veiculoPort = inject(VeiculoPort);

  execute(id: string): Observable<void> {
    return this.veiculoPort.excluir(id);
  }
}
