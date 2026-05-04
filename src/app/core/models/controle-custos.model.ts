export interface ControleCustos {
  id: number;
  nome: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  valorPagamento?: number;
  statusAtraso: boolean;
  jurosPorAtraso?: number;
  statusPagamento: string;
  tipoDespesaId: number;
  tipoGastoId: number;
  tipoLancamento: number;
  tipoDespesa?: { id: number; nome: string };
  tipoGasto?: { id: number; nome: string };
  fotoComprovante?: string;
  [key: string]: unknown;
}
