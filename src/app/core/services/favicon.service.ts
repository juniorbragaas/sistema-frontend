import { Injectable, inject, effect } from '@angular/core';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class FaviconService {
  private appConfig = inject(AppConfigService);

  constructor() {
    // Atualizar favicon quando o ícone do sistema mudar
    effect(() => {
      const icon = this.appConfig.appIcon();
      if (icon) {
        this.updateFavicon(icon);
      }
    });
  }

  /**
   * Atualiza o favicon da página
   * @param iconUrl URL do ícone (data URL ou caminho)
   */
  private updateFavicon(iconUrl: string): void {
    try {
      const link = document.getElementById('favicon') as HTMLLinkElement;
      if (link) {
        link.href = iconUrl;
      }
    } catch (error) {
      console.error('Erro ao atualizar favicon:', error);
    }
  }
}
