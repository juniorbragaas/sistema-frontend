import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListarTipoGastosUseCase }  from '../../../core/usecases/listar-tipo-gastos.usecase';
import { CriarTipoGastoUseCase }    from '../../../core/usecases/criar-tipo-gasto.usecase';
import { AtualizarTipoGastoUseCase } from '../../../core/usecases/atualizar-tipo-gasto.usecase';
import { ExcluirTipoGastoUseCase }  from '../../../core/usecases/excluir-tipo-gasto.usecase';
import { TipoGasto }                from '../../../core/models/tipo-gasto.model';
import { AppConfigService }         from '../../../core/services/app-config.service';
import { PageTitleComponent }       from '../../shared/page-title/page-title.component';
import { CrudButtonsComponent }     from '../../shared/crud-buttons/crud-buttons.component';

type ModalAcao = 'inserir' | 'visualizar' | 'alterar' | 'excluir' | null;

@Component({
  selector: 'app-tipo-gastos',
  standalone: true,
  imports: [FormsModule, PageTitleComponent, CrudButtonsComponent],
  templateUrl: './tipo-gastos.component.html',
  styleUrl: './tipo-gastos.component.css',
})
export class TipoGastosComponent implements OnInit {
  private listarUseCase   = inject(ListarTipoGastosUseCase);
  private criarUseCase    = inject(CriarTipoGastoUseCase);
  private atualizarUseCase = inject(AtualizarTipoGastoUseCase);
  private excluirUseCase  = inject(ExcluirTipoGastoUseCase);
  cfg = inject(AppConfigService);

  tipoGastos   = signal<TipoGasto[]>([]);
  loading      = signal(false);
  erro         = signal('');
  colunas      = signal<string[]>(['id', 'nome']);
  filtros      = signal<Record<string, string>>({});
  paginaAtual  = signal(1);
  itensPorPagina = signal(10);

  // Modal
  modalAberto     = signal(false);
  modalAcao       = signal<ModalAcao>(null);
  itemSelecionado = signal<TipoGasto | null>(null);
  formId   = signal<number | null>(null);
  formNome = signal('');

  modalTitulo = computed(() => {
    switch (this.modalAcao()) {
      case 'inserir':    return 'Inserir Novo Tipo de Gasto';
      case 'visualizar': return 'Visualizar Tipo de Gasto';
      case 'alterar':    return 'Alterar Tipo de Gasto';
      case 'excluir':    return 'Excluir Tipo de Gasto';
      default:           return '';
    }
  });

  somenteLeitura = computed(() =>
    this.modalAcao() === 'visualizar' || this.modalAcao() === 'excluir'
  );

  dadosFiltrados = computed(() => {
    const dados = this.tipoGastos();
    const f = this.filtros();
    return dados.filter(item =>
      Object.keys(f).every(col => {
        const filtro = f[col]?.toLowerCase() ?? '';
        if (!filtro) return true;
        return String(item[col] ?? '').toLowerCase().includes(filtro);
      })
    );
  });

  dadosPaginados = computed(() => {
    const filtrados = this.dadosFiltrados();
    const inicio = (this.paginaAtual() - 1) * this.itensPorPagina();
    return filtrados.slice(inicio, inicio + this.itensPorPagina());
  });

  totalPaginas = computed(() =>
    Math.ceil(this.dadosFiltrados().length / this.itensPorPagina()) || 1
  );

  ngOnInit(): void { this.carregarDados(); }

  carregarDados(): void {
    this.loading.set(true);
    this.erro.set('');
    this.listarUseCase.execute().subscribe({
      next: (dados) => { this.tipoGastos.set(dados); this.loading.set(false); },
      error: () => { this.erro.set('Erro ao carregar dados.'); this.loading.set(false); },
    });
  }

  onFiltroChange(coluna: string, valor: string): void {
    this.filtros.update(f => ({ ...f, [coluna]: valor }));
    this.paginaAtual.set(1);
  }

  irParaPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) this.paginaAtual.set(pagina);
  }

  onInserir(): void {
    this.itemSelecionado.set(null);
    this.formId.set(null);
    this.formNome.set('');
    this.modalAcao.set('inserir');
    this.modalAberto.set(true);
  }

  onVisualizar(item: TipoGasto): void {
    this.itemSelecionado.set(item);
    this.formId.set(item.id);
    this.formNome.set(item.nome);
    this.modalAcao.set('visualizar');
    this.modalAberto.set(true);
  }

  onAlterar(item: TipoGasto): void {
    this.itemSelecionado.set(item);
    this.formId.set(item.id);
    this.formNome.set(item.nome);
    this.modalAcao.set('alterar');
    this.modalAberto.set(true);
  }

  onExcluir(item: TipoGasto): void {
    this.itemSelecionado.set(item);
    this.formId.set(item.id);
    this.formNome.set(item.nome);
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
    const nome = this.formNome().trim();

    // POST /api/TipoGastos
    if (acao === 'inserir') {
      this.criarUseCase.execute({ nome }).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: (err) => {
          console.error('POST /api/TipoGastos falhou', err);
          this.erro.set('Erro ao criar. Verifique os dados e tente novamente.');
        },
      });
      return;
    }

    // PUT /api/TipoGastos/{id}
    if (acao === 'alterar' && id !== null) {
      this.atualizarUseCase.execute(id, { id, nome }).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: (err) => {
          console.error(`PUT /api/TipoGastos/${id} falhou`, err);
          this.erro.set('Erro ao atualizar. Verifique os dados e tente novamente.');
        },
      });
      return;
    }

    // DELETE /api/TipoGastos/{id}
    if (acao === 'excluir' && id !== null) {
      this.excluirUseCase.execute(id).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: (err) => {
          console.error(`DELETE /api/TipoGastos/${id} falhou`, err);
          this.erro.set('Erro ao excluir. O item pode ter dependências.');
        },
      });
    }
  }
}
