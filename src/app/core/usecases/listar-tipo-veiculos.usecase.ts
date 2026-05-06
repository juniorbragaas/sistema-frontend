import { Injectable, inject } from '@angular/core';
import { TipoVeiculoPort } from '../ports/tipo-veiculo.port';
import { TipoVeiculo } from '../models/tipo-veiculo.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ListarTipoVeiculosUseCase {
  private tipoVeiculoPort = inject(TipoVeiculoPort);

  execute(): Observable<TipoVeiculo[]> {
    return this.tipoVeiculoPort.listar();
  }
}
