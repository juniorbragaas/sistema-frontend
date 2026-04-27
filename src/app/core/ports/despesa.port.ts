import { Observable } from 'rxjs';
import { Despesa } from '../models/despesa.model';

export abstract class DespesaPort {
  abstract listar(): Observable<Despesa[]>;
}
