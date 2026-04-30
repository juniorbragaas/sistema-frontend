import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MenuApi } from '../models/menu.model';

export interface MenuNode extends MenuApi {
  filhos: MenuNode[];
  nivel: number;
}

@Injectable({ providedIn: 'root' })
export class MenuStateService {
  private platformId = inject(PLATFORM_ID);

  /** Lista plana vinda da API */
  private _menus = signal<MenuApi[]>([]);

  /** Mapa de nós expandidos (id → boolean) */
  private _expandidos = signal<Record<string, boolean>>({});

  readonly menus = this._menus.asReadonly();

  /** Árvore hierárquica computada */
  readonly arvore = computed<MenuNode[]>(() => this.buildTree(this._menus()));

  /** Verifica se um nó está expandido */
  isExpandido(id: string): boolean {
    return this._expandidos()[id] !== false; // expandido por padrão
  }

  setMenus(menus: MenuApi[]): void {
    this._menus.set(menus);
    // Expande tudo por padrão ao carregar
    const exp: Record<string, boolean> = {};
    menus.forEach(m => exp[m.id] = true);
    this._expandidos.set(exp);
  }

  toggle(id: string): void {
    this._expandidos.update(e => ({ ...e, [id]: !this.isExpandido(id) }));
  }

  private buildTree(menus: MenuApi[]): MenuNode[] {
    const mapa = new Map<string, MenuNode>();
    menus.forEach(m => mapa.set(m.id, { ...m, filhos: [], nivel: 0 }));

    const raizes: MenuNode[] = [];
    mapa.forEach(node => {
      if (node.idPai && mapa.has(node.idPai)) {
        const pai = mapa.get(node.idPai)!;
        node.nivel = pai.nivel + 1;
        pai.filhos.push(node);
      } else {
        raizes.push(node);
      }
    });

    return raizes;
  }
}
