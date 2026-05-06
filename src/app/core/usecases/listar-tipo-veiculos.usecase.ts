import { Injectable, inject } from '@angular/core';
import { TipoVeiculoService } from '../services/tipo-veiculo.service';
import { TipoVeiculo } from '../models/tipo-veiculo.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ListarTipoVeiculosUseCase {
  private tipoVeiculoService = inject(TipoVeiculoService);

  execute(): Observable<TipoVeiculo[]> {
    return this.tipoVeiculoService.listarTodos();
  }
}
