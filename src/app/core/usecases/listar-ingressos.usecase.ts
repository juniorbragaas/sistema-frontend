import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Ingresso } from '../models/ingresso.model';
import { IngressoPort } from '../ports/ingresso.port';

@Injectable({ providedIn: 'root' })
export class ListarIngressosUseCase {
  private ingressoPort = inject(IngressoPort);

  execute(): Observable<Ingresso[]> {
    return this.ingressoPort.listar();
  }
}
