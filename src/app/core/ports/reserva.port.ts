import { Observable } from 'rxjs';
import { Reserva } from '../models/reserva.model';

export abstract class ReservaPort {
  abstract listar(): Observable<Reserva[]>;
  abstract criar(reserva: Partial<Reserva>): Observable<Reserva>;
  abstract atualizar(id: number, reserva: Partial<Reserva>): Observable<void>;
  abstract excluir(id: number): Observable<void>;
}
