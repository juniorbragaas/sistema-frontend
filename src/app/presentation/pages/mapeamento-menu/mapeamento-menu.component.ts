import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListarMenusUseCase }   from '../../../core/usecases/listar-menus.usecase';
import { CriarMenuUseCase }     from '../../../core/usecases/criar-menu.usecase';
import { AtualizarMenuUseCase } from '../../../core/usecases/atualizar-menu.usecase';
import { ExcluirMenuUseCase }   from '../../../core/usecases/excluir-menu.usecase';
import { MenuApi }              from '../../../core/models/menu.model';
import { AppConfigService }     from '../../../core/services/app-config.service';
import { MenuStateService }     from '../../../core/services/menu-state.service';
import { PageTitleComponent }   from '../../shared/page-title/page-title.component';
import { CrudButtonsComponent } from '../../shared/crud-buttons/crud-buttons.component';

type ModalAcao = 'inserir' | 'visualizar' | 'alterar' | 'excluir' | null;

export interface MenuNode extends MenuApi {
  filhos: MenuNode[];
  nivel: number;
  expandido: boolean;
}

@Component({
  selector: 'app-mapeamento-menu',
  standalone: true,
  imports: [FormsModule, PageTitleComponent, CrudButtonsComponent],
  templateUrl: './mapeamento-menu.component.html',
  styleUrl:    './mapeamento-menu.component.css',
})
export class MapeamentoMenuComponent implements OnInit {
  private listarMenusUseCase   = inject(ListarMenusUseCase);
  private criarMenuUseCase     = inject(CriarMenuUseCase);
  private atualizarMenuUseCase = inject(AtualizarMenuUseCase);
  private excluirMenuUseCase   = inject(ExcluirMenuUseCase);
  private menuState            = inject(MenuStateService);
  cfg = inject(AppConfigService);

  menus   = signal<MenuApi[]>([]);
  loading = signal(false);
  erro    = signal('');

  // Mapa de nós para controle de expansão (id → expandido)
  expandidos = signal<Record<string, boolean>>({});

  // Modal
  modalAberto     = signal(false);
  modalAcao       = signal<ModalAcao>(null);
  itemSelecionado = signal<MenuApi | null>(null);
  formId    = signal<string | null>(null);
  formNome  = signal('');
  formUrl   = signal('');
  formIdPai = signal('');

  // ── Árvore ──────────────────────────────────────────────────────────────────

  /** Constrói a árvore hierárquica a partir da lista plana */
  arvore = computed<MenuNode[]>(() => {
    const todos = this.menus();
    const exp   = this.expandidos();

    const buildNode = (item: MenuApi, nivel: number): MenuNode => ({
      ...item,
      nivel,
      expandido: exp[item.id] !== false, // expandido por padrão
      filhos: [],
    });

    const mapa = new Map<string, MenuNode>();
    todos.forEach(m => mapa.set(m.id, buildNode(m, 0)));

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
  });

  /** Lista plana ordenada hierarquicamente para renderização */
  linhas = computed<MenuNode[]>(() => {
    const result: MenuNode[] = [];
    const flatten = (nodes: MenuNode[]) => {
      for (const n of nodes) {
        result.push(n);
        if (n.expandido && n.filhos.length > 0) {
          flatten(n.filhos);
        }
      }
    };
    flatten(this.arvore());
    return result;
  });

  // ── Computed auxiliares ──────────────────────────────────────────────────────

  modalTitulo = computed(() => {
    switch (this.modalAcao()) {
      case 'inserir':    return 'Inserir Novo Menu';
      case 'visualizar': return 'Visualizar Menu';
      case 'alterar':    return 'Alterar Menu';
      case 'excluir':    return 'Excluir Menu';
      default:           return '';
    }
  });

  somenteLeitura = computed(() =>
    this.modalAcao() === 'visualizar' || this.modalAcao() === 'excluir'
  );

  menusPai = computed(() => {
    const id = this.formId();
    // Exclui o próprio item e todos os seus descendentes para evitar ciclos
    const descendentes = this.getDescendentes(id);
    return this.menus().filter(m => m.id !== id && !descendentes.has(m.id));
  });

  nomePai(idPai: string | null): string {
    if (!idPai) return '— Nenhum (raiz) —';
    return this.menus().find(m => m.id === idPai)?.nome ?? idPai;
  }

  temFilhos(node: MenuNode): boolean {
    return node.filhos.length > 0;
  }

  iconeNo(node: MenuNode): string {
    if (!this.temFilhos(node)) return '📄';
    return node.expandido ? '📂' : '📁';
  }

  // ── Expansão ─────────────────────────────────────────────────────────────────

  toggleExpandir(node: MenuNode): void {
    if (!this.temFilhos(node)) return;
    this.expandidos.update(e => ({ ...e, [node.id]: !node.expandido }));
  }

  expandirTodos(): void {
    const todos: Record<string, boolean> = {};
    this.menus().forEach(m => todos[m.id] = true);
    this.expandidos.set(todos);
  }

  recolherTodos(): void {
    const todos: Record<string, boolean> = {};
    this.menus().forEach(m => todos[m.id] = false);
    this.expandidos.set(todos);
  }

  // ── Ciclo de vida ─────────────────────────────────────────────────────────────

  ngOnInit(): void { this.carregarDados(); }

  carregarDados(): void {
    this.loading.set(true);
    this.erro.set('');
    this.listarMenusUseCase.execute().subscribe({
      next: (dados) => {
        this.menus.set(dados);
        // Preserva estado de expansão dos nós já existentes,
        // expande por padrão apenas os novos
        this.expandidos.update(exp => {
          const novo: Record<string, boolean> = {};
          dados.forEach(m => {
            novo[m.id] = exp[m.id] !== undefined ? exp[m.id] : true;
          });
          return novo;
        });
        // Atualiza também o menu lateral com os dados mais recentes
        this.menuState.setMenus(dados);
        this.loading.set(false);
      },
      error: () => { this.erro.set('Erro ao carregar dados.'); this.loading.set(false); },
    });
  }

  // ── Modal ─────────────────────────────────────────────────────────────────────

  private preencherForm(item: MenuApi | null): void {
    this.formId.set(item?.id ?? null);
    this.formNome.set(item?.nome ?? '');
    this.formUrl.set(item?.url ?? '');
    this.formIdPai.set(item?.idPai ?? '');
  }

  onInserir(paiId?: string): void {
    this.itemSelecionado.set(null);
    this.preencherForm(null);
    if (paiId) this.formIdPai.set(paiId);
    this.modalAcao.set('inserir');
    this.modalAberto.set(true);
  }

  onVisualizar(item: MenuApi): void {
    this.itemSelecionado.set(item);
    this.preencherForm(item);
    this.modalAcao.set('visualizar');
    this.modalAberto.set(true);
  }

  onAlterar(item: MenuApi): void {
    this.itemSelecionado.set(item);
    this.preencherForm(item);
    this.modalAcao.set('alterar');
    this.modalAberto.set(true);
  }

  onExcluir(item: MenuApi): void {
    this.itemSelecionado.set(item);
    this.preencherForm(item);
    this.modalAcao.set('excluir');
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    this.modalAberto.set(false);
    this.modalAcao.set(null);
    this.itemSelecionado.set(null);
    this.erro.set('');
  }

  confirmarModal(): void {
    const acao = this.modalAcao();
    const id   = this.formId();

    if (!acao) return;

    // Body enviado ao C# — campos em camelCase, .NET deserializa automaticamente
    const body: Partial<MenuApi> = {
      id:    id ?? undefined,
      nome:  this.formNome().trim(),
      url:   this.formUrl().trim() || '#',
      idPai: this.formIdPai() || null,
    };

    if (acao === 'inserir') {
      // POST /api/Menus
      const { id: _id, ...bodyPost } = body as MenuApi;
      this.criarMenuUseCase.execute(bodyPost).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: (err) => {
          console.error('POST /api/Menus falhou', err);
          this.erro.set('Erro ao criar menu. Verifique os dados e tente novamente.');
        },
      });
      return;
    }

    if (acao === 'alterar' && id) {
      // PUT /api/Menus/{id}  — body inclui id para o C# validar
      this.atualizarMenuUseCase.execute(id, body).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: (err) => {
          console.error(`PUT /api/Menus/${id} falhou`, err);
          this.erro.set('Erro ao atualizar menu. Verifique os dados e tente novamente.');
        },
      });
      return;
    }

    if (acao === 'excluir' && id) {
      // DELETE /api/Menus/{id}
      this.excluirMenuUseCase.execute(id).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: (err) => {
          console.error(`DELETE /api/Menus/${id} falhou`, err);
          this.erro.set('Erro ao excluir menu. O item pode ter dependências.');
        },
      });
    }
  }

  // ── Utilitários ───────────────────────────────────────────────────────────────

  /** Retorna o conjunto de IDs de todos os descendentes de um nó (público para o template) */
  getDescendentes_pub(id: string | null): Set<string> {
    return this.getDescendentes(id);
  }

  /** Retorna o conjunto de IDs de todos os descendentes de um nó */
  private getDescendentes(id: string | null): Set<string> {
    const result = new Set<string>();
    if (!id) return result;
    const visitar = (nodeId: string) => {
      this.menus()
        .filter(m => m.idPai === nodeId)
        .forEach(m => { result.add(m.id); visitar(m.id); });
    };
    visitar(id);
    return result;
  }
}
