import { Component, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BuscarPessoaCpfUseCase } from '../../../core/usecases/buscar-pessoa-cpf.usecase';
import { AtualizarPessoaUseCase } from '../../../core/usecases/atualizar-pessoa.usecase';
import { PessoaApi } from '../../../core/models/pessoa-api.model';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { CpfMaskDirective } from '../../shared/directives/cpf-mask.directive';

@Component({
  selector: 'app-alterar-foto',
  standalone: true,
  imports: [FormsModule, PageTitleComponent, CpfMaskDirective],
  templateUrl: './alterar-foto.component.html',
  styleUrl: './alterar-foto.component.css',
})
export class AlterarFotoComponent {
  private buscarPessoaCpfUseCase = inject(BuscarPessoaCpfUseCase);
  private atualizarPessoaUseCase = inject(AtualizarPessoaUseCase);

  cpfBusca = signal('');
  pessoa = signal<PessoaApi | null>(null);
  loading = signal(false);
  naoEncontrado = signal(false);
  erro = signal('');
  salvando = signal(false);
  salvoComSucesso = signal(false);
  novaFotoDataUrl = signal('');

  // Modal foto
  modalFotoAberto = signal(false);
  previewFoto = signal('');
  cameraAtiva = signal(false);
  private stream: MediaStream | null = null;

  @ViewChild('videoElement') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasRef!: ElementRef<HTMLCanvasElement>;

  onBuscar(): void {
    const cpf = this.cpfBusca().trim();
    if (!cpf) return;

    this.loading.set(true);
    this.pessoa.set(null);
    this.naoEncontrado.set(false);
    this.erro.set('');

    this.buscarPessoaCpfUseCase.execute(cpf).subscribe({
      next: (result) => {
        this.pessoa.set(result);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.naoEncontrado.set(true);
        } else {
          this.erro.set('Erro ao buscar pessoa.');
        }
      },
    });
  }

  abrirModalFoto(): void {
    this.previewFoto.set('');
    this.cameraAtiva.set(false);
    this.modalFotoAberto.set(true);
  }

  fecharModalFoto(): void {
    this.pararCamera();
    this.modalFotoAberto.set(false);
    this.previewFoto.set('');
  }

  onArquivoSelecionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.previewFoto.set(reader.result as string);
    };
    reader.readAsDataURL(file);
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
      this.previewFoto.set(canvas.toDataURL('image/jpeg', 0.9));
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

  salvarFoto(): void {
    const foto = this.previewFoto();
    const p = this.pessoa();
    if (!foto || !p) return;

    this.novaFotoDataUrl.set(foto);
    this.fecharModalFoto();
  }

  salvarFotoNoPessoa(): void {
    const p = this.pessoa();
    const novaFoto = this.novaFotoDataUrl();
    if (!p || !novaFoto) return;

    this.salvando.set(true);
    this.salvoComSucesso.set(false);
    this.erro.set('');

    const fotoBase64 = this.dataUrlToBase64(novaFoto);

    const body = {
      id: p.id,
      nomeCompleto: p.nomeCompleto,
      email: p.email,
      telefone: p.telefone,
      endereco: p.endereco,
      cpf: p.cpf,
      foto: fotoBase64,
      predio: p.predio,
      andar: p.andar,
    };

    this.atualizarPessoaUseCase.execute(p.id, body).subscribe({
      next: (updated) => {
        this.pessoa.set(updated);
        this.novaFotoDataUrl.set('');
        this.salvando.set(false);
        this.salvoComSucesso.set(true);
        setTimeout(() => this.salvoComSucesso.set(false), 3000);
      },
      error: () => {
        this.salvando.set(false);
        this.erro.set('Erro ao salvar a foto.');
      },
    });
  }

  private dataUrlToBase64(dataUrl: string): string {
    const parts = dataUrl.split(',');
    return parts.length >= 2 ? parts[1] : '';
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
}
