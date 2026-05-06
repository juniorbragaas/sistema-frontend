export interface Ingresso {
  id: string;
  nomeEvento: string;
  dataInicio: string;
  dataFim: string;
  tipoIngresso: string;
  status: number; // 1 = Utilizado, 2 = Não utilizado
  nomeComprador: string;
  dataNascimento: string;
  cpfRg: string;
}

export const STATUS_INGRESSO: Record<number, string> = {
  1: 'Utilizado',
  2: 'Não utilizado',
};
