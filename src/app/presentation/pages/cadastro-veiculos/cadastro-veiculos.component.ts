import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListarVeiculosUseCase } from '../../../core/usecases/listar-veiculos.usecase';
import { CriarVeiculoUseCase } from '../../../core/usecases/criar-veiculo.usecase';
import { AtualizarVeiculoUseCase } from '../../../core/usecases/atualizar-veiculo.usecase';
import { ExcluirVeiculoUseCase } from '../../../core/usecases/excluir-veiculo.usecase';
import { ListarTipoVeiculosUseCase } from '../../../core/usecases/listar-tipo-veiculos.usecase';
import { ListarPessoasUseCase } from '../../../core/usecases/listar-pessoas.usecase';
import { Veiculo } from '../../../core/models/veiculo.model';
import { TipoVeiculo } from '../../../core/models/tipo-veiculo.model';
import { PessoaApi } from '../../../core/models/pessoa-api.model';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { CrudButtonsComponent } from '../../shared/crud-buttons/crud-buttons.component';
import { AppTableDirective } from '../../shared/app-table/app-table.directive';

type ModalAcao = 'inserir' | 'visualizar' | 'alterar' | 'excluir' | null;

const LABELS: Record<string, string> = {
  placa: 'Placa',
  marca: 'Marca',
  modelo: 'Modelo',
  cor: 'Cor',
};

@Component({
  selector: 'app-cadastro-veiculos',
  standalone: true,
  imports: [FormsModule, PageTitleComponent, CrudButtonsComponent, AppTableDirective],
  templateUrl: './cadastro-veiculos.component.html',
  styleUrl: './cadastro-veiculos.component.css',
})
export class CadastroVeiculosComponent implements OnInit {
  private listarVeiculosUseCase = inject(ListarVeiculosUseCase);
  private criarVeiculoUseCase = inject(CriarVeiculoUseCase);
  private atualizarVeiculoUseCase = inject(AtualizarVeiculoUseCase);
  private excluirVeiculoUseCase = inject(ExcluirVeiculoUseCase);
  private listarTipoVeiculosUseCase = inject(ListarTipoVeiculosUseCase);
  private listarPessoasUseCase = inject(ListarPessoasUseCase);

  veiculos = signal<Veiculo[]>([]);
  tiposVeiculos = signal<TipoVeiculo[]>([]);
  pessoas = signal<PessoaApi[]>([]);
  loading = signal(false);
  erro = signal('');
  colunas = signal<string[]>(['placa', 'marca', 'modelo', 'cor']);
  filtros = signal<Record<string, string>>({});
  sortColuna = signal('');
  sortDirecao = signal<'asc' | 'desc'>('asc');
  paginaAtual = signal(1);
  itensPorPagina = signal(10);

  // Modal
  modalAberto = signal(false);
  modalAcao = signal<ModalAcao>(null);
  itemSelecionado = signal<Veiculo | null>(null);
  formId = signal<string | null>(null);
  formPlaca = signal('');
  formMarca = signal('');
  formModelo = signal('');
  formCor = signal('');
  formIdTipoVeiculo = signal('');
  formClienteId = signal('');

  modalTitulo = computed(() => {
    switch (this.modalAcao()) {
      case 'inserir':    return 'Inserir Novo Veículo';
      case 'visualizar': return 'Visualizar Veículo';
      case 'alterar':    return 'Alterar Veículo';
      case 'excluir':    return 'Excluir Veículo';
      default:           return '';
    }
  });

  somenteLeitura = computed(() =>
    this.modalAcao() === 'visualizar' || this.modalAcao() === 'excluir'
  );

  dadosFiltrados = computed(() => {
    const dados = this.veiculos();
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
    this.carregarTiposVeiculos();
    this.carregarPessoas();
  }

  carregarDados(): void {
    this.loading.set(true);
    this.erro.set('');
    this.listarVeiculosUseCase.execute().subscribe({
      next: (dados) => {
        this.veiculos.set(dados);
        this.loading.set(false);
      },
      error: () => {
        this.erro.set('Erro ao carregar dados.');
        this.loading.set(false);
      },
    });
  }

  carregarTiposVeiculos(): void {
    this.listarTipoVeiculosUseCase.execute().subscribe({
      next: (dados) => this.tiposVeiculos.set(dados),
      error: () => {},
    });
  }

  carregarPessoas(): void {
    this.listarPessoasUseCase.execute().subscribe({
      next: (dados) => this.pessoas.set(dados),
      error: () => {},
    });
  }

  labelColuna(col: string): string {
    return LABELS[col] ?? col;
  }

  getItemValue(item: Veiculo, col: string): any {
    return (item as any)[col];
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
    this.formPlaca.set('');
    this.formMarca.set('');
    this.formModelo.set('');
    this.formCor.set('');
    this.formIdTipoVeiculo.set('');
    this.formClienteId.set('');
    this.modalAcao.set('inserir');
    this.modalAberto.set(true);
  }

  onVisualizar(item: Veiculo): void {
    this.itemSelecionado.set(item);
    this.formId.set(item.id);
    this.formPlaca.set(item.placa);
    this.formMarca.set(item.marca ?? '');
    this.formModelo.set(item.modelo ?? '');
    this.formCor.set(item.cor ?? '');
    this.formIdTipoVeiculo.set(item.idTipoVeiculo ?? '');
    this.formClienteId.set(item.clienteId ?? '');
    this.modalAcao.set('visualizar');
    this.modalAberto.set(true);
  }

  onAlterar(item: Veiculo): void {
    this.itemSelecionado.set(item);
    this.formId.set(item.id);
    this.formPlaca.set(item.placa);
    this.formMarca.set(item.marca ?? '');
    this.formModelo.set(item.modelo ?? '');
    this.formCor.set(item.cor ?? '');
    this.formIdTipoVeiculo.set(item.idTipoVeiculo ?? '');
    this.formClienteId.set(item.clienteId ?? '');
    this.modalAcao.set('alterar');
    this.modalAberto.set(true);
  }

  onExcluir(item: Veiculo): void {
    this.itemSelecionado.set(item);
    this.formId.set(item.id);
    this.formPlaca.set(item.placa);
    this.formMarca.set(item.marca ?? '');
    this.formModelo.set(item.modelo ?? '');
    this.formCor.set(item.cor ?? '');
    this.formIdTipoVeiculo.set(item.idTipoVeiculo ?? '');
    this.formClienteId.set(item.clienteId ?? '');
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
    const id = this.formId();
    const placa = this.formPlaca().trim();
    const marca = this.formMarca().trim();
    const modelo = this.formModelo().trim();
    const cor = this.formCor().trim();
    const idTipoVeiculo = this.formIdTipoVeiculo();
    const clienteId = this.formClienteId();

    if (acao === 'inserir') {
      if (!placa) { this.erro.set('Placa é obrigatória'); return; }
      this.criarVeiculoUseCase.execute({ placa, marca, modelo, cor, idTipoVeiculo, clienteId }).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: () => this.erro.set('Erro ao criar veículo.'),
      });
      return;
    }

    if (acao === 'alterar' && id) {
      if (!placa) { this.erro.set('Placa é obrigatória'); return; }
      this.atualizarVeiculoUseCase.execute(id, { placa, marca, modelo, cor, idTipoVeiculo, clienteId }).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: () => this.erro.set('Erro ao atualizar veículo.'),
      });
      return;
    }

    if (acao === 'excluir' && id) {
      this.excluirVeiculoUseCase.execute(id).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: () => this.erro.set('Erro ao excluir veículo.'),
      });
      return;
    }
  }
}
