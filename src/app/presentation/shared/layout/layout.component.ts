import { Component, signal, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { BarraPrincipalComponent } from '../barra-principal/barra-principal.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { AuthPort } from '../../../core/ports/auth.port';
import { AppConfigService } from '../../../core/services/app-config.service';
import { MenuStateService, MenuNode } from '../../../core/services/menu-state.service';
import { MenuSyncService } from '../../../core/services/menu-sync.service';
import { LogoutUseCase } from '../../../core/usecases/logout.usecase';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NgTemplateOutlet, BarraPrincipalComponent, BreadcrumbComponent],
  styleUrl: './layout.component.css',
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnInit, OnDestroy {
  private authPort      = inject(AuthPort);
  private logoutUseCase = inject(LogoutUseCase);
  private router        = inject(Router);
  private appConfig     = inject(AppConfigService);
  private menuSync      = inject(MenuSyncService);
  readonly menuState    = inject(MenuStateService);

  private timerInterval: ReturnType<typeof setInterval> | null = null;

  sidebarCollapsed = signal(false);
  tempoRestante    = signal('');

  appName        = this.appConfig.appName;
  sidebarBgColor  = this.appConfig.sidebarBgColor;
  sidebarTextColor = this.appConfig.sidebarTextColor;

  /** Árvore de menus vinda do MenuStateService */
  arvore = this.menuState.arvore;

  ngOnInit(): void {
    // Carrega os menus após o login — o LayoutComponent só é instanciado
    // dentro da rota protegida pelo authGuard, então o usuário já está autenticado
    this.menuSync.sincronizar();
    this.updateTimer();
    this.timerInterval = setInterval(() => this.updateTimer(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  isExpandido(id: string): boolean {
    return this.menuState.isExpandido(id);
  }

  toggleNode(event: Event, node: MenuNode): void {
    event.preventDefault();
    this.menuState.toggle(node.id);
  }

  temFilhos(node: MenuNode): boolean {
    return node.filhos.length > 0;
  }

  navegar(event: Event, url: string): void {
    if (url === '#') {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    this.router.navigate([url]);
  }

  /** Converte hex string salvo no banco para data URL usável em <img src> */
  hexToDataUrl(hex: string | null): string {
    if (!hex) return '';
    if (hex.startsWith('data:')) return hex;
    try {
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
      }
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
      const isSvg = hex.startsWith('3c73') || hex.startsWith('3c3f');
      const mime  = isPng ? 'image/png' : isSvg ? 'image/svg+xml' : 'image/x-icon';
      let binary = '';
      bytes.forEach(b => binary += String.fromCharCode(b));
      return `data:${mime};base64,${btoa(binary)}`;
    } catch {
      return '';
    }
  }

  /** Ícone padrão (emoji) quando não há imagem no banco */
  iconeDefault(node: MenuNode): string {
    return this.temFilhos(node) ? '📁' : '📄';
  }

  private updateTimer(): void {
    const expiresAt = this.authPort.getSessionExpiresAt();
    if (!expiresAt) { this.tempoRestante.set(''); return; }

    const diff = expiresAt - Date.now();
    if (diff <= 0) {
      this.tempoRestante.set('00:00');
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.logoutUseCase.execute();
      this.router.navigate(['/login']);
      return;
    }
    const min = Math.floor(diff / 60000);
    const sec = Math.floor((diff % 60000) / 1000);
    this.tempoRestante.set(
      `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    );
  }
}
