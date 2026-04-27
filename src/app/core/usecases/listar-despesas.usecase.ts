import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Despesa } from '../models/despesa.model';
import { DespesaPort } from '../ports/despesa.port';

@Injectable({ providedIn: 'root' })
export class ListarDespesasUseCase {
  private despesaPort = inject(DespesaPort);

  execute(): Observable<Despesa[]> {
    return this.despesaPort.listar();
  }
}
