import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IngressoPort } from '../ports/ingresso.port';

@Injectable({ providedIn: 'root' })
export class ExcluirIngressoUseCase {
  private ingressoPort = inject(IngressoPort);

  execute(id: string): Observable<void> {
    return this.ingressoPort.excluir(id);
  }
}
