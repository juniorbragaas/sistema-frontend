import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Ingresso } from '../models/ingresso.model';
import { IngressoPort } from '../ports/ingresso.port';

@Injectable({ providedIn: 'root' })
export class CriarIngressoUseCase {
  private ingressoPort = inject(IngressoPort);

  execute(ingresso: Partial<Ingresso>): Observable<Ingresso> {
    return this.ingressoPort.criar(ingresso);
  }
}
