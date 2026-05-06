import { Injectable, inject } from '@angular/core';
import { TipoVeiculoPort } from '../ports/tipo-veiculo.port';
import { TipoVeiculo } from '../models/tipo-veiculo.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CriarTipoVeiculoUseCase {
  private tipoVeiculoPort = inject(TipoVeiculoPort);

  execute(tipoVeiculo: Partial<TipoVeiculo>): Observable<TipoVeiculo> {
    return this.tipoVeiculoPort.criar(tipoVeiculo);
  }
}
