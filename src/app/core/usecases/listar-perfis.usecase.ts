import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Perfil } from '../models/perfil.model';
import { PerfilPort } from '../ports/perfil.port';

@Injectable({ providedIn: 'root' })
export class ListarPerfisUseCase {
  private perfilPort = inject(PerfilPort);

  execute(): Observable<Perfil[]> {
    return this.perfilPort.listar();
  }
}
