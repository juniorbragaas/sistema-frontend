import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PessoaApi } from '../models/pessoa-api.model';
import { PessoaPort } from '../ports/pessoa.port';

@Injectable({ providedIn: 'root' })
export class ListarPessoasUseCase {
  private pessoaPort = inject(PessoaPort);

  execute(): Observable<PessoaApi[]> {
    return this.pessoaPort.listar();
  }
}
