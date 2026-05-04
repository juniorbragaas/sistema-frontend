import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ControleCustos } from '../models/controle-custos.model';
import { ControleCustosPort } from '../ports/controle-custos.port';

@Injectable({ providedIn: 'root' })
export class CriarControleCustosUseCase {
  private port = inject(ControleCustosPort);
  execute(controleCustos: Partial<ControleCustos>): Observable<ControleCustos> {
    return this.port.criar(controleCustos);
  }
}
