import { Observable } from 'rxjs';
import { PessoaApi } from '../models/pessoa-api.model';

export abstract class PessoaPort {
  abstract listar(): Observable<PessoaApi[]>;
  abstract buscarPorId(id: string): Observable<PessoaApi>;
  abstract atualizar(id: string, pessoa: Partial<PessoaApi>): Observable<PessoaApi>;
  abstract buscarPorCpf(cpf: string): Observable<PessoaApi>;
}
