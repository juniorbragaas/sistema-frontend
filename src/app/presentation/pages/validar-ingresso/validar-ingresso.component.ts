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
  @ViewChild('videoEl', { static: false }) videoEl!: ElementRef<HTMLVideoElement>;

  private http     = inject(HttpClient);
  private ngZone   = inject(NgZone);
  private platform = inject(PLATFORM_ID);

  // ─── Estado ──────────────────────────────────────────────────────────────────
  etapa          = signal<Etapa>('scanner');
  ingresso       = signal<Ingresso | null>(null);
  erroMsg        = signal('');
  validando      = signal(false);
  validadoOk     = signal(false);
  camerasDisponiveis = signal<MediaDeviceInfo[]>([]);
  cameraAtualId  = signal<string>('');

  private stream: MediaStream | null = null;
  private codeReader: any = null;
  private scannerAtivo = false;

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    if (isPlatformBrowser(this.platform)) {
      this.iniciarScanner();
    }
  }

  ngOnDestroy(): void {
    this.pararScanner();
  }

  // ─── Scanner ─────────────────────────────────────────────────────────────────

  async iniciarScanner(): Promise<void> {
    try {
      // Importação dinâmica para evitar problemas de SSR
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      this.codeReader = new BrowserMultiFormatReader();

      // Lista câmeras disponíveis
      const cameras = await BrowserMultiFormatReader.listVideoInputDevices();
      this.camerasDisponiveis.set(cameras);

      // Prefere câmera traseira em dispositivos móveis
      const traseira = cameras.find(c =>
        c.label.toLowerCase().includes('back') ||
        c.label.toLowerCase().includes('traseira') ||
        c.label.toLowerCase().includes('rear') ||
        c.label.toLowerCase().includes('environment')
      );
      const cameraId = traseira?.deviceId ?? cameras[0]?.deviceId ?? undefined;
      if (cameraId) this.cameraAtualId.set(cameraId);

      this.etapa.set('scanner');
      this.scannerAtivo = true;

      // Aguarda o DOM renderizar o elemento de vídeo
      setTimeout(() => this.conectarCamera(cameraId), 100);

    } catch (err: any) {
      console.error('Erro ao iniciar scanner:', err);
      this.etapa.set('erro');
      this.erroMsg.set('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
  }

  private async conectarCamera(deviceId?: string): Promise<void> {
    if (!this.codeReader || !this.videoEl?.nativeElement) return;

    try {
      await this.codeReader.decodeFromVideoDevice(
        deviceId,
        this.videoEl.nativeElement,
        (result: any, err: any) => {
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

  trocarCamera(deviceId: string): void {
    this.cameraAtualId.set(deviceId);
    this.pararScanner();
    setTimeout(() => {
      this.scannerAtivo = true;
      this.conectarCamera(deviceId);
    }, 300);
  }

  private pararScanner(): void {
    this.scannerAtivo = false;
    try { this.codeReader?.reset(); } catch { /* ignore */ }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  }

  // ─── Leitura do QR ───────────────────────────────────────────────────────────

  private onQrLido(texto: string): void {
    if (!this.scannerAtivo) return;
    this.pararScanner();

    // Extrai o ID do texto codificado no QR
    // Formato: "INGRESSO\nID: <uuid>\n..."
    const id = this.extrairId(texto);

    if (!id) {
      this.etapa.set('erro');
      this.erroMsg.set('QR Code inválido. Este código não pertence a um ingresso do sistema.');
      return;
    }

    this.buscarIngresso(id);
  }

  private extrairId(texto: string): string | null {
    // Tenta extrair "ID: <uuid>" do texto
    const match = texto.match(/ID:\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (match) return match[1];

    // Fallback: se o texto inteiro for um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(texto.trim())) return texto.trim();

    return null;
  }

  // ─── API ─────────────────────────────────────────────────────────────────────

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
    if (!ing) return;

    // Já utilizado
    if (ing.status === 1) return;

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

  novaLeitura(): void {
    this.ingresso.set(null);
    this.erroMsg.set('');
    this.validadoOk.set(false);
    this.etapa.set('scanner');
    this.scannerAtivo = true;
    setTimeout(() => this.conectarCamera(this.cameraAtualId() || undefined), 200);
  }

  // ─── Formatação ──────────────────────────────────────────────────────────────

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
