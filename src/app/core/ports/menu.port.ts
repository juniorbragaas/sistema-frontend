import { Observable } from 'rxjs';
import { MenuApi } from '../models/menu.model';

export abstract class MenuPort {
  abstract listar(): Observable<MenuApi[]>;
  abstract criar(menu: Partial<MenuApi>): Observable<MenuApi>;
  abstract atualizar(id: string, menu: Partial<MenuApi>): Observable<MenuApi>;
  abstract excluir(id: string): Observable<void>;
}
