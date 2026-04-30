import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MenuApi } from '../models/menu.model';
import { MenuPort } from '../ports/menu.port';

@Injectable({ providedIn: 'root' })
export class AtualizarMenuUseCase {
  private menuPort = inject(MenuPort);
  execute(id: string, menu: Partial<MenuApi>): Observable<MenuApi> { return this.menuPort.atualizar(id, menu); }
}
