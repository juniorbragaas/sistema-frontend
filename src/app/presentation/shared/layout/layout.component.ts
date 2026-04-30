import { Component, signal, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { BarraPrincipalComponent } from '../barra-principal/barra-principal.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { AuthPort } from '../../../core/ports/auth.port';
import { AppConfigService } from '../../../core/services/app-config.service';
import { MenuStateService, MenuNode } from '../../../core/services/menu-state.service';
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
