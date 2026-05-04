import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { UsuarioPort } from '../ports/usuario.port';

@Injectable({ providedIn: 'root' })
export class ListarUsuariosUseCase {
  private port = inject(UsuarioPort);
  execute(): Observable<Usuario[]> { return this.port.listar(); }
}
