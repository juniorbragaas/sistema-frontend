import { Injectable, inject } from '@angular/core';
import { TipoVeiculoService } from '../services/tipo-veiculo.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExcluirTipoVeiculoUseCase {
  private tipoVeiculoService = inject(TipoVeiculoService);

  execute(id: string): Observable<void> {
    return this.tipoVeiculoService.deletar(id);
  }
}
