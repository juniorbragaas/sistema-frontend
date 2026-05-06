import { Observable } from 'rxjs';
import { Veiculo } from '../models/veiculo.model';

export abstract class VeiculoPort {
  abstract listar(): Observable<Veiculo[]>;
  abstract criar(veiculo: Partial<Veiculo>): Observable<Veiculo>;
  abstract atualizar(id: string, veiculo: Partial<Veiculo>): Observable<Veiculo>;
  abstract excluir(id: string): Observable<void>;
}
