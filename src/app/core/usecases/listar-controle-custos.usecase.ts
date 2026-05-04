import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ControleCustos } from '../models/controle-custos.model';
import { ControleCustosPort } from '../ports/controle-custos.port';

@Injectable({ providedIn: 'root' })
export class ListarControleCustosUseCase {
  private port = inject(ControleCustosPort);
  execute(): Observable<ControleCustos[]> { return this.port.listar(); }
}
