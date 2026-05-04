import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ControleCustos } from '../models/controle-custos.model';
import { ControleCustosPort } from '../ports/controle-custos.port';

@Injectable({ providedIn: 'root' })
export class AtualizarControleCustosUseCase {
  private port = inject(ControleCustosPort);
  execute(id: number, controleCustos: Partial<ControleCustos>): Observable<void> {
    return this.port.atualizar(id, controleCustos);
  }
}
