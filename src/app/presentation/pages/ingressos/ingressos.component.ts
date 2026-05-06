import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  private listarUseCase    = inject(ListarIngressosUseCase);
  private criarUseCase     = inject(CriarIngressoUseCase);
  private atualizarUseCase = inject(AtualizarIngressoUseCase);
  private excluirUseCase   = inject(ExcluirIngressoUseCase);

  readonly statusOpcoes = [
    { valor: 2, label: 'Não utilizado' },
    { valor: 1, label: 'Utilizado' },
  ];

  ingressos    = signal<Ingresso[]>([]);
  loading      = signal(false);
  erro         = signal('');
  colunas      = signal<string[]>(['nomeEvento', 'dataInicio', 'dataFim', 'tipoIngresso', 'status', 'nomeComprador', 'cpfRg']);
  filtros      = signal<Record<string, string>>({});
  sortColuna   = signal('');
  sortDirecao  = signal<'asc' | 'desc'>('asc');
  paginaAtual  = signal(1);
  itensPorPagina = signal(10);

  // Modal
  modalAberto     = signal(false);
  modalAcao       = signal<ModalAcao>(null);
  itemSelecionado = signal<Ingresso | null>(null);
  formId             = signal<string | null>(null);
  formNomeEvento     = signal('');
  formDataInicio     = signal('');
  formDataFim        = signal('');
  formTipoIngresso   = signal('');
  formStatus         = signal<number>(2);
  formNomeComprador  = signal('');
  formDataNascimento = signal('');
  formCpfRg          = signal('');

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

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.loading.set(true);
    this.erro.set('');
    this.listarUseCase.execute().subscribe({
      next: (dados) => {
        this.ingressos.set(dados);
        this.loading.set(false);
      },
      error: () => {
        this.erro.set('Erro ao carregar dados.');
        this.loading.set(false);
      },
    });
  }

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

  // Converte datetime ISO para input datetime-local (yyyy-MM-ddTHH:mm)
  private toInputDatetime(valor: string): string {
    if (!valor) return '';
    try { return new Date(valor).toISOString().slice(0, 16); }
    catch { return valor; }
  }

  // Converte date ISO para input date (yyyy-MM-dd)
  private toInputDate(valor: string): string {
    if (!valor) return '';
    try { return new Date(valor).toISOString().slice(0, 10); }
    catch { return valor; }
  }

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

    if (!payload.nomeEvento) { this.erro.set('Nome do evento é obrigatório'); return; }
    if (!payload.nomeComprador) { this.erro.set('Nome do comprador é obrigatório'); return; }
    if (!payload.cpfRg) { this.erro.set('CPF/RG é obrigatório'); return; }

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
}
