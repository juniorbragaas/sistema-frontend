import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Convidado } from '../models/convidado.model';
import { ConvidadoPort } from '../ports/convidado.port';

@Injectable({ providedIn: 'root' })
export class CriarConvidadoUseCase {
  private convidadoPort = inject(ConvidadoPort);

  execute(convidado: Partial<Convidado>): Observable<Convidado> {
    return this.convidadoPort.criar(convidado);
  }
}
