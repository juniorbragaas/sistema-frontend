import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConvidadoPort } from '../ports/convidado.port';

@Injectable({ providedIn: 'root' })
export class ExcluirConvidadoUseCase {
  private convidadoPort = inject(ConvidadoPort);

  execute(id: string): Observable<void> {
    return this.convidadoPort.excluir(id);
  }
}
