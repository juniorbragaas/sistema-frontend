import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthPort } from '../../core/ports/auth.port';

export const authGuard: CanActivateFn = () => {
  const authPort = inject(AuthPort);
  const router = inject(Router);

  if (authPort.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
