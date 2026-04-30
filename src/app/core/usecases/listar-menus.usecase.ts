import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MenuApi } from '../models/menu.model';
import { MenuPort } from '../ports/menu.port';

@Injectable({ providedIn: 'root' })
export class ListarMenusUseCase {
  private menuPort = inject(MenuPort);
  execute(): Observable<MenuApi[]> { return this.menuPort.listar(); }
}
