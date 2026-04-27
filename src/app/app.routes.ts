import { Routes } from '@angular/router';
import { authGuard } from './infra/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./presentation/pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./presentation/shared/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./presentation/pages/home/home.component').then(m => m.HomeComponent),
        data: { breadcrumb: 'Home' },
      },
      {
        path: 'tipo-despesas',
        loadComponent: () =>
          import('./presentation/pages/tipo-despesas/tipo-despesas.component').then(m => m.TipoDespesasComponent),
        data: { breadcrumb: 'Tipo de Despesas' },
      },
      {
        path: 'pessoas',
        loadComponent: () =>
          import('./presentation/pages/pessoas/pessoas.component').then(m => m.PessoasComponent),
        data: { breadcrumb: 'Pessoas' },
      },
      {
        path: 'alterar-foto',
        loadComponent: () =>
          import('./presentation/pages/alterar-foto/alterar-foto.component').then(m => m.AlterarFotoComponent),
        data: { breadcrumb: 'Alterar Foto' },
      },
      {
        path: 'inicio-sistema',
        loadComponent: () =>
          import('./presentation/pages/inicio-sistema/inicio-sistema.component').then(m => m.InicioSistemaComponent),
        data: { breadcrumb: 'Início do Sistema' },
      },
      {
        path: 'convidados',
        loadComponent: () =>
          import('./presentation/pages/convidados/convidados.component').then(m => m.ConvidadosComponent),
        data: { breadcrumb: 'Convidados' },
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
