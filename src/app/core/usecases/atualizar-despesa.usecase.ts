import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DespesaPort } from '../ports/despesa.port';
import { Despesa } from '../models/despesa.model';

@Injectable({ providedIn: 'root' })
export class AtualizarDespesaUseCase {
  private port = inject(DespesaPort);
  execute(id: number, despesa: Partial<Despesa>): Observable<void> { return this.port.atualizar(id, despesa); }
}
