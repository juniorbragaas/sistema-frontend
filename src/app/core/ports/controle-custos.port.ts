import { Observable } from 'rxjs';
import { ControleCustos } from '../models/controle-custos.model';

export abstract class ControleCustosPort {
  abstract listar(): Observable<ControleCustos[]>;
  abstract criar(controleCustos: Partial<ControleCustos>): Observable<ControleCustos>;
  abstract atualizar(id: number, controleCustos: Partial<ControleCustos>): Observable<void>;
  abstract excluir(id: number): Observable<void>;
}
