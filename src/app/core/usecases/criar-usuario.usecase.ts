import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { UsuarioPort } from '../ports/usuario.port';

@Injectable({ providedIn: 'root' })
export class CriarUsuarioUseCase {
  private port = inject(UsuarioPort);
  execute(usuario: Partial<Usuario>): Observable<Usuario> { return this.port.criar(usuario); }
}
