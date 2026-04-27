import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { AuthPort } from '../ports/auth.port';

@Injectable({ providedIn: 'root' })
export class LoginUseCase {
  private authPort = inject(AuthPort);

  execute(nome: string, senha: string): Observable<Usuario> {
    return this.authPort.login(nome, senha);
  }
}
