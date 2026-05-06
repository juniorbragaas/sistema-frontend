import {
  Component, signal, inject, OnInit, OnDestroy,
  ElementRef, ViewChild, NgZone, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Ingresso, STATUS_INGRESSO } from '../../../core/models/ingresso.model';

type Etapa = 'scanner' | 'carregando' | 'resultado' | 'erro';

const API_URL = 'https://localhost:7116/api/Ingressos';

@Component({
  selector: 'app-validar-ingresso',
  standalone: true,
  imports: [],
  templateUrl: './validar-ingresso.component.html',
  styleUrl: './validar-ingresso.component.css',
})
export class ValidarIngressoComponent implements OnInit, OnDestroy {
  @ViewChild('videoEl', { static: false }) videoEl?: ElementRef<HTMLVideoElement>;

  private http     = inject(HttpClient);
  private ngZone   = inject(NgZone);
  private platform = inject(PLATFORM_ID);

  // ─── Estado público ───────────────────────────────────────────────────────
  etapa              = signal<Etapa>('scanner');
  ingresso           = signal<Ingresso | null>(null);
  erroMsg            = signal('');
  validando          = signal(false);
  validadoOk         = signal(false);
  camerasDisponiveis = signal<MediaDeviceInfo[]>([]);
  cameraAtualId      = signal<string>('');

  /**
   * Controla se o elemento <video> está no DOM.
   * Ao setar false → Angular remove o <video> → ao setar true → Angular recria do zero.
   * Isso garante que o ZXing sempre recebe um elemento limpo, sem stream antigo.
   */
  videoVisivel = signal(false);

  // ─── Estado interno ───────────────────────────────────────────────────────
  private codeReader: any = null;
  private scannerAtivo    = false;
  private BrowserMultiFormatReader: any = null;

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    if (isPlatformBrowser(this.platform)) {
      this.carregarBibliotecaEIniciar();
    }
  }

  ngOnDestroy(): void {
    this.pararStream();
  }

  // ─── Inicialização ────────────────────────────────────────────────────────

  private async carregarBibliotecaEIniciar(): Promise<void> {
    try {
      const mod = await import('@zxing/browser');
      this.BrowserMultiFormatReader = mod.BrowserMultiFormatReader;

      const cameras = await this.BrowserMultiFormatReader.listVideoInputDevices();
      this.camerasDisponiveis.set(cameras);

      const traseira = cameras.find((c: MediaDeviceInfo) =>
        /back|traseira|rear|environment/i.test(c.label)
      );
      const cameraId = traseira?.deviceId ?? cameras[0]?.deviceId ?? '';
      this.cameraAtualId.set(cameraId);

      this.etapa.set('scanner');
      this.montarVideo();
    } catch (err) {
      console.error('Erro ao carregar câmera:', err);
      this.etapa.set('erro');
      this.erroMsg.set('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
  }

  /**
   * Ciclo completo de montagem do scanner:
   * 1. Para qualquer stream ativo
   * 2. Remove o <video> do DOM (videoVisivel = false)
   * 3. Aguarda 1 tick para o Angular processar a remoção
   * 4. Reinsere o <video> (videoVisivel = true)
   * 5. Aguarda 2 ticks para o Angular criar o elemento
   * 6. Conecta a câmera no elemento recém-criado
   */
  private montarVideo(): void {
    this.pararStream();
    this.videoVisivel.set(false);

    // Tick 1: Angular remove o <video>
    setTimeout(() => {
      this.videoVisivel.set(true);

      // Tick 2: Angular cria o novo <video>
      setTimeout(() => {
        this.iniciarLeitura();
      }, 80);
    }, 80);
  }

  private iniciarLeitura(): void {
    if (!this.BrowserMultiFormatReader) return;

    const videoNativo = this.videoEl?.nativeElement;
    if (!videoNativo) {
      // Elemento ainda não disponível — tenta mais uma vez
      setTimeout(() => this.iniciarLeitura(), 100);
      return;
    }

    this.codeReader  = new this.BrowserMultiFormatReader();
    this.scannerAtivo = true;

    const deviceId = this.cameraAtualId() || undefined;

    this.codeReader.decodeFromVideoDevice(
      deviceId,
      videoNativo,
      (result: any, _err: any) => {
        if (result && this.scannerAtivo) {
          this.ngZone.run(() => this.onQrLido(result.getText()));
        }
      }
    ).catch((err: any) => {
      console.error('Erro ao conectar câmera:', err);
      this.ngZone.run(() => {
        this.etapa.set('erro');
        this.erroMsg.set('Erro ao acessar a câmera. Tente recarregar a página.');
      });
    });
  }

  // ─── Controle do stream ───────────────────────────────────────────────────

  private pararStream(): void {
    this.scannerAtivo = false;
    try { this.codeReader?.reset(); } catch { /* ignore */ }
    this.codeReader = null;

    // Para as tracks do MediaStream diretamente no elemento <video>
    const video = this.videoEl?.nativeElement;
    if (video?.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
  }

  // ─── Troca de câmera ──────────────────────────────────────────────────────

  trocarCamera(deviceId: string): void {
    this.cameraAtualId.set(deviceId);
    this.montarVideo();
  }

  // ─── Leitura do QR ────────────────────────────────────────────────────────

  private onQrLido(texto: string): void {
    if (!this.scannerAtivo) return;
    this.pararStream();

    const id = this.extrairId(texto);
    if (!id) {
      this.etapa.set('erro');
      this.erroMsg.set('QR Code inválido. Este código não pertence a um ingresso do sistema.');
      return;
    }

    this.buscarIngresso(id);
  }

  private extrairId(texto: string): string | null {
    const match = texto.match(/ID:\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (match) return match[1];

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(texto.trim())) return texto.trim();

    return null;
  }

  // ─── API ──────────────────────────────────────────────────────────────────

  private buscarIngresso(id: string): void {
    this.etapa.set('carregando');
    this.http.get<Ingresso>(`${API_URL}/${id}`).subscribe({
      next: (ing) => {
        this.ingresso.set(ing);
        this.validadoOk.set(false);
        this.etapa.set('resultado');
      },
      error: () => {
        this.etapa.set('erro');
        this.erroMsg.set('Ingresso não encontrado. Verifique se o QR Code é válido.');
      },
    });
  }

  validarIngresso(): void {
    const ing = this.ingresso();
    if (!ing || ing.status === 1) return;

    this.validando.set(true);
    const payload: Ingresso = { ...ing, status: 1 };

    this.http.put<Ingresso>(`${API_URL}/${ing.id}`, payload).subscribe({
      next: (atualizado) => {
        this.ingresso.set(atualizado);
        this.validadoOk.set(true);
        this.validando.set(false);
      },
      error: () => {
        this.validando.set(false);
        this.erroMsg.set('Erro ao validar ingresso. Tente novamente.');
      },
    });
  }

  /**
   * Reinicia completamente: limpa dados e remonta o scanner do zero.
   */
  novaLeitura(): void {
    this.ingresso.set(null);
    this.erroMsg.set('');
    this.validadoOk.set(false);
    this.etapa.set('scanner');
    this.montarVideo();
  }

  // ─── Formatação ───────────────────────────────────────────────────────────

  formatarData(valor: string): string {
    if (!valor) return '';
    try {
      return new Date(valor).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return valor; }
  }

  formatarDataSomente(valor: string): string {
    if (!valor) return '';
    try {
      return new Date(valor).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
    } catch { return valor; }
  }

  labelStatus(status: number): string {
    return STATUS_INGRESSO[status] ?? String(status);
  }
}
