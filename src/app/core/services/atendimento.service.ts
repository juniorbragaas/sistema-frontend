import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AtendimentoDto {
  id: string;
  ordem: number;
  status: string;
  dataEntrada: string;
  dataSaida: string | null;
  nome: string;
  atendente: string;
  setor: string;
  numero: string;
}

@Injectable({ providedIn: 'root' })
export class AtendimentoService {
  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:7116/api/Atendimento';

  listarAtendimentos(): Observable<AtendimentoDto[]> {
    return this.http.get<AtendimentoDto[]>(this.apiUrl);
  }

  gerarSenha(): Observable<AtendimentoDto> {
    return this.http.post<AtendimentoDto>(`${this.apiUrl}/gerar-senha`, {});
  }

  atualizarAtendimento(id: string, status: string, atendente: string, dataEntrada?: string): Observable<AtendimentoDto> {
    const body: any = { status, atendente };
    if (dataEntrada) {
      body.dataEntrada = dataEntrada;
    }
    return this.http.put<AtendimentoDto>(`${this.apiUrl}/${id}`, body);
  }

  atualizarAtendimentoCompleto(atendimento: AtendimentoDto): Observable<AtendimentoDto> {
    return this.http.put<AtendimentoDto>(`${this.apiUrl}/${atendimento.id}`, atendimento);
  }

  finalizarAtendimento(id: string): Observable<AtendimentoDto> {
    return this.http.put<AtendimentoDto>(`${this.apiUrl}/${id}/finalizar`, {});
  }
}
