import { Component, inject, signal, computed, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as QRCode from 'qrcode';
import { ListarIngressosUseCase } from '../../../core/usecases/listar-ingressos.usecase';
import { CriarIngressoUseCase } from '../../../core/usecases/criar-ingresso.usecase';
import { AtualizarIngressoUseCase } from '../../../core/usecases/atualizar-ingresso.usecase';
import { ExcluirIngressoUseCase } from '../../../core/usecases/excluir-ingresso.usecase';
import { Ingresso, STATUS_INGRESSO } from '../../../core/models/ingresso.model';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { CrudButtonsComponent } from '../../shared/crud-buttons/crud-buttons.component';
import { AppTableDirective } from '../../shared/app-table/app-table.directive';

type ModalAcao = 'inserir' | 'visualizar' | 'alterar' | 'excluir' | null;

const LABELS: Record<string, string> = {
  nomeEvento:    'Evento',
  dataInicio:    'Data Início',
  dataFim:       'Data Fim',
  tipoIngresso:  'Tipo',
  status:        'Status',
  nomeComprador: 'Comprador',
  cpfRg:         'CPF/RG',
};

@Component({
  selector: 'app-ingressos',
  standalone: true,
  imports: [FormsModule, PageTitleComponent, CrudButtonsComponent, AppTableDirective],
  templateUrl: './ingressos.component.html',
  styleUrl: './ingressos.component.css',
})
export class IngressosComponent implements OnInit {
  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;

  private listarUseCase    = inject(ListarIngressosUseCase);
  private criarUseCase     = inject(CriarIngressoUseCase);
  private atualizarUseCase = inject(AtualizarIngressoUseCase);
  private excluirUseCase   = inject(ExcluirIngressoUseCase);

  readonly statusOpcoes = [
    { valor: 2, label: 'Não utilizado' },
    { valor: 1, label: 'Utilizado' },
  ];

  ingressos      = signal<Ingresso[]>([]);
  loading        = signal(false);
  erro           = signal('');
  colunas        = signal<string[]>(['nomeEvento', 'dataInicio', 'dataFim', 'tipoIngresso', 'status', 'nomeComprador', 'cpfRg']);
  filtros        = signal<Record<string, string>>({});
  sortColuna     = signal('');
  sortDirecao    = signal<'asc' | 'desc'>('asc');
  paginaAtual    = signal(1);
  itensPorPagina = signal(10);

  // Modal CRUD
  modalAberto        = signal(false);
  modalAcao          = signal<ModalAcao>(null);
  itemSelecionado    = signal<Ingresso | null>(null);
  formId             = signal<string | null>(null);
  formNomeEvento     = signal('');
  formDataInicio     = signal('');
  formDataFim        = signal('');
  formTipoIngresso   = signal('');
  formStatus         = signal<number>(2);
  formNomeComprador  = signal('');
  formDataNascimento = signal('');
  formCpfRg          = signal('');

  // Modal QR Code
  modalQrAberto   = signal(false);
  ingressoQr      = signal<Ingresso | null>(null);
  qrDataUrl       = signal('');
  qrGerando       = signal(false);

  // ─── Computed ────────────────────────────────────────────────────────────────

  modalTitulo = computed(() => {
    switch (this.modalAcao()) {
      case 'inserir':    return 'Inserir Novo Ingresso';
      case 'visualizar': return 'Visualizar Ingresso';
      case 'alterar':    return 'Alterar Ingresso';
      case 'excluir':    return 'Excluir Ingresso';
      default:           return '';
    }
  });

  somenteLeitura = computed(() =>
    this.modalAcao() === 'visualizar' || this.modalAcao() === 'excluir'
  );

  dadosFiltrados = computed(() => {
    const dados = this.ingressos();
    const f = this.filtros();
    const col = this.sortColuna();
    const dir = this.sortDirecao();
    const filtrados = dados.filter(item =>
      Object.keys(f).every(c => {
        const filtro = f[c]?.toLowerCase() ?? '';
        if (!filtro) return true;
        const valor = String((item as any)[c] ?? '').toLowerCase();
        return valor.includes(filtro);
      })
    );
    if (!col) return filtrados;
    return [...filtrados].sort((a, b) => {
      const va = String((a as any)[col] ?? '').toLowerCase();
      const vb = String((b as any)[col] ?? '').toLowerCase();
      return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  });

  dadosPaginados = computed(() => {
    const filtrados = this.dadosFiltrados();
    const inicio = (this.paginaAtual() - 1) * this.itensPorPagina();
    return filtrados.slice(inicio, inicio + this.itensPorPagina());
  });

  totalPaginas = computed(() =>
    Math.ceil(this.dadosFiltrados().length / this.itensPorPagina()) || 1
  );

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.carregarDados();
  }

  // ─── Dados ───────────────────────────────────────────────────────────────────

  carregarDados(): void {
    this.loading.set(true);
    this.erro.set('');
    this.listarUseCase.execute().subscribe({
      next: (dados) => { this.ingressos.set(dados); this.loading.set(false); },
      error: () => { this.erro.set('Erro ao carregar dados.'); this.loading.set(false); },
    });
  }

  // ─── Formatação ──────────────────────────────────────────────────────────────

  labelColuna(col: string): string {
    return LABELS[col] ?? col;
  }

  getItemValue(item: Ingresso, col: string): string {
    if (col === 'status') return STATUS_INGRESSO[(item as any)[col]] ?? String((item as any)[col]);
    if (col === 'dataInicio' || col === 'dataFim') return this.formatarData((item as any)[col]);
    if (col === 'dataNascimento') return this.formatarDataSomente((item as any)[col]);
    return String((item as any)[col] ?? '');
  }

  formatarData(valor: string): string {
    if (!valor) return '';
    try { return new Date(valor).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return valor; }
  }

  formatarDataSomente(valor: string): string {
    if (!valor) return '';
    try { return new Date(valor).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch { return valor; }
  }

  private toInputDatetime(valor: string): string {
    if (!valor) return '';
    try { return new Date(valor).toISOString().slice(0, 16); }
    catch { return valor; }
  }

  private toInputDate(valor: string): string {
    if (!valor) return '';
    try { return new Date(valor).toISOString().slice(0, 10); }
    catch { return valor; }
  }

  // ─── Tabela ──────────────────────────────────────────────────────────────────

  onFiltroChange(coluna: string, valor: string): void {
    this.filtros.update(f => ({ ...f, [coluna]: valor }));
    this.paginaAtual.set(1);
  }

  ordenarPor(coluna: string): void {
    if (this.sortColuna() === coluna) {
      this.sortDirecao.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColuna.set(coluna);
      this.sortDirecao.set('asc');
    }
    this.paginaAtual.set(1);
  }

  iconeSort(coluna: string): string {
    if (this.sortColuna() !== coluna) return '↕';
    return this.sortDirecao() === 'asc' ? '▲' : '▼';
  }

  irParaPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) this.paginaAtual.set(pagina);
  }

  // ─── Modal CRUD ──────────────────────────────────────────────────────────────

  private preencherForm(item: Ingresso | null): void {
    this.formId.set(item?.id ?? null);
    this.formNomeEvento.set(item?.nomeEvento ?? '');
    this.formDataInicio.set(item ? this.toInputDatetime(item.dataInicio) : '');
    this.formDataFim.set(item ? this.toInputDatetime(item.dataFim) : '');
    this.formTipoIngresso.set(item?.tipoIngresso ?? '');
    this.formStatus.set(item?.status ?? 2);
    this.formNomeComprador.set(item?.nomeComprador ?? '');
    this.formDataNascimento.set(item ? this.toInputDate(item.dataNascimento) : '');
    this.formCpfRg.set(item?.cpfRg ?? '');
  }

  onInserir(): void {
    this.preencherForm(null);
    this.modalAcao.set('inserir');
    this.modalAberto.set(true);
  }

  onVisualizar(item: Ingresso): void {
    this.itemSelecionado.set(item);
    this.preencherForm(item);
    this.modalAcao.set('visualizar');
    this.modalAberto.set(true);
  }

  onAlterar(item: Ingresso): void {
    this.itemSelecionado.set(item);
    this.preencherForm(item);
    this.modalAcao.set('alterar');
    this.modalAberto.set(true);
  }

  onExcluir(item: Ingresso): void {
    this.itemSelecionado.set(item);
    this.preencherForm(item);
    this.modalAcao.set('excluir');
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    this.modalAberto.set(false);
    this.modalAcao.set(null);
    this.itemSelecionado.set(null);
  }

  confirmarModal(): void {
    const acao = this.modalAcao();
    const id   = this.formId();

    const payload: Partial<Ingresso> = {
      nomeEvento:     this.formNomeEvento().trim(),
      dataInicio:     this.formDataInicio(),
      dataFim:        this.formDataFim(),
      tipoIngresso:   this.formTipoIngresso().trim(),
      status:         this.formStatus(),
      nomeComprador:  this.formNomeComprador().trim(),
      dataNascimento: this.formDataNascimento(),
      cpfRg:          this.formCpfRg().trim(),
    };

    if (!payload.nomeEvento)    { this.erro.set('Nome do evento é obrigatório'); return; }
    if (!payload.nomeComprador) { this.erro.set('Nome do comprador é obrigatório'); return; }
    if (!payload.cpfRg)         { this.erro.set('CPF/RG é obrigatório'); return; }

    if (acao === 'inserir') {
      this.criarUseCase.execute(payload).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: () => this.erro.set('Erro ao criar ingresso.'),
      });
      return;
    }

    if (acao === 'alterar' && id) {
      this.atualizarUseCase.execute(id, { ...payload, id }).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: () => this.erro.set('Erro ao atualizar ingresso.'),
      });
      return;
    }

    if (acao === 'excluir' && id) {
      this.excluirUseCase.execute(id).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: () => this.erro.set('Erro ao excluir ingresso.'),
      });
    }
  }

  // ─── QR Code ─────────────────────────────────────────────────────────────────

  /** Monta o texto completo que será codificado no QR Code */
  private montarTextoQr(ingresso: Ingresso): string {
    const status = STATUS_INGRESSO[ingresso.status] ?? String(ingresso.status);
    return [
      `INGRESSO`,
      `ID: ${ingresso.id}`,
      `Evento: ${ingresso.nomeEvento}`,
      `Tipo: ${ingresso.tipoIngresso}`,
      `Início: ${this.formatarData(ingresso.dataInicio)}`,
      `Fim: ${this.formatarData(ingresso.dataFim)}`,
      `Status: ${status}`,
      `Comprador: ${ingresso.nomeComprador}`,
      `CPF/RG: ${ingresso.cpfRg}`,
      `Nascimento: ${this.formatarDataSomente(ingresso.dataNascimento)}`,
    ].join('\n');
  }

  async abrirQrCode(ingresso: Ingresso): Promise<void> {
    this.ingressoQr.set(ingresso);
    this.qrDataUrl.set('');
    this.qrGerando.set(true);
    this.modalQrAberto.set(true);

    try {
      const texto = this.montarTextoQr(ingresso);
      const dataUrl = await QRCode.toDataURL(texto, {
        width: 320,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
      this.qrDataUrl.set(dataUrl);
    } catch (err) {
      console.error('Erro ao gerar QR Code:', err);
      this.erro.set('Erro ao gerar QR Code.');
    } finally {
      this.qrGerando.set(false);
    }
  }

  fecharQrCode(): void {
    this.modalQrAberto.set(false);
    this.ingressoQr.set(null);
    this.qrDataUrl.set('');
  }

  baixarQrCode(): void {
    const dataUrl = this.qrDataUrl();
    const ingresso = this.ingressoQr();
    if (!dataUrl || !ingresso) return;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `ingresso-${ingresso.nomeEvento.replace(/\s+/g, '-').toLowerCase()}-${ingresso.id.slice(0, 8)}.png`;
    link.click();
  }

  imprimirQrCode(): void {
    const dataUrl = this.qrDataUrl();
    const ingresso = this.ingressoQr();
    if (!dataUrl || !ingresso) return;

    const status = STATUS_INGRESSO[ingresso.status] ?? String(ingresso.status);
    const janela = window.open('', '_blank', 'width=600,height=700');
    if (!janela) return;

    janela.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Ingresso — ${ingresso.nomeEvento}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 30px;
          }
          .ticket {
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            width: 420px;
            overflow: hidden;
          }
          .ticket-header {
            background: linear-gradient(135deg, #0d6efd, #0a58ca);
            color: #fff;
            padding: 20px 24px;
            text-align: center;
          }
          .ticket-header h1 { font-size: 1.4rem; font-weight: 700; letter-spacing: 1px; }
          .ticket-header p  { font-size: 0.85rem; opacity: 0.85; margin-top: 4px; }
          .ticket-body {
            padding: 20px 24px;
            display: flex;
            gap: 20px;
            align-items: flex-start;
          }
          .ticket-qr img { width: 160px; height: 160px; border: 2px solid #e0e0e0; border-radius: 8px; }
          .ticket-info { flex: 1; }
          .ticket-info .row { margin-bottom: 10px; }
          .ticket-info .label { font-size: 0.7rem; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
          .ticket-info .value { font-size: 0.9rem; color: #222; font-weight: 600; }
          .ticket-divider {
            border: none;
            border-top: 2px dashed #e0e0e0;
            margin: 0 24px;
          }
          .ticket-footer {
            padding: 14px 24px;
            text-align: center;
            font-size: 0.75rem;
            color: #aaa;
          }
          .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 0.78rem;
            font-weight: 600;
          }
          .badge-utilizado    { background: #d1e7dd; color: #0f5132; }
          .badge-nao-utilizado { background: #fff3cd; color: #664d03; }
          @media print {
            body { background: #fff; padding: 0; }
            .ticket { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="ticket-header">
            <h1>🎟️ ${ingresso.nomeEvento}</h1>
            <p>${ingresso.tipoIngresso}</p>
          </div>
          <div class="ticket-body">
            <div class="ticket-qr">
              <img src="${dataUrl}" alt="QR Code do Ingresso" />
            </div>
            <div class="ticket-info">
              <div class="row">
                <div class="label">Comprador</div>
                <div class="value">${ingresso.nomeComprador}</div>
              </div>
              <div class="row">
                <div class="label">CPF / RG</div>
                <div class="value">${ingresso.cpfRg}</div>
              </div>
              <div class="row">
                <div class="label">Nascimento</div>
                <div class="value">${this.formatarDataSomente(ingresso.dataNascimento)}</div>
              </div>
              <div class="row">
                <div class="label">Início</div>
                <div class="value">${this.formatarData(ingresso.dataInicio)}</div>
              </div>
              <div class="row">
                <div class="label">Fim</div>
                <div class="value">${this.formatarData(ingresso.dataFim)}</div>
              </div>
              <div class="row">
                <div class="label">Status</div>
                <div class="value">
                  <span class="badge ${ingresso.status === 1 ? 'badge-utilizado' : 'badge-nao-utilizado'}">${status}</span>
                </div>
              </div>
            </div>
          </div>
          <hr class="ticket-divider" />
          <div class="ticket-footer">
            ID: ${ingresso.id}<br/>
            Escaneie o QR Code para validar o ingresso
          </div>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `);
    janela.document.close();
  }
}
