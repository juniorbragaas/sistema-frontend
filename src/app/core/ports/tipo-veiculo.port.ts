import { Observable } from 'rxjs';
import { TipoVeiculo } from '../models/tipo-veiculo.model';

export abstract class TipoVeiculoPort {
  abstract listar(): Observable<TipoVeiculo[]>;
  abstract criar(tipoVeiculo: Partial<TipoVeiculo>): Observable<TipoVeiculo>;
  abstract atualizar(id: string, tipoVeiculo: Partial<TipoVeiculo>): Observable<TipoVeiculo>;
  abstract excluir(id: string): Observable<void>;
}
