import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { MenuApi } from '../models/menu.model';
import { MenuPort } from '../ports/menu.port';
import { MenuStateService } from './menu-state.service';
import { routes } from '../../app.routes';
import { Route } from '@angular/router';

interface BreadcrumbItem { label: string; url?: string; }

@Injectable({ providedIn: 'root' })
export class MenuSyncService {
  private menuPort   = inject(MenuPort);
  private menuState  = inject(MenuStateService);
  private platformId = inject(PLATFORM_ID);

  /**
   * Chamado no APP_INITIALIZER:
   * 1. Busca menus existentes via GET /api/Menus
   * 2. Compara com as rotas registradas no app.routes.ts
   * 3. Insere via POST /api/Menus os itens ainda não cadastrados
   * 4. Atualiza o MenuStateService com a lista final
   */
  async sincronizar(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      // 1. GET /api/Menus — lista todos os menus existentes
      const existentes = await firstValueFrom(this.menuPort.listar());

      // 2. Extrai rotas navegáveis dos breadcrumbs do app.routes.ts
      const rotasRegistradas = this.extrairRotas(routes);

      // 3. Insere via POST /api/Menus os que ainda não existem (por URL)
      const urlsExistentes = new Set(existentes.map(m => m.url));
      const acumulado: MenuApi[] = [...existentes];

      for (const rota of rotasRegistradas) {
        if (urlsExistentes.has(rota.url)) continue;

        try {
          const idPai = this.resolverIdPai(rota.labelPai, acumulado);
          // POST /api/Menus — body: { nome, url, idPai }
          const novo = await firstValueFrom(
            this.menuPort.criar({ nome: rota.label, url: rota.url, idPai })
          );
          acumulado.push(novo);
          urlsExistentes.add(novo.url);
        } catch {
          // Ignora falhas individuais (API offline, duplicata, etc.)
        }
      }

      // 4. Atualiza o estado global do menu lateral
      this.menuState.setMenus(acumulado);

    } catch {
      // API inacessível — menu lateral fica vazio mas o app não quebra
      this.menuState.setMenus([]);
    }
  }

  /**
   * Recarrega os menus da API e atualiza o MenuStateService.
   * Chamado após operações CRUD na tela de Mapeamento de Menu.
   */
  async recarregar(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const menus = await firstValueFrom(this.menuPort.listar());
      this.menuState.setMenus(menus);
    } catch {
      // Mantém estado atual em caso de erro
    }
  }

  // ── Extração de rotas ──────────────────────────────────────────────────────

  private extrairRotas(routeList: Route[]): Array<{
    label: string;
    url: string;
    labelPai: string | null;
  }> {
    const resultado: Array<{ label: string; url: string; labelPai: string | null }> = [];

    const percorrer = (lista: Route[]) => {
      for (const r of lista) {
        const breadcrumbs: BreadcrumbItem[] = r.data?.['breadcrumbs'] ?? [];

        breadcrumbs.forEach((crumb, idx) => {
          if (crumb.url) {
            const anterior = breadcrumbs[idx - 1] ?? null;
            resultado.push({
              label:    crumb.label,
              url:      crumb.url,
              labelPai: anterior?.label ?? null,
            });
          }
        });

        if (r.children?.length) percorrer(r.children);
      }
    };

    percorrer(routeList);

    // Remove duplicatas por URL
    const visto = new Set<string>();
    return resultado.filter(r => {
      if (visto.has(r.url)) return false;
      visto.add(r.url);
      return true;
    });
  }

  // ── Resolução de pai ───────────────────────────────────────────────────────

  private resolverIdPai(labelPai: string | null, menus: MenuApi[]): string | null {
    if (!labelPai) return null;
    return menus.find(m => m.nome === labelPai)?.id ?? null;
  }
}
