import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PessoaApi } from '../models/pessoa-api.model';
import { PessoaPort } from '../ports/pessoa.port';

@Injectable({ providedIn: 'root' })
export class BuscarPessoaCpfUseCase {
  private pessoaPort = inject(PessoaPort);

  execute(cpf: string): Observable<PessoaApi> {
    return this.pessoaPort.buscarPorCpf(cpf);
  }
}
