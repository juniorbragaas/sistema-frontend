import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MenuApi } from '../models/menu.model';
import { MenuPort } from '../ports/menu.port';

@Injectable({ providedIn: 'root' })
export class CriarMenuUseCase {
  private menuPort = inject(MenuPort);
  execute(menu: Partial<MenuApi>): Observable<MenuApi> { return this.menuPort.criar(menu); }
}
