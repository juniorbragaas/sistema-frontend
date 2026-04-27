import { Observable } from 'rxjs';
import { Convidado } from '../models/convidado.model';

export abstract class ConvidadoPort {
  abstract listar(): Observable<Convidado[]>;
  abstract listarPorData(data: string): Observable<Convidado[]>;
  abstract criar(convidado: Partial<Convidado>): Observable<Convidado>;
  abstract excluir(id: string): Observable<void>;
}
