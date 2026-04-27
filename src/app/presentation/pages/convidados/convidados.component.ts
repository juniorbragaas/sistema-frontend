import { Component, inject, signal, computed, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListarConvidadosUseCase } from '../../../core/usecases/listar-convidados.usecase';
import { CriarConvidadoUseCase } from '../../../core/usecases/criar-convidado.usecase';
import { ExcluirConvidadoUseCase } from '../../../core/usecases/excluir-convidado.usecase';
import { ListarPessoasUseCase } from '../../../core/usecases/listar-pessoas.usecase';
import { Convidado } from '../../../core/models/convidado.model';
import { PessoaApi } from '../../../core/models/pessoa-api.model';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { CrudButtonsComponent } from '../../shared/crud-buttons/crud-buttons.component';

@Component({
  selector: 'app-convidados',
  standalone: true,
  imports: [FormsModule, PageTitleComponent, CrudButtonsComponent],
  templateUrl: './convidados.component.html',
  styleUrl: './convidados.component.css',
})
export class ConvidadosComponent implements OnInit {
  private listarUseCase = inject(ListarConvidadosUseCase);
  private criarUseCase = inject(CriarConvidadoUseCase);
  private excluirUseCase = inject(ExcluirConvidadoUseCase);
  private listarPessoasUseCase = inject(ListarPessoasUseCase);

  convidados = signal<Convidado[]>([]);
  loading = signal(false);
  erro = signal('');
  filtros = signal<Record<string, string>>({});
  paginaAtual = signal(1);
  itensPorPagina = signal(10);

  colunas: { key: string; label: string }[] = [
    { key: 'foto', label: 'Foto' },
    { key: 'visitante', label: 'Visitante' },
    { key: 'pessoa.foto', label: 'Foto Responsável' },
    { key: 'pessoa.nomeCompleto', label: 'Responsável' },
    { key: 'dataEntrada', label: 'Data Entrada' },
    { key: 'dataSaida', label: 'Data Saída' },
  ];

  // Modal excluir
  modalAberto = signal(false);
  itemSelecionado = signal<Convidado | null>(null);
  excluindo = signal(false);

  // Modal foto ampliada
  modalFotoAberto = signal(false);
  fotoAmpliada = signal('');

  // Modal inserir
  modalInserirAberto = signal(false);
  formInserir = signal<Record<string, string>>({ visitante: '', idPessoa: '', dataEntrada: '', dataSaida: '' });
  salvando = signal(false);

  // Autocomplete pessoas
  pessoas = signal<PessoaApi[]>([]);
  pessoaFiltro = signal('');
  pessoaDropdownAberto = signal(false);

  // Foto
  fotoPreview = signal('');
  cameraAtiva = signal(false);
  private stream: MediaStream | null = null;

  @ViewChild('videoEl') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasRef!: ElementRef<HTMLCanvasElement>;

  pessoasFiltradas = computed(() => {
    const filtro = this.pessoaFiltro().toLowerCase();
    if (!filtro) return this.pessoas();
    return this.pessoas().filter(p => p.nomeCompleto.toLowerCase().includes(filtro));
  });

  dadosFiltrados = computed(() => {
    const dados = this.convidados();
    const f = this.filtros();
    return dados.filter(item =>
      Object.keys(f).every(col => {
        const filtro = f[col]?.toLowerCase() ?? '';
        if (!filtro) return true;
        const valor = String(this.getValor(item, col)).toLowerCase();
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
    this.carregarPessoas();
  }

  carregarPessoas(): void {
    this.listarPessoasUseCase.execute().subscribe({
      next: (dados) => this.pessoas.set(dados),
    });
  }

  carregarDados(): void {
    this.loading.set(true);
    this.erro.set('');
    this.listarUseCase.execute().subscribe({
      next: (dados) => {
        this.convidados.set(dados);
        this.loading.set(false);
      },
      error: () => {
        this.erro.set('Erro ao carregar dados.');
        this.loading.set(false);
      },
    });
  }

  getValor(item: Convidado, key: string): unknown {
    if (key.includes('.')) {
      const parts = key.split('.');
      let val: unknown = item;
      for (const p of parts) {
        val = (val as Record<string, unknown>)?.[p];
      }
      return val ?? '';
    }
    return item[key] ?? '';
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

  onExcluir(item: Convidado): void {
    this.itemSelecionado.set(item);
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    this.modalAberto.set(false);
    this.itemSelecionado.set(null);
  }

  onInserir(): void {
    this.formInserir.set({ visitante: '', idPessoa: '', dataEntrada: '', dataSaida: '' });
    this.pessoaFiltro.set('');
    this.pessoaDropdownAberto.set(false);
    this.fotoPreview.set('');
    this.cameraAtiva.set(false);
    this.modalInserirAberto.set(true);
  }

  fecharModalInserir(): void {
    this.pararCamera();
    this.modalInserirAberto.set(false);
    this.pessoaDropdownAberto.set(false);
  }

  onPessoaInput(valor: string): void {
    this.pessoaFiltro.set(valor);
    this.pessoaDropdownAberto.set(true);
  }

  selecionarPessoa(pessoa: PessoaApi): void {
    this.formInserir.update(f => ({ ...f, idPessoa: pessoa.id }));
    this.pessoaFiltro.set(pessoa.nomeCompleto);
    this.pessoaDropdownAberto.set(false);
  }

  updateFormInserir(field: string, value: string): void {
    this.formInserir.update(f => ({ ...f, [field]: value }));
  }

  confirmarInserir(): void {
    const data = this.formInserir();
    this.salvando.set(true);

    const fotoBase64 = this.fotoPreview() ? this.fotoPreview().split(',')[1] || '' : '';

    const body = {
      visitante: data['visitante'],
      idPessoa: data['idPessoa'],
      foto: fotoBase64,
      dataEntrada: data['dataEntrada'] ? new Date(data['dataEntrada']).toISOString() : '',
      dataSaida: data['dataSaida'] ? new Date(data['dataSaida']).toISOString() : '',
    };

    this.criarUseCase.execute(body).subscribe({
      next: () => {
        this.salvando.set(false);
        this.fecharModalInserir();
        this.carregarDados();
      },
      error: () => {
        this.salvando.set(false);
        this.erro.set('Erro ao cadastrar convidado.');
      },
    });
  }

  onArquivoFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const reader = new FileReader();
    reader.onload = () => this.fotoPreview.set(reader.result as string);
    reader.readAsDataURL(input.files[0]);
  }

  async iniciarCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.cameraAtiva.set(true);
      setTimeout(() => {
        if (this.videoRef) {
          this.videoRef.nativeElement.srcObject = this.stream;
        }
      }, 100);
    } catch {
      this.erro.set('Não foi possível acessar a câmera.');
    }
  }

  capturarFoto(): void {
    const video = this.videoRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      this.fotoPreview.set(canvas.toDataURL('image/jpeg', 0.9));
    }
    this.pararCamera();
  }

  pararCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.cameraAtiva.set(false);
  }

  abrirFotoAmpliada(foto: string): void {
    this.fotoAmpliada.set(this.hexToDataUrl(foto));
    this.modalFotoAberto.set(true);
  }

  fecharFotoAmpliada(): void {
    this.modalFotoAberto.set(false);
    this.fotoAmpliada.set('');
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

  confirmarExcluir(): void {
    const item = this.itemSelecionado();
    if (!item) return;

    this.excluindo.set(true);
    this.excluirUseCase.execute(item.id).subscribe({
      next: () => {
        this.excluindo.set(false);
        this.fecharModal();
        this.carregarDados();
      },
      error: () => {
        this.excluindo.set(false);
        this.erro.set('Erro ao excluir registro.');
        this.fecharModal();
      },
    });
  }
}
