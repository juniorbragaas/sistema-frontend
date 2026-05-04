import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Despesa } from '../models/despesa.model';
import { DespesaPort } from '../ports/despesa.port';

@Injectable({ providedIn: 'root' })
export class CriarDespesaUseCase {
  private port = inject(DespesaPort);
  execute(despesa: Partial<Despesa>): Observable<Despesa> { return this.port.criar(despesa); }
}
