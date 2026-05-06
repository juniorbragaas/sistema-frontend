import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { CrudButtonsComponent } from '../../shared/crud-buttons/crud-buttons.component';
import { TipoVeiculoService, TipoVeiculo } from '../../../core/services/tipo-veiculo.service';

@Component({
  selector: 'app-tipo-veiculos',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitleComponent, CrudButtonsComponent],
  templateUrl: './tipo-veiculos.component.html',
  styleUrl: './tipo-veiculos.component.css',
})
export class TipoVeiculosComponent implements OnInit {
  private tipoVeiculoService = inject(TipoVeiculoService);

  // Signals
  tiposVeiculos = signal<TipoVeiculo[]>([]);
  loading = signal(false);
  erro = signal('');
  filtros = signal<Record<string, string>>({});
  paginaAtual = signal(1);
  itensPorPagina = signal(10);

  // Modal
  mostraModal = signal(false);
  modalTitulo = signal('');
  tipoVeiculoEditando = signal<TipoVeiculo | null>(null);
  carregandoModal = signal(false);

  // Colunas
  colunas = [
    { key: 'nome', label: 'Nome' },
  ];

  // Computed
  dadosFiltrados = computed(() => {
    const dados = this.tiposVeiculos();
    const f = this.filtros();
    
    const filtrados = dados.filter(item =>
      Object.keys(f).every(c => {
        const filtro = f[c]?.toLowerCase() ?? '';
        if (!filtro) return true;
        const valor = String((item as any)[c] ?? '').toLowerCase();
        return valor.includes(filtro);
      })
    );
    
    return filtrados;
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
    this.tipoVeiculoService.listarTodos().subscribe({
      next: (dados) => {
        this.tiposVeiculos.set(dados);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar tipos de veículos:', err);
        this.erro.set('Erro ao carregar dados de tipos de veículos.');
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

  abrirModalNovo(): void {
    this.tipoVeiculoEditando.set({ id: '', nome: '' });
    this.modalTitulo.set('Novo Tipo de Veículo');
    this.mostraModal.set(true);
  }

  abrirModalEditar(tipoVeiculo: TipoVeiculo): void {
    this.tipoVeiculoEditando.set({ ...tipoVeiculo });
    this.modalTitulo.set('Editar Tipo de Veículo');
    this.mostraModal.set(true);
  }

  fecharModal(): void {
    this.mostraModal.set(false);
    this.tipoVeiculoEditando.set(null);
  }

  salvar(): void {
    const tipoVeiculo = this.tipoVeiculoEditando();
    if (!tipoVeiculo) return;

    if (!tipoVeiculo.nome || tipoVeiculo.nome.trim() === '') {
      this.erro.set('Nome é obrigatório');
      return;
    }

    this.carregandoModal.set(true);

    if (tipoVeiculo.id) {
      // Atualizar
      this.tipoVeiculoService.atualizar(tipoVeiculo.id, tipoVeiculo).subscribe({
        next: () => {
          this.carregarDados();
          this.fecharModal();
          this.carregandoModal.set(false);
        },
        error: (err) => {
          console.error('Erro ao atualizar:', err);
          this.erro.set('Erro ao atualizar tipo de veículo');
          this.carregandoModal.set(false);
        },
      });
    } else {
      // Criar
      this.tipoVeiculoService.criar(tipoVeiculo).subscribe({
        next: () => {
          this.carregarDados();
          this.fecharModal();
          this.carregandoModal.set(false);
        },
        error: (err) => {
          console.error('Erro ao criar:', err);
          this.erro.set('Erro ao criar tipo de veículo');
          this.carregandoModal.set(false);
        },
      });
    }
  }

  deletar(id: string): void {
    if (confirm('Tem certeza que deseja deletar este tipo de veículo?')) {
      this.tipoVeiculoService.deletar(id).subscribe({
        next: () => {
          this.carregarDados();
        },
        error: (err) => {
          console.error('Erro ao deletar:', err);
          this.erro.set('Erro ao deletar tipo de veículo');
        },
      });
    }
  }
}
