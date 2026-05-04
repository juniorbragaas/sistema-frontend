export interface PessoaResumo {
  id: string;
  nomeCompleto: string;
  foto: string | null;
  [key: string]: unknown;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
  dataCriacao: string;
  idPessoa: string | null;
  pessoa?: PessoaResumo | null;
  [key: string]: unknown;
}
