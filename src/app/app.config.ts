import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { AuthPort } from './core/ports/auth.port';
import { AuthRepository } from './data/repositories/auth.repository';
import { DespesaPort } from './core/ports/despesa.port';
import { DespesaRepository } from './data/repositories/despesa.repository';
import { PessoaPort } from './core/ports/pessoa.port';
import { PessoaRepository } from './data/repositories/pessoa.repository';
import { ConvidadoPort } from './core/ports/convidado.port';
import { ConvidadoRepository } from './data/repositories/convidado.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    { provide: AuthPort, useClass: AuthRepository },
    { provide: DespesaPort, useClass: DespesaRepository },
    { provide: PessoaPort, useClass: PessoaRepository },
    { provide: ConvidadoPort, useClass: ConvidadoRepository },
  ],
};
