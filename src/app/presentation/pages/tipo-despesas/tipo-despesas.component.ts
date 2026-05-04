import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListarDespesasUseCase }   from '../../../core/usecases/listar-despesas.usecase';
import { CriarDespesaUseCase }     from '../../../core/usecases/criar-despesa.usecase';
import { AtualizarDespesaUseCase } from '../../../core/usecases/atualizar-despesa.usecase';
import { ExcluirDespesaUseCase }   from '../../../core/usecases/excluir-despesa.usecase';
import { Despesa }                 from '../../../core/models/despesa.model';
import { AppConfigService }        from '../../../core/services/app-config.service';
import { PageTitleComponent }      from '../../shared/page-title/page-title.component';
import { CrudButtonsComponent }    from '../../shared/crud-buttons/crud-buttons.component';

type ModalAcao = 'inserir' | 'visualizar' | 'alterar' | 'excluir' | null;

@Component({
  selector: 'app-tipo-despesas',
  standalone: true,
  imports: [FormsModule, PageTitleComponent, CrudButtonsComponent],
  templateUrl: './tipo-despesas.component.html',
  styleUrl: './tipo-despesas.component.css',
})
export class TipoDespesasComponent implements OnInit {
  private listarUseCase    = inject(ListarDespesasUseCase);
  private criarUseCase     = inject(CriarDespesaUseCase);
  private atualizarUseCase = inject(AtualizarDespesaUseCase);
  private excluirUseCase   = inject(ExcluirDespesaUseCase);
  cfg = inject(AppConfigService);

  despesas       = signal<Despesa[]>([]);
  loading        = signal(false);
  erro           = signal('');
  colunas        = signal<string[]>(['id', 'nome']);
  filtros        = signal<Record<string, string>>({});
  sortColuna     = signal('');
  sortDirecao    = signal<'asc' | 'desc'>('asc');
  paginaAtual    = signal(1);
  itensPorPagina = signal(10);

  // Modal
  modalAberto     = signal(false);
  modalAcao       = signal<ModalAcao>(null);
  itemSelecionado = signal<Despesa | null>(null);
  formId   = signal<number | null>(null);
  formNome = signal('');

  modalTitulo = computed(() => {
    switch (this.modalAcao()) {
      case 'inserir':    return 'Inserir Novo Tipo de Despesa';
      case 'visualizar': return 'Visualizar Tipo de Despesa';
      case 'alterar':    return 'Alterar Tipo de Despesa';
      case 'excluir':    return 'Excluir Tipo de Despesa';
      default:           return '';
    }
  });

  somenteLeitura = computed(() =>
    this.modalAcao() === 'visualizar' || this.modalAcao() === 'excluir'
  );

  dadosFiltrados = computed(() => {
    const dados = this.despesas();
    const f     = this.filtros();
    const col   = this.sortColuna();
    const dir   = this.sortDirecao();
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

  ngOnInit(): void { this.carregarDados(); }

  carregarDados(): void {
    this.loading.set(true);
    this.erro.set('');
    this.listarUseCase.execute().subscribe({
      next: (dados) => { this.despesas.set(dados); this.loading.set(false); },
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
    this.modalAcao.set('inserir');
    this.modalAberto.set(true);
  }

  onVisualizar(item: Despesa): void {
    this.itemSelecionado.set(item);
    this.formId.set(item.id);
    this.formNome.set(item.nome);
    this.modalAcao.set('visualizar');
    this.modalAberto.set(true);
  }

  onAlterar(item: Despesa): void {
    this.itemSelecionado.set(item);
    this.formId.set(item.id);
    this.formNome.set(item.nome);
    this.modalAcao.set('alterar');
    this.modalAberto.set(true);
  }

  onExcluir(item: Despesa): void {
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

    // POST /api/Despesas
    if (acao === 'inserir') {
      this.criarUseCase.execute({ nome }).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: (err) => {
          console.error('POST /api/Despesas falhou', err);
          this.erro.set('Erro ao criar. Verifique os dados.');
        },
      });
      return;
    }

    // PUT /api/Despesas/{id}
    if (acao === 'alterar' && id !== null) {
      this.atualizarUseCase.execute(id, { id, nome }).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: (err) => {
          console.error(`PUT /api/Despesas/${id} falhou`, err);
          this.erro.set('Erro ao atualizar. Verifique os dados.');
        },
      });
      return;
    }

    // DELETE /api/Despesas/{id}
    if (acao === 'excluir' && id !== null) {
      this.excluirUseCase.execute(id).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: (err) => {
          console.error(`DELETE /api/Despesas/${id} falhou`, err);
          this.erro.set('Erro ao excluir. O item pode ter dependências.');
        },
      });
    }
  }
}
