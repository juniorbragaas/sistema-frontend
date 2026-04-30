import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PessoaApi } from '../models/pessoa-api.model';
import { PessoaPort } from '../ports/pessoa.port';

@Injectable({ providedIn: 'root' })
export class CriarPessoaUseCase {
  private pessoaPort = inject(PessoaPort);

  execute(pessoa: Omit<PessoaApi, 'id'> & { id?: string }): Observable<PessoaApi> {
    return this.pessoaPort.criar(pessoa);
  }
}
