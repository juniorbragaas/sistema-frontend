import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListarReservasUseCase }   from '../../../core/usecases/listar-reservas.usecase';
import { CriarReservaUseCase }     from '../../../core/usecases/criar-reserva.usecase';
import { AtualizarReservaUseCase } from '../../../core/usecases/atualizar-reserva.usecase';
import { ExcluirReservaUseCase }   from '../../../core/usecases/excluir-reserva.usecase';
import { ListarPessoasUseCase }    from '../../../core/usecases/listar-pessoas.usecase';
import { Reserva }                 from '../../../core/models/reserva.model';
import { PessoaApi }               from '../../../core/models/pessoa-api.model';
import { AppConfigService }        from '../../../core/services/app-config.service';
import { PageTitleComponent }      from '../../shared/page-title/page-title.component';
import { CrudButtonsComponent }    from '../../shared/crud-buttons/crud-buttons.component';

type ModalAcao = 'inserir' | 'visualizar' | 'alterar' | 'excluir' | null;

interface DiaCalendario {
  data: Date;
  diaAtual: boolean;
  mesAtual: boolean;
  selecionado: boolean;
  temReserva: boolean;
  qtdReservas: number;
}

@Component({
  selector: 'app-agendamento',
  standalone: true,
  imports: [FormsModule, PageTitleComponent, CrudButtonsComponent],
  templateUrl: './agendamento.component.html',
  styleUrl: './agendamento.component.css',
})
export class AgendamentoComponent implements OnInit {
  private listarUseCase    = inject(ListarReservasUseCase);
  private criarUseCase     = inject(CriarReservaUseCase);
  private atualizarUseCase = inject(AtualizarReservaUseCase);
  private excluirUseCase   = inject(ExcluirReservaUseCase);
  private listarPessoasUseCase = inject(ListarPessoasUseCase);
  cfg = inject(AppConfigService);

  // ── Dados ──────────────────────────────────────────────────────────────────
  reservas  = signal<Reserva[]>([]);
  pessoas   = signal<PessoaApi[]>([]);
  loading   = signal(false);
  erro      = signal('');

  // ── Calendário ─────────────────────────────────────────────────────────────
  hoje         = new Date();
  mesAtual     = signal(new Date(this.hoje.getFullYear(), this.hoje.getMonth(), 1));
  diaSelecionado = signal<Date | null>(null);

  readonly DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  readonly MESES = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
  ];

  tituloMes = computed(() => {
    const m = this.mesAtual();
    return `${this.MESES[m.getMonth()]} ${m.getFullYear()}`;
  });

  diasCalendario = computed<DiaCalendario[]>(() => {
    const mes = this.mesAtual();
    const sel = this.diaSelecionado();
    const reservas = this.reservas();

    const primeiroDia = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const ultimoDia   = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);

    // Preenche dias anteriores ao mês (para alinhar na semana)
    const dias: DiaCalendario[] = [];
    const inicioSemana = primeiroDia.getDay(); // 0=Dom

    for (let i = inicioSemana - 1; i >= 0; i--) {
      const d = new Date(primeiroDia);
      d.setDate(d.getDate() - i - 1);
      dias.push(this.criarDia(d, false, sel, reservas));
    }

    // Dias do mês atual
    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      const data = new Date(mes.getFullYear(), mes.getMonth(), d);
      dias.push(this.criarDia(data, true, sel, reservas));
    }

    // Completa até 42 células (6 semanas)
    while (dias.length < 42) {
      const ultimo = dias[dias.length - 1].data;
      const prox = new Date(ultimo);
      prox.setDate(prox.getDate() + 1);
      dias.push(this.criarDia(prox, false, sel, reservas));
    }

    return dias;
  });

  private criarDia(data: Date, mesAtual: boolean, sel: Date | null, reservas: Reserva[]): DiaCalendario {
    const iso = this.toIsoDate(data);
    const qtd = reservas.filter(r => r.data?.substring(0, 10) === iso).length;
    return {
      data,
      mesAtual,
      diaAtual: this.toIsoDate(data) === this.toIsoDate(this.hoje),
      selecionado: sel ? this.toIsoDate(data) === this.toIsoDate(sel) : false,
      temReserva: qtd > 0,
      qtdReservas: qtd,
    };
  }

  // ── Tabela filtrada pelo dia selecionado ───────────────────────────────────
  colunas    = ['id', 'responsavel', 'data', 'horaInicio', 'horaFinal', 'valor', 'descricao'];
  sortColuna  = signal('');
  sortDirecao = signal<'asc' | 'desc'>('asc');
  filtros     = signal<Record<string, string>>({});
  paginaAtual = signal(1);
  itensPorPagina = signal(10);

  reservasDoDia = computed(() => {
    const sel = this.diaSelecionado();
    if (!sel) return this.reservas();
    const iso = this.toIsoDate(sel);
    return this.reservas().filter(r => r.data?.substring(0, 10) === iso);
  });

  dadosFiltrados = computed(() => {
    const dados = this.reservasDoDia();
    const f = this.filtros();
    const col = this.sortColuna();
    const dir = this.sortDirecao();
    const filtrados = dados.filter(item =>
      Object.keys(f).every(c => {
        const filtro = f[c]?.toLowerCase() ?? '';
        if (!filtro) return true;
        return String(item[c] ?? '').toLowerCase().includes(filtro);
      })
    );
    if (!col) return filtrados;
    return [...filtrados].sort((a, b) => {
      const va = String(a[col] ?? '').toLowerCase();
      const vb = String(b[col] ?? '').toLowerCase();
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

  // ── Modal ──────────────────────────────────────────────────────────────────
  modalAberto     = signal(false);
  modalAcao       = signal<ModalAcao>(null);
  itemSelecionado = signal<Reserva | null>(null);
  formId          = signal<number | null>(null);
  formResponsavel = signal('');   // nome salvo no banco
  formPessoaId    = signal('');   // id da pessoa selecionada no select
  formData        = signal('');
  formValor       = signal('');
  formHoraInicio  = signal('');
  formHoraFinal   = signal('');
  formDescricao   = signal('');

  modalTitulo = computed(() => {
    switch (this.modalAcao()) {
      case 'inserir':    return 'Nova Reserva';
      case 'visualizar': return 'Visualizar Reserva';
      case 'alterar':    return 'Alterar Reserva';
      case 'excluir':    return 'Excluir Reserva';
      default:           return '';
    }
  });

  somenteLeitura = computed(() =>
    this.modalAcao() === 'visualizar' || this.modalAcao() === 'excluir'
  );

  // ── Ciclo de vida ──────────────────────────────────────────────────────────
  ngOnInit(): void { this.carregarDados(); }

  carregarDados(): void {
    this.loading.set(true);
    this.erro.set('');
    // Carrega pessoas e reservas em paralelo
    this.listarPessoasUseCase.execute().subscribe({
      next: (pessoas) => this.pessoas.set(pessoas),
    });
    this.listarUseCase.execute().subscribe({
      next: (dados) => { this.reservas.set(dados); this.loading.set(false); },
      error: () => { this.erro.set('Erro ao carregar reservas.'); this.loading.set(false); },
    });
  }

  // ── Calendário ─────────────────────────────────────────────────────────────
  mesAnterior(): void {
    const m = this.mesAtual();
    this.mesAtual.set(new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  proximoMes(): void {
    const m = this.mesAtual();
    this.mesAtual.set(new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  selecionarDia(dia: DiaCalendario): void {
    const sel = this.diaSelecionado();
    // Clique no mesmo dia desmarca
    if (sel && this.toIsoDate(dia.data) === this.toIsoDate(sel)) {
      this.diaSelecionado.set(null);
    } else {
      this.diaSelecionado.set(dia.data);
    }
    this.paginaAtual.set(1);
  }

  labelDiaSelecionado(): string {
    const sel = this.diaSelecionado();
    if (!sel) return 'Todas as reservas';
    return `Reservas de ${sel.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}`;
  }

  // ── Tabela ─────────────────────────────────────────────────────────────────
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

  // ── Modal ──────────────────────────────────────────────────────────────────
  private preencherForm(item: Reserva | null): void {
    this.formId.set(item?.id ?? null);
    this.formResponsavel.set(item?.responsavel ?? '');
    // Tenta encontrar a pessoa pelo nome para pré-selecionar o dropdown
    const pessoaEncontrada = this.pessoas().find(
      p => p.nomeCompleto === item?.responsavel
    );
    this.formPessoaId.set(pessoaEncontrada?.id ?? '');
    this.formData.set(item?.data?.substring(0, 10) ?? this.toIsoDate(this.diaSelecionado() ?? this.hoje));
    this.formValor.set(item?.valor?.toString() ?? '');
    this.formHoraInicio.set(item?.horaInicio?.substring(0, 5) ?? '');
    this.formHoraFinal.set(item?.horaFinal?.substring(0, 5) ?? '');
    this.formDescricao.set(item?.descricao ?? '');
  }

  /** Retorna o nome completo da pessoa pelo id */
  nomePessoa(id: string): string {
    return this.pessoas().find(p => p.id === id)?.nomeCompleto ?? id;
  }

  /** Ao selecionar uma pessoa no dropdown, atualiza também o responsavel */
  onPessoaChange(pessoaId: string): void {
    this.formPessoaId.set(pessoaId);
    const pessoa = this.pessoas().find(p => p.id === pessoaId);
    this.formResponsavel.set(pessoa?.nomeCompleto ?? '');
  }

  onInserir(): void {
    this.itemSelecionado.set(null);
    this.preencherForm(null);
    this.modalAcao.set('inserir');
    this.modalAberto.set(true);
  }

  onVisualizar(item: Reserva): void {
    this.itemSelecionado.set(item);
    this.preencherForm(item);
    this.modalAcao.set('visualizar');
    this.modalAberto.set(true);
  }

  onAlterar(item: Reserva): void {
    this.itemSelecionado.set(item);
    this.preencherForm(item);
    this.modalAcao.set('alterar');
    this.modalAberto.set(true);
  }

  onExcluir(item: Reserva): void {
    this.itemSelecionado.set(item);
    this.preencherForm(item);
    this.modalAcao.set('excluir');
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    this.modalAberto.set(false);
    this.modalAcao.set(null);
    this.itemSelecionado.set(null);
    this.erro.set('');
  }

  confirmarModal(): void {
    const acao = this.modalAcao();
    const id   = this.formId();

    const body: Partial<Reserva> = {
      responsavel: this.formResponsavel().trim(),
      data:        this.formData(),
      valor:       parseFloat(this.formValor()) || 0,
      horaInicio:  this.formHoraInicio() + ':00',
      horaFinal:   this.formHoraFinal() + ':00',
      descricao:   this.formDescricao().trim() || null,
    };

    if (acao === 'inserir') {
      this.criarUseCase.execute(body).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: (err) => {
          console.error('POST /api/Reservas falhou', err);
          this.erro.set('Erro ao criar reserva. Verifique os dados.');
        },
      });
      return;
    }

    if (acao === 'alterar' && id !== null) {
      this.atualizarUseCase.execute(id, { ...body, id }).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: (err) => {
          console.error(`PUT /api/Reservas/${id} falhou`, err);
          this.erro.set('Erro ao atualizar reserva. Verifique os dados.');
        },
      });
      return;
    }

    if (acao === 'excluir' && id !== null) {
      this.excluirUseCase.execute(id).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: (err) => {
          console.error(`DELETE /api/Reservas/${id} falhou`, err);
          this.erro.set('Erro ao excluir reserva.');
        },
      });
    }
  }

  // ── Utilitários ────────────────────────────────────────────────────────────
  toIsoDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  formatarData(iso: string): string {
    if (!iso) return '';
    const [y, m, d] = iso.substring(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }

  formatarHora(h: string): string {
    return h?.substring(0, 5) ?? '';
  }

  formatarValor(v: number): string {
    return v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '';
  }

  formatarCelula(item: Reserva, col: string): string {
    switch (col) {
      case 'data':       return this.formatarData(item.data);
      case 'horaInicio': return this.formatarHora(item.horaInicio);
      case 'horaFinal':  return this.formatarHora(item.horaFinal);
      case 'valor':      return this.formatarValor(item.valor);
      default:           return String(item[col] ?? '');
    }
  }
}
