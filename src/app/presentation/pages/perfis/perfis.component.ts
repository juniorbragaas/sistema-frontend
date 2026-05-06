import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListarPerfisUseCase } from '../../../core/usecases/listar-perfis.usecase';
import { CriarPerfilUseCase } from '../../../core/usecases/criar-perfil.usecase';
import { AtualizarPerfilUseCase } from '../../../core/usecases/atualizar-perfil.usecase';
import { ExcluirPerfilUseCase } from '../../../core/usecases/excluir-perfil.usecase';
import { Perfil } from '../../../core/models/perfil.model';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { CrudButtonsComponent } from '../../shared/crud-buttons/crud-buttons.component';
import { AppTableDirective } from '../../shared/app-table/app-table.directive';

type ModalAcao = 'inserir' | 'visualizar' | 'alterar' | 'excluir' | null;

@Component({
  selector: 'app-perfis',
  standalone: true,
  imports: [FormsModule, PageTitleComponent, CrudButtonsComponent, AppTableDirective],
  templateUrl: './perfis.component.html',
  styleUrl: './perfis.component.css',
})
export class PerfisComponent implements OnInit {
  private listarPerfisUseCase = inject(ListarPerfisUseCase);
  private criarPerfilUseCase = inject(CriarPerfilUseCase);
  private atualizarPerfilUseCase = inject(AtualizarPerfilUseCase);
  private excluirPerfilUseCase = inject(ExcluirPerfilUseCase);

  perfis = signal<Perfil[]>([]);
  loading = signal(false);
  erro = signal('');
  colunas = signal<string[]>([]);
  filtros = signal<Record<string, string>>({});
  sortColuna  = signal('');
  sortDirecao = signal<'asc' | 'desc'>('asc');
  paginaAtual = signal(1);
  itensPorPagina = signal(10);

  // Modal
  modalAberto = signal(false);
  modalAcao = signal<ModalAcao>(null);
  itemSelecionado = signal<Perfil | null>(null);
  formNome = signal('');
  formId = signal<string | null>(null);

  modalTitulo = computed(() => {
    switch (this.modalAcao()) {
      case 'inserir':    return 'Inserir Novo Perfil';
      case 'visualizar': return 'Visualizar Perfil';
      case 'alterar':    return 'Alterar Perfil';
      case 'excluir':    return 'Excluir Perfil';
      default:           return '';
    }
  });

  somenteLeitura = computed(() =>
    this.modalAcao() === 'visualizar' || this.modalAcao() === 'excluir'
  );

  dadosFiltrados = computed(() => {
    const dados = this.perfis();
    const f = this.filtros();
    const col = this.sortColuna();
    const dir = this.sortDirecao();
    const filtrados = dados.filter(item =>
      Object.keys(f).every(c => {
        const filtro = f[c]?.toLowerCase() ?? '';
        if (!filtro) return true;
        const valor = String(item[c] ?? '').toLowerCase();
        return valor.includes(filtro);
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

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.loading.set(true);
    this.erro.set('');
    this.listarPerfisUseCase.execute().subscribe({
      next: (dados) => {
        this.perfis.set(dados);
        if (dados.length > 0) {
          this.colunas.set(['id', 'nome']);
        } else {
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

  onVisualizar(item: Perfil): void {
    this.itemSelecionado.set(item);
    this.formId.set(item.id);
    this.formNome.set(item.nome);
    this.modalAcao.set('visualizar');
    this.modalAberto.set(true);
  }

  onAlterar(item: Perfil): void {
    this.itemSelecionado.set(item);
    this.formId.set(item.id);
    this.formNome.set(item.nome);
    this.modalAcao.set('alterar');
    this.modalAberto.set(true);
  }

  onExcluir(item: Perfil): void {
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
      this.criarPerfilUseCase.execute({ nome }).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: (err) => console.error('Erro ao criar perfil', err),
      });
      return;
    }

    if (acao === 'alterar' && id) {
      this.atualizarPerfilUseCase.execute(id, { id, nome }).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: (err) => console.error('Erro ao atualizar perfil', err),
      });
      return;
    }

    if (acao === 'excluir' && id) {
      this.excluirPerfilUseCase.execute(id).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: (err) => console.error('Erro ao excluir perfil', err),
      });
      return;
    }
  }
}
