export interface Reserva {
  id: number;
  responsavel: string;
  data: string;        // ISO date string: "2026-05-01"
  valor: number;
  horaInicio: string;  // "HH:mm:ss"
  horaFinal: string;   // "HH:mm:ss"
  descricao: string | null;
  [key: string]: unknown;
}
