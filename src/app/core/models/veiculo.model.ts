export interface Veiculo {
  id: string;
  idTipoVeiculo: string;
  clienteId: string;
  placa: string;
  marca?: string;
  modelo?: string;
  cor?: string;
}
