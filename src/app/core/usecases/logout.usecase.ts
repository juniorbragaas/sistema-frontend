import { inject, Injectable } from '@angular/core';
import { AuthPort } from '../ports/auth.port';

@Injectable({ providedIn: 'root' })
export class LogoutUseCase {
  private authPort = inject(AuthPort);

  execute(): void {
    this.authPort.logout();
  }
}
