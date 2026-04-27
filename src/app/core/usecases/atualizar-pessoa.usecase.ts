import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PessoaApi } from '../models/pessoa-api.model';
import { PessoaPort } from '../ports/pessoa.port';

@Injectable({ providedIn: 'root' })
export class AtualizarPessoaUseCase {
  private pessoaPort = inject(PessoaPort);

  execute(id: string, pessoa: Partial<PessoaApi>): Observable<PessoaApi> {
    return this.pessoaPort.atualizar(id, pessoa);
  }
}
