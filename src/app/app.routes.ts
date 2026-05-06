import { Routes } from '@angular/router';
import { authGuard } from './infra/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./presentation/pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'fila-atendimento',
    loadComponent: () =>
      import('./presentation/pages/fila-atendimento/fila-atendimento.component').then(m => m.FilaAtendimentoComponent),
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
        path: 'tipo-gastos',
        loadComponent: () =>
          import('./presentation/pages/tipo-gastos/tipo-gastos.component').then(m => m.TipoGastosComponent),
        data: { breadcrumbs: [
          { label: 'Home', url: '/home' },
          { label: 'Financeiro' },
          { label: 'Tipo de Gastos', url: '/tipo-gastos' },
        ]},
      },
      {
        path: 'controle-custos',
        loadComponent: () =>
          import('./presentation/pages/controle-custos/controle-custos.component').then(m => m.ControleCustosComponent),
        data: { breadcrumbs: [
          { label: 'Home', url: '/home' },
          { label: 'Financeiro' },
          { label: 'Controle de Custos', url: '/controle-custos' },
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
        path: 'usuarios',
        loadComponent: () =>
          import('./presentation/pages/usuarios/usuarios.component').then(m => m.UsuariosComponent),
        data: { breadcrumbs: [
          { label: 'Home', url: '/home' },
          { label: 'Configurações' },
          { label: 'Usuários', url: '/usuarios' },
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
        path: 'agendamento',
        loadComponent: () =>
          import('./presentation/pages/agendamento/agendamento.component').then(m => m.AgendamentoComponent),
        data: { breadcrumbs: [
          { label: 'Home', url: '/home' },
          { label: 'Reservas' },
          { label: 'Agendamento', url: '/agendamento' },
        ]},
      },
      {
        path: 'ingressos',
        loadComponent: () =>
          import('./presentation/pages/ingressos/ingressos.component').then(m => m.IngressosComponent),
        data: { breadcrumbs: [
          { label: 'Home', url: '/home' },
          { label: 'Reservas' },
          { label: 'Ingressos', url: '/ingressos' },
        ]},
      },
      {
        path: 'atendimento-planejado',
        loadComponent: () =>
          import('./presentation/pages/atendimento-planejado/atendimento-planejado.component').then(m => m.AtendimentoPlanejadoComponent),
        data: { breadcrumbs: [
          { label: 'Home', url: '/home' },
          { label: 'Atendimento' },
          { label: 'Atendimento Planejado', url: '/atendimento-planejado' },
        ]},
      },
      {
        path: 'tipo-veiculos',
        loadComponent: () =>
          import('./presentation/pages/tipo-veiculos/tipo-veiculos.component').then(m => m.TipoVeiculosComponent),
        data: { breadcrumbs: [
          { label: 'Home', url: '/home' },
          { label: 'Estacionamento' },
          { label: 'Tipo de Veículos', url: '/tipo-veiculos' },
        ]},
      },
      {
        path: 'cadastro-veiculos',
        loadComponent: () =>
          import('./presentation/pages/cadastro-veiculos/cadastro-veiculos.component').then(m => m.CadastroVeiculosComponent),
        data: { breadcrumbs: [
          { label: 'Home', url: '/home' },
          { label: 'Estacionamento' },
          { label: 'Cadastro de Veículos', url: '/cadastro-veiculos' },
        ]},
      },
      {
        path: 'logs',
        loadComponent: () =>
          import('./presentation/pages/logs/logs.component').then(m => m.LogsComponent),
        data: { breadcrumbs: [
          { label: 'Home', url: '/home' },
          { label: 'Relatórios' },
          { label: 'Logs', url: '/logs' },
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
