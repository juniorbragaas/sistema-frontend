import { Injectable, inject } from '@angular/core';
import { VeiculoPort } from '../ports/veiculo.port';
import { Veiculo } from '../models/veiculo.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AtualizarVeiculoUseCase {
  private veiculoPort = inject(VeiculoPort);

  execute(id: string, veiculo: Partial<Veiculo>): Observable<Veiculo> {
    return this.veiculoPort.atualizar(id, veiculo);
  }
}
