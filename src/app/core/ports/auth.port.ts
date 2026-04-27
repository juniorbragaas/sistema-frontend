import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';

export abstract class AuthPort {
  abstract currentUser: () => Usuario | null;
  abstract isAuthenticated(): boolean;
  abstract login(nome: string, senha: string): Observable<Usuario>;
  abstract logout(): void;
  abstract getSessionExpiresAt(): number | null;
}
