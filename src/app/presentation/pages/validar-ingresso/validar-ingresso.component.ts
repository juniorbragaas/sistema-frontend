import {
  Component, signal, inject, OnInit, OnDestroy, AfterViewChecked,
  ElementRef, ViewChild, NgZone, PLATFORM_ID, ChangeDetectorRef
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
export class ValidarIngressoComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('videoEl', { static: false }) videoEl?: ElementRef<HTMLVideoElement>;

  private http     = inject(HttpClient);
  private ngZone   = inject(NgZone);
  private platform = inject(PLATFORM_ID);
  private cdr      = inject(ChangeDetectorRef);

  // ─── Estado ──────────────────────────────────────────────────────────────────
  etapa              = signal<Etapa>('scanner');
  ingresso           = signal<Ingresso | null>(null);
  erroMsg            = signal('');
  validando          = signal(false);
  validadoOk         = signal(false);
  camerasDisponiveis = signal<MediaDeviceInfo[]>([]);
  cameraAtualId      = signal<string>('');

  // Controle interno do scanner
  private codeReader: any = null;
  private scannerAtivo    = false;
  private aguardandoVideo = false; // flag: precisa conectar câmera quando o <video> aparecer
  private BrowserMultiFormatReader: any = null; // classe guardada para reuso

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    if (isPlatformBrowser(this.platform)) {
      this.carregarBibliotecaEIniciar();
    }
  }

  ngOnDestroy(): void {
    this.destruirScanner();
  }

  /**
   * AfterViewChecked é chamado toda vez que o Angular termina de verificar a view.
   * Usamos para detectar quando o <video> aparece no DOM após mudar a etapa para 'scanner'.
   */
  ngAfterViewChecked(): void {
    if (this.aguardandoVideo && this.videoEl?.nativeElement) {
      this.aguardandoVideo = false;
      // Executa fora do ciclo de detecção para não causar ExpressionChangedAfterItHasBeenChecked
      setTimeout(() => this.conectarCamera(this.cameraAtualId() || undefined), 0);
    }
  }

  // ─── Inicialização ───────────────────────────────────────────────────────────

  private async carregarBibliotecaEIniciar(): Promise<void> {
    try {
      const mod = await import('@zxing/browser');
      this.BrowserMultiFormatReader = mod.BrowserMultiFormatReader;

      // Lista câmeras uma única vez
      const cameras = await this.BrowserMultiFormatReader.listVideoInputDevices();
      this.camerasDisponiveis.set(cameras);

      const traseira = cameras.find((c: MediaDeviceInfo) =>
        /back|traseira|rear|environment/i.test(c.label)
      );
      const cameraId = traseira?.deviceId ?? cameras[0]?.deviceId ?? '';
      this.cameraAtualId.set(cameraId);

      this.iniciarNovoScanner();
    } catch (err) {
      console.error('Erro ao carregar biblioteca de QR Code:', err);
      this.etapa.set('erro');
      this.erroMsg.set('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
  }

  /**
   * Cria uma nova instância do codeReader e sinaliza que precisa do <video>.
   * Chamado tanto na inicialização quanto em "Nova Leitura".
   */
  private iniciarNovoScanner(): void {
    this.destruirScanner();

    if (!this.BrowserMultiFormatReader) return;

    this.codeReader  = new this.BrowserMultiFormatReader();
    this.scannerAtivo = true;
    this.etapa.set('scanner');

    // Se o <video> já está no DOM, conecta direto; senão aguarda o AfterViewChecked
    if (this.videoEl?.nativeElement) {
      setTimeout(() => this.conectarCamera(this.cameraAtualId() || undefined), 0);
    } else {
      this.aguardandoVideo = true;
      this.cdr.detectChanges(); // força o Angular a renderizar o <video>
    }
  }

  // ─── Scanner ─────────────────────────────────────────────────────────────────

  private async conectarCamera(deviceId?: string): Promise<void> {
    if (!this.codeReader || !this.videoEl?.nativeElement || !this.scannerAtivo) return;

    try {
      await this.codeReader.decodeFromVideoDevice(
        deviceId || undefined,
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
    // Recria o scanner com a nova câmera
    this.iniciarNovoScanner();
  }

  /**
   * Para o scanner atual e libera a câmera.
   * Não destrói a classe — use destruirScanner() para isso.
   */
  private pararScanner(): void {
    this.scannerAtivo    = false;
    this.aguardandoVideo = false;
    try { this.codeReader?.reset(); } catch { /* ignore */ }
  }

  /**
   * Para o scanner E descarta o codeReader completamente.
   * Necessário antes de criar uma nova instância.
   */
  private destruirScanner(): void {
    this.pararScanner();
    this.codeReader = null;
  }

  // ─── Leitura do QR ───────────────────────────────────────────────────────────

  private onQrLido(texto: string): void {
    if (!this.scannerAtivo) return;

    // Para o scanner imediatamente para não processar múltiplas leituras
    this.pararScanner();

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
   * Reinicia tudo do zero: limpa o estado e cria um novo scanner.
   */
  novaLeitura(): void {
    this.ingresso.set(null);
    this.erroMsg.set('');
    this.validadoOk.set(false);
    // iniciarNovoScanner cuida de destruir o anterior, mudar a etapa e aguardar o <video>
    this.iniciarNovoScanner();
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
