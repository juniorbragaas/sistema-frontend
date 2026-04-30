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
        data: { breadcrumbs: [
          { label: 'Home', url: '/home' },
        ]},
      },
      {
        path: 'tipo-despesas',
        loadComponent: () =>
          import('./presentation/pages/tipo-despesas/tipo-despesas.component').then(m => m.TipoDespesasComponent),
        data: { breadcrumbs: [
          { label: 'Home', url: '/home' },
          { label: 'Financeiro' },
          { label: 'Tipo de Despesas', url: '/tipo-despesas' },
        ]},
      },
      {
        path: 'pessoas',
        loadComponent: () =>
          import('./presentation/pages/pessoas/pessoas.component').then(m => m.PessoasComponent),
        data: { breadcrumbs: [
          { label: 'Home', url: '/home' },
          { label: 'Pessoas' },
          { label: 'Listar Pessoas', url: '/pessoas' },
        ]},
      },
      {
        path: 'alterar-foto',
        loadComponent: () =>
          import('./presentation/pages/alterar-foto/alterar-foto.component').then(m => m.AlterarFotoComponent),
        data: { breadcrumbs: [
          { label: 'Home', url: '/home' },
          { label: 'Pessoas' },
          { label: 'Alterar Foto', url: '/alterar-foto' },
        ]},
      },
      {
        path: 'inicio-sistema',
        loadComponent: () =>
          import('./presentation/pages/inicio-sistema/inicio-sistema.component').then(m => m.InicioSistemaComponent),
        data: { breadcrumbs: [
          { label: 'Home', url: '/home' },
          { label: 'Configurações' },
          { label: 'Início do Sistema', url: '/inicio-sistema' },
        ]},
      },
      {
        path: 'perfis',
        loadComponent: () =>
          import('./presentation/pages/perfis/perfis.component').then(m => m.PerfisComponent),
        data: { breadcrumbs: [
          { label: 'Home', url: '/home' },
          { label: 'Configurações' },
          { label: 'Perfis', url: '/perfis' },
        ]},
      },
      {
        path: 'mapeamento-menu',
        loadComponent: () =>
          import('./presentation/pages/mapeamento-menu/mapeamento-menu.component').then(m => m.MapeamentoMenuComponent),
        data: { breadcrumbs: [
          { label: 'Home', url: '/home' },
          { label: 'Configurações' },
          { label: 'Mapeamento de Menu', url: '/mapeamento-menu' },
        ]},
      },
      {
        path: 'convidados',
        loadComponent: () =>
          import('./presentation/pages/convidados/convidados.component').then(m => m.ConvidadosComponent),
        data: { breadcrumbs: [
          { label: 'Home', url: '/home' },
          { label: 'Pessoas' },
          { label: 'Convidados', url: '/convidados' },
        ]},
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
