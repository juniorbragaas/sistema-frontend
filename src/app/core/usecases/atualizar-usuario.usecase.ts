import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UsuarioPort } from '../ports/usuario.port';
import { Usuario } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class AtualizarUsuarioUseCase {
  private port = inject(UsuarioPort);
  execute(id: string, usuario: Partial<Usuario>): Observable<void> { return this.port.atualizar(id, usuario); }
}
