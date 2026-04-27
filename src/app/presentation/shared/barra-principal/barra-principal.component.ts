import { Component, computed, inject, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthPort } from '../../../core/ports/auth.port';
import { LogoutUseCase } from '../../../core/usecases/logout.usecase';
import { AppConfigService } from '../../../core/services/app-config.service';

@Component({
  selector: 'app-barra-principal',
  standalone: true,
  imports: [RouterLink],
  styleUrl: './barra-principal.component.css',
  templateUrl: './barra-principal.component.html',
})
export class BarraPrincipalComponent {
  private authPort = inject(AuthPort);
  private logoutUseCase = inject(LogoutUseCase);
  private router = inject(Router);

  toggleSidebar = output<void>();
  private appConfig = inject(AppConfigService);
  appName = this.appConfig.appName;
  appIcon = this.appConfig.appIcon;
  barColor = this.appConfig.barColor;
  barTextColor = this.appConfig.barTextColor;
  nomeCompleto = computed(() => this.authPort.currentUser()?.pessoa.nomeCompleto ?? '');
  fotoUsuario = computed(() => {
    const foto = this.authPort.currentUser()?.pessoa.foto ?? '';
    if (!foto) return '';

    // Se já é uma data URL, retorna direto
    if (foto.startsWith('data:')) return foto;

    // Se já é base64 puro (não hex), monta a data URL
    if (/^[A-Za-z0-9+/=]+$/.test(foto) && foto.length > 100) {
      return `data:image/png;base64,${foto}`;
    }

    // Se é hexadecimal, converte para base64
    const cleanHex = foto.startsWith('0x') ? foto.slice(2) : foto;
    if (/^[0-9a-fA-F]+$/.test(cleanHex)) {
      return this.hexToDataUrl(cleanHex);
    }

    // Tenta usar como URL direta
    return foto;
  });

  private hexToDataUrl(hex: string): string {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
    }
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    const base64 = btoa(binary);
    return `data:image/png;base64,${base64}`;
  }

  onLogout(): void {
    this.logoutUseCase.execute();
    this.router.navigate(['/login']);
  }
}
