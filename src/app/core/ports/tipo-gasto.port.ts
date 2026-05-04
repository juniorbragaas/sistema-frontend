import { Observable } from 'rxjs';
import { TipoGasto } from '../models/tipo-gasto.model';

export abstract class TipoGastoPort {
  abstract listar(): Observable<TipoGasto[]>;
  abstract criar(tipoGasto: Partial<TipoGasto>): Observable<TipoGasto>;
  abstract atualizar(id: number, tipoGasto: Partial<TipoGasto>): Observable<void>;
  abstract excluir(id: number): Observable<void>;
}
