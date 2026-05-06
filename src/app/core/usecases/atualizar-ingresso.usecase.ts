import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Ingresso } from '../models/ingresso.model';
import { IngressoPort } from '../ports/ingresso.port';

@Injectable({ providedIn: 'root' })
export class AtualizarIngressoUseCase {
  private ingressoPort = inject(IngressoPort);

  execute(id: string, ingresso: Partial<Ingresso>): Observable<Ingresso> {
    return this.ingressoPort.atualizar(id, ingresso);
  }
}
