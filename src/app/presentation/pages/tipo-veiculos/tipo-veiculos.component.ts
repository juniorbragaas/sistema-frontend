import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListarTipoVeiculosUseCase } from '../../../core/usecases/listar-tipo-veiculos.usecase';
import { CriarTipoVeiculoUseCase } from '../../../core/usecases/criar-tipo-veiculo.usecase';
import { AtualizarTipoVeiculoUseCase } from '../../../core/usecases/atualizar-tipo-veiculo.usecase';
import { ExcluirTipoVeiculoUseCase } from '../../../core/usecases/excluir-tipo-veiculo.usecase';
import { TipoVeiculo } from '../../../core/models/tipo-veiculo.model';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { CrudButtonsComponent } from '../../shared/crud-buttons/crud-buttons.component';

type ModalAcao = 'inserir' | 'visualizar' | 'alterar' | 'excluir' | null;

@Component({
  selector: 'app-tipo-veiculos',
  standalone: true,
  imports: [FormsModule, PageTitleComponent, CrudButtonsComponent],
  templateUrl: './tipo-veiculos.component.html',
  styleUrl: './tipo-veiculos.component.css',
})
export class TipoVeiculosComponent implements OnInit {
  private listarTipoVeiculosUseCase = inject(ListarTipoVeiculosUseCase);
  private criarTipoVeiculoUseCase = inject(CriarTipoVeiculoUseCase);
  private atualizarTipoVeiculoUseCase = inject(AtualizarTipoVeiculoUseCase);
  private excluirTipoVeiculoUseCase = inject(ExcluirTipoVeiculoUseCase);

  tiposVeiculos = signal<TipoVeiculo[]>([]);
  loading = signal(false);
  erro = signal('');
  colunas = signal<string[]>([]);
  filtros = signal<Record<string, string>>({});
  sortColuna = signal('');
  sortDirecao = signal<'asc' | 'desc'>('asc');
  paginaAtual = signal(1);
  itensPorPagina = signal(10);

  // Modal
  modalAberto = signal(false);
  modalAcao = signal<ModalAcao>(null);
  itemSelecionado = signal<TipoVeiculo | null>(null);
  formNome = signal('');
  formId = signal<string | null>(null);

  modalTitulo = computed(() => {
    switch (this.modalAcao()) {
      case 'inserir':    return 'Inserir Novo Tipo de Veículo';
      case 'visualizar': return 'Visualizar Tipo de Veículo';
      case 'alterar':    return 'Alterar Tipo de Veículo';
      case 'excluir':    return 'Excluir Tipo de Veículo';
      default:           return '';
    }
  });

  somenteLeitura = computed(() =>
    this.modalAcao() === 'visualizar' || this.modalAcao() === 'excluir'
  );

  dadosFiltrados = computed(() => {
    const dados = this.tiposVeiculos();
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
    this.listarTipoVeiculosUseCase.execute().subscribe({
      next: (dados) => {
        this.tiposVeiculos.set(dados);
        if (dados.length > 0) {
          this.colunas.set(['id', 'nome']);
        } else {
          this.colunas.set(['id', 'nome']);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar tipos de veículos:', err);
        this.erro.set('Erro ao carregar dados.');
        this.loading.set(false);
      },
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

  onVisualizar(item: TipoVeiculo): void {
    this.itemSelecionado.set(item);
    this.formId.set(item.id);
    this.formNome.set(item.nome);
    this.modalAcao.set('visualizar');
    this.modalAberto.set(true);
  }

  onAlterar(item: TipoVeiculo): void {
    this.itemSelecionado.set(item);
    this.formId.set(item.id);
    this.formNome.set(item.nome);
    this.modalAcao.set('alterar');
    this.modalAberto.set(true);
  }

  onExcluir(item: TipoVeiculo): void {
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
  }

  confirmarModal(): void {
    const acao = this.modalAcao();
    const nome = this.formNome();
    const id = this.formId();

    if (acao === 'inserir') {
      this.criarTipoVeiculoUseCase.execute({ id: '', nome }).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: (err) => {
          console.error('Erro ao criar tipo de veículo', err);
          this.erro.set('Erro ao criar tipo de veículo');
        },
      });
      return;
    }

    if (acao === 'alterar' && id) {
      this.atualizarTipoVeiculoUseCase.execute(id, { id, nome }).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: (err) => {
          console.error('Erro ao atualizar tipo de veículo', err);
          this.erro.set('Erro ao atualizar tipo de veículo');
        },
      });
      return;
    }

    if (acao === 'excluir' && id) {
      this.excluirTipoVeiculoUseCase.execute(id).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: (err) => {
          console.error('Erro ao excluir tipo de veículo', err);
          this.erro.set('Erro ao excluir tipo de veículo');
        },
      });
      return;
    }
  }

  getItemValue(item: TipoVeiculo, col: string): any {
    return (item as any)[col];
  }
}
