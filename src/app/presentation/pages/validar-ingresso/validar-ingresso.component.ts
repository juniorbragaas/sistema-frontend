import {
  Component, signal, inject, OnInit, OnDestroy,
  ElementRef, ViewChild, NgZone, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
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
  private router   = inject(Router);

  // ─── Estado ───────────────────────────────────────────────────────────────
  etapa              = signal<Etapa>('scanner');
  ingresso           = signal<Ingresso | null>(null);
  erroMsg            = signal('');
  validando          = signal(false);
  modalSucessoAberto = signal(false);
  camerasDisponiveis = signal<MediaDeviceInfo[]>([]);
  cameraAtualId      = signal<string>('');

  private codeReader: any = null;
  private scannerAtivo    = false;

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    if (isPlatformBrowser(this.platform)) {
      this.iniciar();
    }
  }

  ngOnDestroy(): void {
    this.pararStream();
  }

  // ─── Inicialização ────────────────────────────────────────────────────────

  private async iniciar(): Promise<void> {
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');

      const cameras = await BrowserMultiFormatReader.listVideoInputDevices();
      this.camerasDisponiveis.set(cameras);

      const traseira = cameras.find((c: MediaDeviceInfo) =>
        /back|traseira|rear|environment/i.test(c.label)
      );
      const cameraId = traseira?.deviceId ?? cameras[0]?.deviceId ?? '';
      this.cameraAtualId.set(cameraId);

      // Aguarda o <video> estar no DOM
      setTimeout(() => this.conectar(BrowserMultiFormatReader, cameraId), 300);

    } catch (err) {
      console.error('Erro ao iniciar câmera:', err);
      this.etapa.set('erro');
      this.erroMsg.set('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
  }

  private async conectar(BrowserMultiFormatReader: any, deviceId: string): Promise<void> {
    const video = this.videoEl?.nativeElement;
    if (!video) {
      setTimeout(() => this.conectar(BrowserMultiFormatReader, deviceId), 100);
      return;
    }

    try {
      this.codeReader  = new BrowserMultiFormatReader();
      this.scannerAtivo = true;

      await this.codeReader.decodeFromVideoDevice(
        deviceId || undefined,
        video,
        (result: any) => {
          if (result && this.scannerAtivo) {
            this.ngZone.run(() => this.onQrLido(result.getText()));
          }
        }
      );
    } catch (err: any) {
      console.error('Erro ao conectar câmera:', err);
      this.ngZone.run(() => {
        this.etapa.set('erro');
        this.erroMsg.set('Erro ao acessar a câmera. Tente recarregar a página.');
      });
    }
  }

  private pararStream(): void {
    this.scannerAtivo = false;
    try { this.codeReader?.reset(); } catch { /* ignore */ }
    this.codeReader = null;
    const video = this.videoEl?.nativeElement;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
  }

  trocarCamera(deviceId: string): void {
    this.cameraAtualId.set(deviceId);
    this.refresh();
  }

  // ─── Leitura ──────────────────────────────────────────────────────────────

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
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuid.test(texto.trim())) return texto.trim();
    return null;
  }

  // ─── API ──────────────────────────────────────────────────────────────────

  private buscarIngresso(id: string): void {
    this.etapa.set('carregando');
    this.http.get<Ingresso>(`${API_URL}/${id}`).subscribe({
      next: (ing) => {
        this.ingresso.set(ing);
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
    this.http.put<Ingresso>(`${API_URL}/${ing.id}`, { ...ing, status: 1 }).subscribe({
      next: () => {
        this.validando.set(false);
        this.modalSucessoAberto.set(true);
        // Fecha a modal e reinicia após 3 segundos
        setTimeout(() => {
          this.modalSucessoAberto.set(false);
          this.refresh();
        }, 3000);
      },
      error: () => {
        this.validando.set(false);
        this.erroMsg.set('Erro ao validar ingresso. Tente novamente.');
      },
    });
  }

  // ─── Navegação ────────────────────────────────────────────────────────────

  /** Faz reload real da rota destruindo e recriando o componente */
  refresh(): void {
    this.pararStream();
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/validar-ingresso']);
    });
  }

  novaLeitura(): void {
    this.refresh();
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
