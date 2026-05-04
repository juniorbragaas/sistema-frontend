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
import { PerfilPort } from './core/ports/perfil.port';
import { PerfilRepository } from './data/repositories/perfil.repository';
import { MenuPort } from './core/ports/menu.port';
import { MenuRepository } from './data/repositories/menu.repository';
import { TipoGastoPort } from './core/ports/tipo-gasto.port';
import { TipoGastoRepository } from './data/repositories/tipo-gasto.repository';
import { UsuarioPort } from './core/ports/usuario.port';
import { UsuarioRepository } from './data/repositories/usuario.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    { provide: AuthPort,       useClass: AuthRepository },
    { provide: DespesaPort,    useClass: DespesaRepository },
    { provide: PessoaPort,     useClass: PessoaRepository },
    { provide: ConvidadoPort,  useClass: ConvidadoRepository },
    { provide: PerfilPort,     useClass: PerfilRepository },
    { provide: MenuPort,       useClass: MenuRepository },
    { provide: TipoGastoPort,  useClass: TipoGastoRepository },
    { provide: UsuarioPort,    useClass: UsuarioRepository },
  ],
};
