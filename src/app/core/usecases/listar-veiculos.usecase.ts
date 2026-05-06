import { Injectable, inject } from '@angular/core';
import { VeiculoPort } from '../ports/veiculo.port';
import { Veiculo } from '../models/veiculo.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ListarVeiculosUseCase {
  private veiculoPort = inject(VeiculoPort);

  execute(): Observable<Veiculo[]> {
    return this.veiculoPort.listar();
  }
}
