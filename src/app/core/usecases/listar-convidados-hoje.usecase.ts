import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Convidado } from '../models/convidado.model';
import { ConvidadoPort } from '../ports/convidado.port';

@Injectable({ providedIn: 'root' })
export class ListarConvidadosHojeUseCase {
  private convidadoPort = inject(ConvidadoPort);

  execute(): Observable<Convidado[]> {
    const hoje = new Date().toISOString().split('T')[0];
    return this.convidadoPort.listarPorData(hoje);
  }
}
