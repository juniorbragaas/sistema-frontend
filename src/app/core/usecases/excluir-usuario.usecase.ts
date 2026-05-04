import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UsuarioPort } from '../ports/usuario.port';

@Injectable({ providedIn: 'root' })
export class ExcluirUsuarioUseCase {
  private port = inject(UsuarioPort);
  execute(id: string): Observable<void> { return this.port.excluir(id); }
}
