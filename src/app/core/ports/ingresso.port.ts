import { Observable } from 'rxjs';
import { Ingresso } from '../models/ingresso.model';

export abstract class IngressoPort {
  abstract listar(): Observable<Ingresso[]>;
  abstract obterPorId(id: string): Observable<Ingresso>;
  abstract criar(ingresso: Partial<Ingresso>): Observable<Ingresso>;
  abstract atualizar(id: string, ingresso: Partial<Ingresso>): Observable<Ingresso>;
  abstract excluir(id: string): Observable<void>;
}
