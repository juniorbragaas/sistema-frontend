import { PessoaApi } from './pessoa-api.model';

export interface Convidado {
  id: string;
  foto: string;
  visitante: string;
  idPessoa: string;
  dataEntrada: string;
  dataSaida: string;
  pessoa: PessoaApi;
  [key: string]: unknown;
}
