import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListarDespesasUseCase } from '../../../core/usecases/listar-despesas.usecase';
import { Despesa } from '../../../core/models/despesa.model';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { CrudButtonsComponent } from '../../shared/crud-buttons/crud-buttons.component';

type ModalAcao = 'inserir' | 'visualizar' | 'alterar' | 'excluir' | null;

@Component({
  selector: 'app-tipo-despesas',
  standalone: true,
  imports: [FormsModule, PageTitleComponent, CrudButtonsComponent],
  templateUrl: './tipo-despesas.component.html',
  styleUrl: './tipo-despesas.component.css',
})
export class TipoDespesasComponent implements OnInit {
  private listarDespesasUseCase = inject(ListarDespesasUseCase);

  despesas = signal<Despesa[]>([]);
  loading = signal(false);
  erro = signal('');
  colunas = signal<string[]>([]);
  filtros = signal<Record<string, string>>({});
  paginaAtual = signal(1);
  itensPorPagina = signal(10);

  // Modal
  modalAberto = signal(false);
  modalAcao = signal<ModalAcao>(null);
  itemSelecionado = signal<Despesa | null>(null);
  formNome = signal('');
  formId = signal<number | null>(null);

  modalTitulo = computed(() => {
    switch (this.modalAcao()) {
      case 'inserir': return 'Inserir Novo Tipo de Despesa';
      case 'visualizar': return 'Visualizar Tipo de Despesa';
      case 'alterar': return 'Alterar Tipo de Despesa';
      case 'excluir': return 'Excluir Tipo de Despesa';
      default: return '';
    }
  });

  somenteLeitura = computed(() =>
    this.modalAcao() === 'visualizar' || this.modalAcao() === 'excluir'
  );

  dadosFiltrados = computed(() => {
    const dados = this.despesas();
    const f = this.filtros();
    return dados.filter(item =>
      Object.keys(f).every(col => {
        const filtro = f[col]?.toLowerCase() ?? '';
        if (!filtro) return true;
        const valor = String(item[col] ?? '').toLowerCase();
        return valor.includes(filtro);
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

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.loading.set(true);
    this.erro.set('');
    this.listarDespesasUseCase.execute().subscribe({
      next: (dados) => {
        this.despesas.set(dados);
        if (dados.length > 0) {
          this.colunas.set(['id', 'nome']);
        }
        this.loading.set(false);
      },
      error: () => {
        this.erro.set('Erro ao carregar dados.');
        this.loading.set(false);
      },
    });
  }

  onFiltroChange(coluna: string, valor: string): void {
    this.filtros.update(f => ({ ...f, [coluna]: valor }));
    this.paginaAtual.set(1);
  }

  irParaPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaAtual.set(pagina);
    }
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
    this.formNome.set(String(item['nome'] ?? ''));
    this.modalAcao.set('visualizar');
    this.modalAberto.set(true);
  }

  onAlterar(item: Despesa): void {
    this.itemSelecionado.set(item);
    this.formId.set(item.id);
    this.formNome.set(String(item['nome'] ?? ''));
    this.modalAcao.set('alterar');
    this.modalAberto.set(true);
  }

  onExcluir(item: Despesa): void {
    this.itemSelecionado.set(item);
    this.formId.set(item.id);
    this.formNome.set(String(item['nome'] ?? ''));
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
    const nome = this.formNome();
    const item = this.itemSelecionado();

    console.log(`Ação: ${acao}`, { nome, item });

    // TODO: integrar com use cases de criar/alterar/excluir
    this.fecharModal();
  }
}
