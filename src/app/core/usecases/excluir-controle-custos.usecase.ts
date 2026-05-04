import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ControleCustosPort } from '../ports/controle-custos.port';

@Injectable({ providedIn: 'root' })
export class ExcluirControleCustosUseCase {
  private port = inject(ControleCustosPort);
  execute(id: number): Observable<void> {
    return this.port.excluir(id);
  }
}
