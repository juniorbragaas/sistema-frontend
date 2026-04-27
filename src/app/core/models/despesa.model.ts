export interface Despesa {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  tipo: string;
  [key: string]: unknown;
}
