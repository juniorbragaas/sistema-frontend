import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppConfigService } from '../../../core/services/app-config.service';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';

export interface TemaDatatable {
  nome: string;
  headerBg: string;
  headerText: string;
  filterBg: string;
  rowOddBg: string;
  rowEvenBg: string;
  rowHoverBg: string;
  rowText: string;
}

@Component({
  selector: 'app-inicio-sistema',
  standalone: true,
  imports: [FormsModule, PageTitleComponent],
  templateUrl: './inicio-sistema.component.html',
  styleUrl: './inicio-sistema.component.css',
})
export class InicioSistemaComponent {
  cfg = inject(AppConfigService);

  nome = signal(this.cfg.appName());
  iconPreview = signal(this.cfg.appIcon());
  loginBgPreview = signal(this.cfg.loginBgImage());
  barColor = signal(this.cfg.barColor());
  barTextColor = signal(this.cfg.barTextColor());
  pageTitleBgColor = signal(this.cfg.pageTitleBgColor());
  pageTitleTextColor = signal(this.cfg.pageTitleTextColor());
  sidebarBgColor = signal(this.cfg.sidebarBgColor());
  sidebarTextColor = signal(this.cfg.sidebarTextColor());
  btnInserirBg = signal(this.cfg.btnInserirBg());
  btnInserirText = signal(this.cfg.btnInserirText());
  btnVisualizarBg = signal(this.cfg.btnVisualizarBg());
  btnVisualizarText = signal(this.cfg.btnVisualizarText());
  btnAlterarBg = signal(this.cfg.btnAlterarBg());
  btnAlterarText = signal(this.cfg.btnAlterarText());
  btnExcluirBg = signal(this.cfg.btnExcluirBg());
  btnExcluirText = signal(this.cfg.btnExcluirText());
  btnSalvarBg = signal(this.cfg.btnSalvarBg());
  btnSalvarText = signal(this.cfg.btnSalvarText());
  btnCancelarBg = signal(this.cfg.btnCancelarBg());
  btnCancelarText = signal(this.cfg.btnCancelarText());
  btnSimBg = signal(this.cfg.btnSimBg());
  btnSimText = signal(this.cfg.btnSimText());
  btnNaoBg = signal(this.cfg.btnNaoBg());
  btnNaoText = signal(this.cfg.btnNaoText());

  // Datatable
  tableHeaderBg   = signal(this.cfg.tableHeaderBg());
  tableHeaderText = signal(this.cfg.tableHeaderText());
  tableFilterBg   = signal(this.cfg.tableFilterBg());
  tableRowOddBg   = signal(this.cfg.tableRowOddBg());
  tableRowEvenBg  = signal(this.cfg.tableRowEvenBg());
  tableRowHoverBg = signal(this.cfg.tableRowHoverBg());
  tableRowText    = signal(this.cfg.tableRowText());

  salvo = signal(false);

  readonly temasDatatable: TemaDatatable[] = [
    {
      nome: '🔵 Azul',
      headerBg: '#4472c4', headerText: '#ffffff',
      filterBg: '#d9e2f3',
      rowOddBg: '#ffffff', rowEvenBg: '#eef2fa',
      rowHoverBg: '#b4c6e7', rowText: '#212529',
    },
    {
      nome: '🟢 Verde',
      headerBg: '#217346', headerText: '#ffffff',
      filterBg: '#d6ecd2',
      rowOddBg: '#ffffff', rowEvenBg: '#eaf5e8',
      rowHoverBg: '#b7ddb0', rowText: '#1a2e1a',
    },
    {
      nome: '⚫ Escuro',
      headerBg: '#212529', headerText: '#ffffff',
      filterBg: '#343a40',
      rowOddBg: '#2b3035', rowEvenBg: '#1e2226',
      rowHoverBg: '#495057', rowText: '#f8f9fa',
    },
    {
      nome: '🟠 Laranja',
      headerBg: '#fd7e14', headerText: '#ffffff',
      filterBg: '#ffe5cc',
      rowOddBg: '#ffffff', rowEvenBg: '#fff3e6',
      rowHoverBg: '#ffd0a0', rowText: '#3d1f00',
    },
    {
      nome: '⚪ Cinza',
      headerBg: '#6c757d', headerText: '#ffffff',
      filterBg: '#e9ecef',
      rowOddBg: '#ffffff', rowEvenBg: '#f8f9fa',
      rowHoverBg: '#dee2e6', rowText: '#212529',
    },
    {
      nome: '🟣 Roxo',
      headerBg: '#6f42c1', headerText: '#ffffff',
      filterBg: '#e8dff5',
      rowOddBg: '#ffffff', rowEvenBg: '#f3eeff',
      rowHoverBg: '#d0b8f0', rowText: '#1a0a3d',
    },
  ];

  aplicarTemaDatatable(tema: TemaDatatable): void {
    this.tableHeaderBg.set(tema.headerBg);
    this.tableHeaderText.set(tema.headerText);
    this.tableFilterBg.set(tema.filterBg);
    this.tableRowOddBg.set(tema.rowOddBg);
    this.tableRowEvenBg.set(tema.rowEvenBg);
    this.tableRowHoverBg.set(tema.rowHoverBg);
    this.tableRowText.set(tema.rowText);
  }

  onIconChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const reader = new FileReader();
    reader.onload = () => this.iconPreview.set(reader.result as string);
    reader.readAsDataURL(input.files[0]);
  }

  onLoginBgChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const reader = new FileReader();
    reader.onload = () => this.loginBgPreview.set(reader.result as string);
    reader.readAsDataURL(input.files[0]);
  }

  removerLoginBg(): void {
    this.loginBgPreview.set('');
  }

  salvar(): void {
    this.cfg.update({
      appName: this.nome(), appIcon: this.iconPreview(),
      loginBgImage: this.loginBgPreview(),
      barColor: this.barColor(), barTextColor: this.barTextColor(),
      pageTitleBgColor: this.pageTitleBgColor(), pageTitleTextColor: this.pageTitleTextColor(),
      sidebarBgColor: this.sidebarBgColor(), sidebarTextColor: this.sidebarTextColor(),
      btnInserirBg: this.btnInserirBg(), btnInserirText: this.btnInserirText(),
      btnVisualizarBg: this.btnVisualizarBg(), btnVisualizarText: this.btnVisualizarText(),
      btnAlterarBg: this.btnAlterarBg(), btnAlterarText: this.btnAlterarText(),
      btnExcluirBg: this.btnExcluirBg(), btnExcluirText: this.btnExcluirText(),
      btnSalvarBg: this.btnSalvarBg(), btnSalvarText: this.btnSalvarText(),
      btnCancelarBg: this.btnCancelarBg(), btnCancelarText: this.btnCancelarText(),
      btnSimBg: this.btnSimBg(), btnSimText: this.btnSimText(),
      btnNaoBg: this.btnNaoBg(), btnNaoText: this.btnNaoText(),
      tableHeaderBg: this.tableHeaderBg(), tableHeaderText: this.tableHeaderText(),
      tableFilterBg: this.tableFilterBg(),
      tableRowOddBg: this.tableRowOddBg(), tableRowEvenBg: this.tableRowEvenBg(),
      tableRowHoverBg: this.tableRowHoverBg(), tableRowText: this.tableRowText(),
    });
    this.salvo.set(true);
    setTimeout(() => this.salvo.set(false), 3000);
  }
}
