import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { ListarControleCustosUseCase }  from '../../../core/usecases/listar-controle-custos.usecase';
import { CriarControleCustosUseCase }    from '../../../core/usecases/criar-controle-custos.usecase';
import { AtualizarControleCustosUseCase } from '../../../core/usecases/atualizar-controle-custos.usecase';
import { ExcluirControleCustosUseCase }  from '../../../core/usecases/excluir-controle-custos.usecase';
import { ListarDespesasUseCase }         from '../../../core/usecases/listar-despesas.usecase';
import { ListarTipoGastosUseCase }       from '../../../core/usecases/listar-tipo-gastos.usecase';
import { ControleCustos }                from '../../../core/models/controle-custos.model';
import { Despesa }                       from '../../../core/models/despesa.model';
import { TipoGasto }                     from '../../../core/models/tipo-gasto.model';
import { AppConfigService }         from '../../../core/services/app-config.service';
import { PageTitleComponent }       from '../../shared/page-title/page-title.component';
import { CrudButtonsComponent }     from '../../shared/crud-buttons/crud-buttons.component';
import { AppTableDirective } from '../../shared/app-table/app-table.directive';

type ModalAcao = 'inserir' | 'visualizar' | 'alterar' | 'excluir' | null;

@Component({
  selector: 'app-controle-custos',
  standalone: true,
  imports: [FormsModule, PageTitleComponent, CrudButtonsComponent, AppTableDirective],
  templateUrl: './controle-custos.component.html',
  styleUrl: './controle-custos.component.css',
})
export class ControleCustosComponent implements OnInit {
  private listarUseCase   = inject(ListarControleCustosUseCase);
  private criarUseCase    = inject(CriarControleCustosUseCase);
  private atualizarUseCase = inject(AtualizarControleCustosUseCase);
  private excluirUseCase  = inject(ExcluirControleCustosUseCase);
  private listarDespesasUseCase = inject(ListarDespesasUseCase);
  private listarTipoGastosUseCase = inject(ListarTipoGastosUseCase);
  cfg = inject(AppConfigService);

  despesas = signal<Despesa[]>([]);
  tipoGastos = signal<TipoGasto[]>([]);

  controleCustos   = signal<ControleCustos[]>([]);
  loading      = signal(false);
  erro         = signal('');
  colunas      = signal<string[]>(['id', 'nome', 'valor', 'dataVencimentoDia', 'dataVencimentoMes', 'dataVencimentoAno', 'dataPagamentoDia', 'dataPagamentoMes', 'dataPagamentoAno', 'valorPagamento', 'statusAtraso', 'jurosPorAtraso', 'statusPagamento', 'tipoDespesaId', 'tipoGastoId', 'tipoLancamento']);
  filtros      = signal<Record<string, string>>({});
  sortColuna   = signal('');
  sortDirecao  = signal<'asc' | 'desc'>('asc');
  paginaAtual  = signal(1);
  itensPorPagina = signal(10);

  // Modal
  modalAberto     = signal(false);
  modalAcao       = signal<ModalAcao>(null);
  itemSelecionado = signal<ControleCustos | null>(null);
  formId   = signal<number | null>(null);
  formNome = signal('');
  formValor = signal('');
  formDataVencimento = signal('');
  formDataPagamento = signal('');
  formValorPagamento = signal('');
  formStatusAtraso = signal(false);
  formJurosPorAtraso = signal('');
  formTipoDespesaId = signal<number | null>(null);
  formTipoGastoId = signal<number | null>(null);
  formTipoLancamento = signal<number | null>(null);

  modalTitulo = computed(() => {
    switch (this.modalAcao()) {
      case 'inserir':    return 'Inserir Novo Controle de Custos';
      case 'visualizar': return 'Visualizar Controle de Custos';
      case 'alterar':    return 'Alterar Controle de Custos';
      case 'excluir':    return 'Excluir Controle de Custos';
      default:           return '';
    }
  });

  somenteLeitura = computed(() =>
    this.modalAcao() === 'visualizar' || this.modalAcao() === 'excluir'
  );

  dadosFiltrados = computed(() => {
    const dados = this.controleCustos();
    const f = this.filtros();
    const col = this.sortColuna();
    const dir = this.sortDirecao();
    
    const filtrados = dados.filter(item =>
      Object.keys(f).every(c => {
        const filtro = (f[c] ?? '').toLowerCase();
        if (!filtro) return true;
        
        let valor = '';
        if (c === 'tipoDespesaId') {
          valor = item.tipoDespesa?.nome || String(item[c]);
        } else if (c === 'tipoGastoId') {
          valor = item.tipoGasto?.nome || String(item[c]);
        } else if (c === 'tipoLancamento') {
          valor = this.obterNomeTipoLancamento(item[c]);
        } else if (c === 'dataVencimentoDia' || c === 'dataVencimentoMes' || c === 'dataVencimentoAno') {
          if (c === 'dataVencimentoDia') valor = this.obterDia(item.dataVencimento);
          else if (c === 'dataVencimentoMes') valor = this.obterMes(item.dataVencimento);
          else if (c === 'dataVencimentoAno') valor = this.obterAno(item.dataVencimento);
        } else if (c === 'dataPagamentoDia' || c === 'dataPagamentoMes' || c === 'dataPagamentoAno') {
          if (c === 'dataPagamentoDia') valor = this.obterDia(item.dataPagamento);
          else if (c === 'dataPagamentoMes') valor = this.obterMes(item.dataPagamento);
          else if (c === 'dataPagamentoAno') valor = this.obterAno(item.dataPagamento);
        } else if (c === 'statusAtraso') {
          valor = item[c] ? 'Sim' : 'Não';
        } else {
          valor = String(item[c] || '');
        }
        
        return valor.toLowerCase().includes(filtro);
      })
    );
    
    if (!col) return filtrados;
    
    return [...filtrados].sort((a, b) => {
      let va = '';
      let vb = '';
      
      if (col === 'tipoDespesaId') {
        va = a.tipoDespesa?.nome || String(a[col]);
        vb = b.tipoDespesa?.nome || String(b[col]);
      } else if (col === 'tipoGastoId') {
        va = a.tipoGasto?.nome || String(a[col]);
        vb = b.tipoGasto?.nome || String(b[col]);
      } else if (col === 'tipoLancamento') {
        va = this.obterNomeTipoLancamento(a[col]);
        vb = this.obterNomeTipoLancamento(b[col]);
      } else if (col === 'dataVencimentoDia' || col === 'dataVencimentoMes' || col === 'dataVencimentoAno') {
        if (col === 'dataVencimentoDia') {
          va = this.obterDia(a.dataVencimento);
          vb = this.obterDia(b.dataVencimento);
        } else if (col === 'dataVencimentoMes') {
          va = this.obterMes(a.dataVencimento);
          vb = this.obterMes(b.dataVencimento);
        } else if (col === 'dataVencimentoAno') {
          va = this.obterAno(a.dataVencimento);
          vb = this.obterAno(b.dataVencimento);
        }
      } else if (col === 'dataPagamentoDia' || col === 'dataPagamentoMes' || col === 'dataPagamentoAno') {
        if (col === 'dataPagamentoDia') {
          va = this.obterDia(a.dataPagamento);
          vb = this.obterDia(b.dataPagamento);
        } else if (col === 'dataPagamentoMes') {
          va = this.obterMes(a.dataPagamento);
          vb = this.obterMes(b.dataPagamento);
        } else if (col === 'dataPagamentoAno') {
          va = this.obterAno(a.dataPagamento);
          vb = this.obterAno(b.dataPagamento);
        }
      } else if (col === 'statusAtraso') {
        va = a[col] ? 'Sim' : 'Não';
        vb = b[col] ? 'Sim' : 'Não';
      } else {
        va = String(a[col] || '').toLowerCase();
        vb = String(b[col] || '').toLowerCase();
      }
      
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
    this.carregarDespesas();
    this.carregarTipoGastos();
    this.carregarDados();
  }

  carregarDespesas(): void {
    this.listarDespesasUseCase.execute().subscribe({
      next: (dados) => this.despesas.set(dados),
      error: () => this.erro.set('Erro ao carregar despesas.'),
    });
  }

  carregarTipoGastos(): void {
    this.listarTipoGastosUseCase.execute().subscribe({
      next: (dados) => this.tipoGastos.set(dados),
      error: () => this.erro.set('Erro ao carregar tipos de gastos.'),
    });
  }

  carregarDados(): void {
    this.loading.set(true);
    this.erro.set('');
    this.listarUseCase.execute().subscribe({
      next: (dados) => { this.controleCustos.set(dados); this.loading.set(false); },
      error: () => { this.erro.set('Erro ao carregar dados.'); this.loading.set(false); },
    });
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

  onInserir(): void {
    this.itemSelecionado.set(null);
    this.formId.set(null);
    this.formNome.set('');
    this.formValor.set('');
    this.formDataVencimento.set('');
    this.formDataPagamento.set('');
    this.formValorPagamento.set('');
    this.formStatusAtraso.set(false);
    this.formJurosPorAtraso.set('');
    this.formTipoDespesaId.set(null);
    this.formTipoGastoId.set(null);
    this.formTipoLancamento.set(null);
    this.modalAcao.set('inserir');
    this.modalAberto.set(true);
  }

  formatarDataParaInput(data?: string): string {
    if (!data) return '';
    // Se a data vem no formato ISO (2026-05-04T00:00:00), extrai apenas a parte da data
    return data.split('T')[0];
  }

  obterNomeTipoLancamento(valor: number): string {
    const mapa: Record<number, string> = {
      1: 'ENTRADA',
      2: 'SAÍDA',
    };
    return mapa[valor] || String(valor);
  }

  obterDia(data?: string): string {
    if (!data) return '-';
    return data.split('-')[2]?.split('T')[0] || '-';
  }

  obterMes(data?: string): string {
    if (!data) return '-';
    return data.split('-')[1] || '-';
  }

  obterAno(data?: string): string {
    if (!data) return '-';
    return data.split('-')[0] || '-';
  }

  obterNomeColuna(col: string): string {
    const mapa: Record<string, string> = {
      'id': 'ID',
      'nome': 'Nome',
      'valor': 'Valor',
      'dataVencimentoDia': 'Vencimento (Dia)',
      'dataVencimentoMes': 'Vencimento (Mês)',
      'dataVencimentoAno': 'Vencimento (Ano)',
      'dataPagamentoDia': 'Pagamento (Dia)',
      'dataPagamentoMes': 'Pagamento (Mês)',
      'dataPagamentoAno': 'Pagamento (Ano)',
      'valorPagamento': 'Valor Pagamento',
      'statusAtraso': 'Status Atraso',
      'jurosPorAtraso': 'Juros por Atraso',
      'statusPagamento': 'Status Pagamento',
      'tipoDespesaId': 'Tipo Despesa',
      'tipoGastoId': 'Tipo Gasto',
      'tipoLancamento': 'Tipo Lançamento',
    };
    return mapa[col] || col;
  }

  obterIdDespesaPorNome(nome: string): string {
    const despesa = this.despesas().find(d => d.nome === nome);
    return despesa ? String(despesa.id) : '';
  }

  obterIdTipoGastoPorNome(nome: string): string {
    const tipoGasto = this.tipoGastos().find(tg => tg.nome === nome);
    return tipoGasto ? String(tipoGasto.id) : '';
  }

  obterNomeDespesa(id: number): string {
    const despesa = this.despesas().find(d => d.id === id);
    return despesa ? despesa.nome : String(id);
  }

  obterNomeTipoGasto(id: number): string {
    const tipoGasto = this.tipoGastos().find(tg => tg.id === id);
    return tipoGasto ? tipoGasto.nome : String(id);
  }

  formatarMoeda(valor?: number): string {
    if (valor === undefined || valor === null) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }

  calcularTotalEntrada(): number {
    return this.dadosFiltrados()
      .filter(item => item.tipoLancamento === 1)
      .reduce((sum, item) => sum + (item.valorPagamento || 0), 0);
  }

  calcularTotalSaida(): number {
    return this.dadosFiltrados()
      .filter(item => item.tipoLancamento === 2)
      .reduce((sum, item) => sum + (item.valorPagamento || 0), 0);
  }

  exportarParaExcel(): void {
    const dados = this.dadosFiltrados().map(item => ({
      'ID': item.id,
      'Nome': item.nome,
      'Valor': item.valor,
      'Vencimento (Dia)': this.obterDia(item.dataVencimento),
      'Vencimento (Mês)': this.obterMes(item.dataVencimento),
      'Vencimento (Ano)': this.obterAno(item.dataVencimento),
      'Pagamento (Dia)': this.obterDia(item.dataPagamento),
      'Pagamento (Mês)': this.obterMes(item.dataPagamento),
      'Pagamento (Ano)': this.obterAno(item.dataPagamento),
      'Valor Pagamento': item.valorPagamento || '',
      'Status Atraso': item.statusAtraso ? 'Sim' : 'Não',
      'Juros por Atraso': item.jurosPorAtraso || '',
      'Status Pagamento': item.statusPagamento,
      'Tipo Despesa': item.tipoDespesa?.nome || item.tipoDespesaId,
      'Tipo Gasto': item.tipoGasto?.nome || item.tipoGastoId,
      'Tipo Lançamento': this.obterNomeTipoLancamento(item.tipoLancamento),
    }));

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Controle de Custos');
    
    // Adicionar linha de totais
    const totalEntrada = this.calcularTotalEntrada();
    const totalSaida = this.calcularTotalSaida();
    const linhaTotal = {
      'ID': '',
      'Nome': 'TOTAIS',
      'Valor': '',
      'Vencimento (Dia)': '',
      'Vencimento (Mês)': '',
      'Vencimento (Ano)': '',
      'Pagamento (Dia)': '',
      'Pagamento (Mês)': '',
      'Pagamento (Ano)': '',
      'Valor Pagamento': '',
      'Status Atraso': '',
      'Juros por Atraso': '',
      'Status Pagamento': `ENTRADA: ${this.formatarMoeda(totalEntrada)} | SAÍDA: ${this.formatarMoeda(totalSaida)}`,
      'Tipo Despesa': '',
      'Tipo Gasto': '',
      'Tipo Lançamento': '',
    };
    
    XLSX.utils.sheet_add_json(ws, [linhaTotal], { origin: -1 });
    
    XLSX.writeFile(wb, `Controle_de_Custos_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  onVisualizar(item: ControleCustos): void {
    this.itemSelecionado.set(item);
    this.formId.set(item.id);
    this.formNome.set(item.nome);
    this.formValor.set(String(item.valor));
    this.formDataVencimento.set(this.formatarDataParaInput(item.dataVencimento));
    this.formDataPagamento.set(this.formatarDataParaInput(item.dataPagamento));
    this.formValorPagamento.set(String(item.valorPagamento || ''));
    this.formStatusAtraso.set(item.statusAtraso);
    this.formJurosPorAtraso.set(String(item.jurosPorAtraso || ''));
    // Usar o ID do objeto aninhado se disponível, senão usar o ID direto
    this.formTipoDespesaId.set(item.tipoDespesa?.id || item.tipoDespesaId);
    this.formTipoGastoId.set(item.tipoGasto?.id || item.tipoGastoId);
    this.formTipoLancamento.set(item.tipoLancamento);
    this.modalAcao.set('visualizar');
    this.modalAberto.set(true);
  }

  onAlterar(item: ControleCustos): void {
    this.itemSelecionado.set(item);
    this.formId.set(item.id);
    this.formNome.set(item.nome);
    this.formValor.set(String(item.valor));
    this.formDataVencimento.set(this.formatarDataParaInput(item.dataVencimento));
    this.formDataPagamento.set(this.formatarDataParaInput(item.dataPagamento));
    this.formValorPagamento.set(String(item.valorPagamento || ''));
    this.formStatusAtraso.set(item.statusAtraso);
    this.formJurosPorAtraso.set(String(item.jurosPorAtraso || ''));
    // Usar o ID do objeto aninhado se disponível, senão usar o ID direto
    this.formTipoDespesaId.set(item.tipoDespesa?.id || item.tipoDespesaId);
    this.formTipoGastoId.set(item.tipoGasto?.id || item.tipoGastoId);
    this.formTipoLancamento.set(item.tipoLancamento);
    this.modalAcao.set('alterar');
    this.modalAberto.set(true);
  }

  onExcluir(item: ControleCustos): void {
    this.itemSelecionado.set(item);
    this.formId.set(item.id);
    this.formNome.set(item.nome);
    this.formValor.set(String(item.valor));
    this.formDataVencimento.set(this.formatarDataParaInput(item.dataVencimento));
    this.formDataPagamento.set(this.formatarDataParaInput(item.dataPagamento));
    this.formValorPagamento.set(String(item.valorPagamento || ''));
    this.formStatusAtraso.set(item.statusAtraso);
    this.formJurosPorAtraso.set(String(item.jurosPorAtraso || ''));
    // Usar o ID do objeto aninhado se disponível, senão usar o ID direto
    this.formTipoDespesaId.set(item.tipoDespesa?.id || item.tipoDespesaId);
    this.formTipoGastoId.set(item.tipoGasto?.id || item.tipoGastoId);
    this.formTipoLancamento.set(item.tipoLancamento);
    this.modalAcao.set('excluir');
    this.modalAberto.set(true);
  }

  obterStatusPagamento(): string {
    return this.formDataPagamento() ? 'Pago' : 'Pendente';
  }

  parseIntValue(value: string): number {
    return parseInt(value, 10);
  }

  obterNomeTipoDespesaSelecionado(): string {
    const id = this.formTipoDespesaId();
    if (!id) return '';
    const despesa = this.despesas().find(d => d.id === id);
    return despesa ? despesa.nome : '';
  }

  obterNomeTipoGastoSelecionado(): string {
    const id = this.formTipoGastoId();
    if (!id) return '';
    const tipoGasto = this.tipoGastos().find(tg => tg.id === id);
    return tipoGasto ? tipoGasto.nome : '';
  }

  obterNomeTipoLancamentoSelecionado(): string {
    const valor = this.formTipoLancamento();
    if (!valor) return '';
    return this.obterNomeTipoLancamento(valor);
  }

  confirmarModal(): void {
    const acao = this.modalAcao();
    if (acao === 'inserir') {
      const novo: Partial<ControleCustos> = {
        nome: this.formNome(),
        valor: parseFloat(this.formValor()),
        dataVencimento: this.formDataVencimento(),
        dataPagamento: this.formDataPagamento() || undefined,
        valorPagamento: this.formValorPagamento() ? parseFloat(this.formValorPagamento()) : undefined,
        statusAtraso: this.formStatusAtraso(),
        jurosPorAtraso: this.formJurosPorAtraso() ? parseFloat(this.formJurosPorAtraso()) : undefined,
        statusPagamento: this.obterStatusPagamento(),
        tipoDespesaId: this.formTipoDespesaId() || 0,
        tipoGastoId: this.formTipoGastoId() || 0,
        tipoLancamento: this.formTipoLancamento() || 0,
      };
      this.criarUseCase.execute(novo).subscribe({
        next: () => { this.carregarDados(); this.fecharModal(); },
        error: () => this.erro.set('Erro ao criar registro.'),
      });
    } else if (acao === 'alterar') {
      const id = this.formId();
      if (id === null) return;
      const atualizado: Partial<ControleCustos> = {
        nome: this.formNome(),
        valor: parseFloat(this.formValor()),
        dataVencimento: this.formDataVencimento(),
        dataPagamento: this.formDataPagamento() || undefined,
        valorPagamento: this.formValorPagamento() ? parseFloat(this.formValorPagamento()) : undefined,
        statusAtraso: this.formStatusAtraso(),
        jurosPorAtraso: this.formJurosPorAtraso() ? parseFloat(this.formJurosPorAtraso()) : undefined,
        statusPagamento: this.obterStatusPagamento(),
        tipoDespesaId: this.formTipoDespesaId() || 0,
        tipoGastoId: this.formTipoGastoId() || 0,
        tipoLancamento: this.formTipoLancamento() || 0,
      };
      this.atualizarUseCase.execute(id, atualizado).subscribe({
        next: () => { this.carregarDados(); this.fecharModal(); },
        error: () => this.erro.set('Erro ao atualizar registro.'),
      });
    } else if (acao === 'excluir') {
      const id = this.formId();
      if (id === null) return;
      this.excluirUseCase.execute(id).subscribe({
        next: () => { this.carregarDados(); this.fecharModal(); },
        error: () => this.erro.set('Erro ao excluir registro.'),
      });
    }
  }

  fecharModal(): void {
    this.modalAberto.set(false);
    this.modalAcao.set(null);
    this.itemSelecionado.set(null);
  }
}
