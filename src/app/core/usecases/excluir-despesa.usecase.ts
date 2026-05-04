import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DespesaPort } from '../ports/despesa.port';

@Injectable({ providedIn: 'root' })
export class ExcluirDespesaUseCase {
  private port = inject(DespesaPort);
  execute(id: number): Observable<void> { return this.port.excluir(id); }
}
