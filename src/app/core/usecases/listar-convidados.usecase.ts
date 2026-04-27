import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Convidado } from '../models/convidado.model';
import { ConvidadoPort } from '../ports/convidado.port';

@Injectable({ providedIn: 'root' })
export class ListarConvidadosUseCase {
  private convidadoPort = inject(ConvidadoPort);

  execute(): Observable<Convidado[]> {
    return this.convidadoPort.listar();
  }
}
