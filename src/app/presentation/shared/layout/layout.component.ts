import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { BarraPrincipalComponent } from '../barra-principal/barra-principal.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { AuthPort } from '../../../core/ports/auth.port';
import { AppConfigService } from '../../../core/services/app-config.service';
import { LogoutUseCase } from '../../../core/usecases/logout.usecase';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, BarraPrincipalComponent, BreadcrumbComponent],
  styleUrl: './layout.component.css',
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnInit, OnDestroy {
  private authPort = inject(AuthPort);
  private logoutUseCase = inject(LogoutUseCase);
  private router = inject(Router);
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  sidebarCollapsed = signal(false);
  homeMenuOpen = signal(true);
  pessoasMenuOpen = signal(false);
  financeiroMenuOpen = signal(false);
  configMenuOpen = signal(false);
  tempoRestante = signal('');
  private appConfig = inject(AppConfigService);
  appName = this.appConfig.appName;

  ngOnInit(): void {
    this.updateTimer();
    this.timerInterval = setInterval(() => this.updateTimer(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleHomeMenu(event: Event): void {
    event.preventDefault();
    this.homeMenuOpen.update(v => !v);
  }

  togglePessoasMenu(event: Event): void {
    event.preventDefault();
    this.pessoasMenuOpen.update(v => !v);
  }

  toggleFinanceiroMenu(event: Event): void {
    event.preventDefault();
    this.financeiroMenuOpen.update(v => !v);
  }

  toggleConfigMenu(event: Event): void {
    event.preventDefault();
    this.configMenuOpen.update(v => !v);
  }

  private updateTimer(): void {
    const expiresAt = this.authPort.getSessionExpiresAt();
    if (!expiresAt) {
      this.tempoRestante.set('');
      return;
    }
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
