import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListarPessoasUseCase } from '../../../core/usecases/listar-pessoas.usecase';
import { AtualizarPessoaUseCase } from '../../../core/usecases/atualizar-pessoa.usecase';
import { CriarPessoaUseCase } from '../../../core/usecases/criar-pessoa.usecase';
import { PessoaApi } from '../../../core/models/pessoa-api.model';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { CrudButtonsComponent } from '../../shared/crud-buttons/crud-buttons.component';

type ModalAcao = 'inserir' | 'visualizar' | 'alterar' | 'excluir' | null;

@Component({
  selector: 'app-pessoas',
  standalone: true,
  imports: [FormsModule, PageTitleComponent, CrudButtonsComponent],
  templateUrl: './pessoas.component.html',
  styleUrl: './pessoas.component.css',
})
export class PessoasComponent implements OnInit {
  private listarPessoasUseCase = inject(ListarPessoasUseCase);
  private atualizarPessoaUseCase = inject(AtualizarPessoaUseCase);
  private criarPessoaUseCase = inject(CriarPessoaUseCase);

  pessoas = signal<PessoaApi[]>([]);
  loading = signal(false);
  erro = signal('');
  filtros = signal<Record<string, string>>({});
  sortColuna  = signal('');
  sortDirecao = signal<'asc' | 'desc'>('asc');
  paginaAtual = signal(1);
  itensPorPagina = signal(10);

  colunas: { key: string; label: string }[] = [
    { key: 'id', label: 'ID' },
    { key: 'foto', label: 'Foto' },
    { key: 'nomeCompleto', label: 'Nome Completo' },
    { key: 'email', label: 'Email' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'cpf', label: 'CPF' },
    { key: 'predio', label: 'Prédio' },
    { key: 'andar', label: 'Andar' },
  ];

  colunasFiltraveis = this.colunas.filter(c => c.key !== 'foto');

  // Modal
  modalAberto = signal(false);
  modalAcao = signal<ModalAcao>(null);
  itemSelecionado = signal<PessoaApi | null>(null);
  formData = signal<Record<string, string>>({});

  modalTitulo = computed(() => {
    switch (this.modalAcao()) {
      case 'inserir': return 'Inserir Nova Pessoa';
      case 'visualizar': return 'Visualizar Pessoa';
      case 'alterar': return 'Alterar Pessoa';
      case 'excluir': return 'Excluir Pessoa';
      default: return '';
    }
  });

  somenteLeitura = computed(() =>
    this.modalAcao() === 'visualizar' || this.modalAcao() === 'excluir'
  );

  dadosFiltrados = computed(() => {
    const dados = this.pessoas();
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
    this.listarPessoasUseCase.execute().subscribe({
      next: (dados) => {
        this.pessoas.set(dados);
        this.loading.set(false);
      },
      error: () => {
        this.erro.set('Erro ao carregar dados.');
        this.loading.set(false);
      },
    });
  }

  hexToDataUrl(hex: string): string {
    if (!hex) return '';
    if (hex.startsWith('data:')) return hex;
    if (/^[A-Za-z0-9+/=]+$/.test(hex) && hex.length > 100) {
      return `data:image/jpeg;base64,${hex}`;
    }
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    if (/^[0-9a-fA-F]+$/.test(cleanHex)) {
      const bytes = new Uint8Array(cleanHex.length / 2);
      for (let i = 0; i < cleanHex.length; i += 2) {
        bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
      }
      let binary = '';
      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }
      return `data:image/jpeg;base64,${btoa(binary)}`;
    }
    return hex;
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
    this.formData.set({ nomeCompleto: '', email: '', telefone: '', endereco: '', cpf: '', predio: '', andar: '' });
    this.modalAcao.set('inserir');
    this.modalAberto.set(true);
  }

  onVisualizar(item: PessoaApi): void {
    this.itemSelecionado.set(item);
    this.formData.set({ ...item } as Record<string, string>);
    this.modalAcao.set('visualizar');
    this.modalAberto.set(true);
  }

  onAlterar(item: PessoaApi): void {
    this.itemSelecionado.set(item);
    this.formData.set({ ...item } as Record<string, string>);
    this.modalAcao.set('alterar');
    this.modalAberto.set(true);
  }

  /** Registros protegidos que não podem ser excluídos */
  private readonly NOMES_PROTEGIDOS_PESSOA = ['administrador'];

  isPessoaProtegida(item: PessoaApi): boolean {
    return this.NOMES_PROTEGIDOS_PESSOA.includes(
      (item.nomeCompleto ?? '').toLowerCase().trim()
    );
  }

  onExcluir(item: PessoaApi): void {
    if (this.isPessoaProtegida(item)) {
      this.erro.set('O registro "Administrador" é protegido e não pode ser excluído.');
      return;
    }
    this.itemSelecionado.set(item);
    this.formData.set({ ...item } as Record<string, string>);
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
    const data = this.formData();

    if (acao === 'inserir') {
      const body: Partial<PessoaApi> = {
        id: crypto.randomUUID(),
        nomeCompleto: data['nomeCompleto'] ?? '',
        email: data['email'] ?? '',
        telefone: data['telefone'] ?? '',
        endereco: data['endereco'] ?? '',
        cpf: data['cpf'] ?? '',
        foto: '',
        predio: data['predio'] ?? '',
        andar: data['andar'] ?? '',
      };
      this.criarPessoaUseCase.execute(body).subscribe({
        next: () => {
          this.fecharModal();
          this.carregarDados();
        },
        error: (err) => {
          console.error('Erro ao criar pessoa', err);
        },
      });
      return;
    }

    if (acao === 'alterar' && data['id']) {
      const body = {
        id: data['id'],
        nomeCompleto: data['nomeCompleto'],
        email: data['email'],
        telefone: data['telefone'],
        endereco: data['endereco'],
        cpf: data['cpf'],
        predio: data['predio'],
        andar: data['andar'],
      };
      this.atualizarPessoaUseCase.execute(data['id'], body).subscribe({
        next: () => {
          this.fecharModal();
          this.carregarDados();
        },
        error: (err) => {
          console.error('Erro ao atualizar', err);
        },
      });
      return;
    }

    console.log(`Ação: ${acao}`, data);
    this.fecharModal();
  }

  updateFormField(field: string, value: string): void {
    this.formData.update(d => ({ ...d, [field]: value }));
  }
}
