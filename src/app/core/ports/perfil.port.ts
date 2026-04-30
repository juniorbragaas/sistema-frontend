import { Observable } from 'rxjs';
import { Perfil } from '../models/perfil.model';

export abstract class PerfilPort {
  abstract listar(): Observable<Perfil[]>;
  abstract criar(perfil: Partial<Perfil>): Observable<Perfil>;
  abstract atualizar(id: string, perfil: Partial<Perfil>): Observable<Perfil>;
  abstract excluir(id: string): Observable<void>;
}
