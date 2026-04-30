import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Perfil } from '../models/perfil.model';
import { PerfilPort } from '../ports/perfil.port';

@Injectable({ providedIn: 'root' })
export class AtualizarPerfilUseCase {
  private perfilPort = inject(PerfilPort);

  execute(id: string, perfil: Partial<Perfil>): Observable<Perfil> {
    return this.perfilPort.atualizar(id, perfil);
  }
}
