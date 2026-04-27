import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Despesa } from '../../core/models/despesa.model';
import { DespesaPort } from '../../core/ports/despesa.port';

const API_URL = 'https://localhost:7116/api/Despesas';

@Injectable({ providedIn: 'root' })
export class DespesaRepository extends DespesaPort {
  private http = inject(HttpClient);

  listar(): Observable<Despesa[]> {
    return this.http.get<Despesa[]>(API_URL);
  }
}
