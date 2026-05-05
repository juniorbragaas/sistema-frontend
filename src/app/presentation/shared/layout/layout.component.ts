import { Component, signal, inject, OnInit, OnDestroy, computed, effect } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BarraPrincipalComponent } from '../barra-principal/barra-principal.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { AuthPort } from '../../../core/ports/auth.port';
import { AppConfigService } from '../../../core/services/app-config.service';
import { MenuStateService, MenuNode } from '../../../core/services/menu-state.service';
import { MenuSyncService } from '../../../core/services/menu-sync.service';
import { LogoutUseCase } from '../../../core/usecases/logout.usecase';

interface MenuItemBusca {
  nome: string;
  url: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NgTemplateOutlet, FormsModule, BarraPrincipalComponent, BreadcrumbComponent],
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
  termoBusca       = signal('');
  resultadosBusca  = signal<MenuItemBusca[]>([]);
  mostraBusca      = signal(false);
  todosItensMenu   = signal<MenuItemBusca[]>([]);
  itemSelecionado  = signal<number>(-1);

  appName        = this.appConfig.appName;
  sidebarBgColor  = this.appConfig.sidebarBgColor;
  sidebarTextColor = this.appConfig.sidebarTextColor;

  /** Árvore de menus vinda do MenuStateService */
  arvore = this.menuState.arvore;

  ngOnInit(): void {
    // Carrega os menus após o login - AGUARDA a sincronização
    this.menuSync.sincronizar().then(() => {
      console.log('Menus sincronizados com sucesso');
      // Carrega itens de busca após menus serem carregados
      this.carregarTodosItensMenu();
    }).catch(err => {
      console.error('Erro ao sincronizar menus:', err);
    });
    
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

  buscarMenu(): void {
    const termo = this.termoBusca().toLowerCase().trim();
    
    if (!termo) {
      this.resultadosBusca.set([]);
      this.mostraBusca.set(false);
      this.itemSelecionado.set(-1);
      return;
    }

    const resultados = this.todosItensMenu().filter(item =>
      item.nome.toLowerCase().includes(termo)
    );
    
    console.log('Termo buscado:', termo);
    console.log('Resultados encontrados:', resultados.length);
    console.log('Todos os itens:', this.todosItensMenu().length);
    console.log('Resultados:', resultados);
    
    this.resultadosBusca.set(resultados);
    this.mostraBusca.set(resultados.length > 0);
    this.itemSelecionado.set(-1);
  }

  private carregarTodosItensMenu(): void {
    const itens: MenuItemBusca[] = [];
    this.extrairItensMenu(this.arvore(), itens);
    console.log('Itens carregados:', itens);
    console.log('Árvore:', this.arvore());
    this.todosItensMenu.set(itens);
  }

  private extrairItensMenu(nodes: MenuNode[], itens: MenuItemBusca[]): void {
    for (const node of nodes) {
      console.log('Processando node:', node.nome, 'URL:', node.url, 'Filhos:', node.filhos?.length);
      
      // Adiciona o item atual se tiver URL válida
      if (node.url && node.url !== '#') {
        itens.push({
          nome: node.nome,
          url: node.url
        });
        console.log('Adicionado item:', node.nome, 'URL:', node.url);
      }
      
      // Se tem filhos, processa recursivamente
      if (node.filhos && node.filhos.length > 0) {
        this.extrairItensMenu(node.filhos, itens);
      }
    }
  }

  acessarMenuBuscado(item: MenuItemBusca): void {
    if (item.url && item.url !== '#') {
      this.router.navigate([item.url]);
    }
    this.termoBusca.set('');
    this.resultadosBusca.set([]);
    this.mostraBusca.set(false);
    this.itemSelecionado.set(-1);
  }

  fecharBusca(): void {
    this.mostraBusca.set(false);
  }

  fecharBuscaDelay(): void {
    // Aguarda um pouco para permitir que o clique no item seja processado
    setTimeout(() => {
      this.mostraBusca.set(false);
    }, 200);
  }

  selecionarItem(index: number): void {
    this.itemSelecionado.set(index);
  }

  acessarItemSelecionado(): void {
    const index = this.itemSelecionado();
    if (index >= 0 && index < this.resultadosBusca().length) {
      this.acessarMenuBuscado(this.resultadosBusca()[index]);
    }
  }

  navegarResultados(direcao: 'cima' | 'baixo'): void {
    const total = this.resultadosBusca().length;
    if (total === 0) return;

    let novoIndex = this.itemSelecionado();
    if (direcao === 'cima') {
      novoIndex = novoIndex <= 0 ? total - 1 : novoIndex - 1;
    } else {
      novoIndex = novoIndex >= total - 1 ? 0 : novoIndex + 1;
    }
    this.itemSelecionado.set(novoIndex);
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
