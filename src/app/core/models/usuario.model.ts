export interface Pessoa {
  nomeCompleto: string;
  email: string;
  telefone: string;
  endereco: string;
  cpf: string;
  foto: string;
  predio: string;
  andar: string;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha: string;
  dataCriacao: string;
  idPessoa: number;
  pessoa: Pessoa;
}

export interface LoginRequest {
  nome: string;
  senha: string;
}
