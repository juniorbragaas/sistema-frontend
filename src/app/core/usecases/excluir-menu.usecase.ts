import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MenuPort } from '../ports/menu.port';

@Injectable({ providedIn: 'root' })
export class ExcluirMenuUseCase {
  private menuPort = inject(MenuPort);
  execute(id: string): Observable<void> { return this.menuPort.excluir(id); }
}
