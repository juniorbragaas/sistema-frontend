import { Observable } from 'rxjs';
import { Despesa } from '../models/despesa.model';

export abstract class DespesaPort {
  abstract listar(): Observable<Despesa[]>;
  abstract criar(despesa: Partial<Despesa>): Observable<Despesa>;
  abstract atualizar(id: number, despesa: Partial<Despesa>): Observable<void>;
  abstract excluir(id: number): Observable<void>;
}
