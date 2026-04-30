import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PerfilPort } from '../ports/perfil.port';

@Injectable({ providedIn: 'root' })
export class ExcluirPerfilUseCase {
  private perfilPort = inject(PerfilPort);

  execute(id: string): Observable<void> {
    return this.perfilPort.excluir(id);
  }
}
