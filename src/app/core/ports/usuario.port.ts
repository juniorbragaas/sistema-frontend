import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';

export abstract class UsuarioPort {
  abstract listar(): Observable<Usuario[]>;
  abstract criar(usuario: Partial<Usuario>): Observable<Usuario>;
  abstract atualizar(id: string, usuario: Partial<Usuario>): Observable<void>;
  abstract excluir(id: string): Observable<void>;
}
