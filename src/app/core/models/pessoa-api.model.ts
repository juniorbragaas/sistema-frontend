export interface PessoaApi {
  id: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
  endereco: string;
  cpf: string;
  foto: string;
  predio: string;
  andar: string;
  [key: string]: unknown;
}
