export interface MenuApi {
  id: string;
  nome: string;
  url: string;
  idPai: string | null;
  icone: string | null;
  [key: string]: unknown;
}
