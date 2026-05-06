import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListarUsuariosUseCase }  from '../../../core/usecases/listar-usuarios.usecase';
import { CriarUsuarioUseCase }    from '../../../core/usecases/criar-usuario.usecase';
import { AtualizarUsuarioUseCase } from '../../../core/usecases/atualizar-usuario.usecase';
import { ExcluirUsuarioUseCase }  from '../../../core/usecases/excluir-usuario.usecase';
import { ListarPessoasUseCase }   from '../../../core/usecases/listar-pessoas.usecase';
import { Usuario }                from '../../../core/models/usuario.model';
import { PessoaApi }              from '../../../core/models/pessoa-api.model';
import { AppConfigService }       from '../../../core/services/app-config.service';
import { PageTitleComponent }     from '../../shared/page-title/page-title.component';
import { CrudButtonsComponent }   from '../../shared/crud-buttons/crud-buttons.component';

import { CpfMaskDirective } from '../../shared/directives/cpf-mask.directive';
import { EmailMaskDirective } from '../../shared/directives/email-mask.directive';
import { AppTableDirective } from '../../shared/app-table/app-table.directive';

type ModalAcao = 'inserir' | 'visualizar' | 'alterar' | 'excluir' | 'reset-senha' | null;

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormsModule, PageTitleComponent, CrudButtonsComponent, EmailMaskDirective, AppTableDirective],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css',
})
export class UsuariosComponent implements OnInit {
  private listarUseCase    = inject(ListarUsuariosUseCase);
  private criarUseCase     = inject(CriarUsuarioUseCase);
  private atualizarUseCase = inject(AtualizarUsuarioUseCase);
  private excluirUseCase   = inject(ExcluirUsuarioUseCase);
  private listarPessoasUseCase = inject(ListarPessoasUseCase);
  cfg = inject(AppConfigService);

  usuarios     = signal<Usuario[]>([]);
  pessoas      = signal<PessoaApi[]>([]);  // lista para o dropdown
  loading      = signal(false);
  erro         = signal('');
  colunas      = signal<string[]>(['id', 'nome', 'email', 'dataCriacao']);
  filtros      = signal<Record<string, string>>({});
  sortColuna   = signal('');
  sortDirecao  = signal<'asc' | 'desc'>('asc');
  paginaAtual  = signal(1);
  itensPorPagina = signal(10);

  // Modal
  modalAberto     = signal(false);
  modalAcao       = signal<ModalAcao>(null);
  itemSelecionado = signal<Usuario | null>(null);
  formId          = signal<string | null>(null);
  formNome        = signal('');
  formEmail       = signal('');
  formSenha       = signal('');
  formIdPessoa    = signal('');
  formDataCriacao = signal('');

  modalTitulo = computed(() => {
    switch (this.modalAcao()) {
      case 'inserir':     return 'Inserir Novo Usuário';
      case 'visualizar':  return 'Visualizar Usuário';
      case 'alterar':     return 'Alterar Usuário';
      case 'excluir':     return 'Excluir Usuário';
      case 'reset-senha': return 'Reset de Senha';
      default:            return '';
    }
  });

  somenteLeitura = computed(() =>
    this.modalAcao() === 'visualizar' || this.modalAcao() === 'excluir'
  );

  dadosFiltrados = computed(() => {
    const dados = this.usuarios();
    const f = this.filtros();
    const col = this.sortColuna();
    const dir = this.sortDirecao();
    const filtrados = dados.filter(item =>
      Object.keys(f).every(c => {
        const filtro = f[c]?.toLowerCase() ?? '';
        if (!filtro) return true;
        return String(item[c] ?? '').toLowerCase().includes(filtro);
      })
    );
    if (!col) return filtrados;
    return [...filtrados].sort((a, b) => {
      const va = String(a[col] ?? '').toLowerCase();
      const vb = String(b[col] ?? '').toLowerCase();
      return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  });

  dadosPaginados = computed(() => {
    const filtrados = this.dadosFiltrados();
    const inicio = (this.paginaAtual() - 1) * this.itensPorPagina();
    return filtrados.slice(inicio, inicio + this.itensPorPagina());
  });

  totalPaginas = computed(() =>
    Math.ceil(this.dadosFiltrados().length / this.itensPorPagina()) || 1
  );

  ngOnInit(): void { this.carregarDados(); }

  carregarDados(): void {
    this.loading.set(true);
    this.erro.set('');

    // Carrega pessoas primeiro (para o dropdown), depois usuários
    this.listarPessoasUseCase.execute().subscribe({
      next: (pessoas) => {
        this.pessoas.set(pessoas);
        this.listarUseCase.execute().subscribe({
          next: (dados) => { this.usuarios.set(dados); this.loading.set(false); },
          error: () => { this.erro.set('Erro ao carregar usuários.'); this.loading.set(false); },
        });
      },
      error: () => {
        // Se falhar ao carregar pessoas, ainda carrega usuários
        this.listarUseCase.execute().subscribe({
          next: (dados) => { this.usuarios.set(dados); this.loading.set(false); },
          error: () => { this.erro.set('Erro ao carregar dados.'); this.loading.set(false); },
        });
      },
    });
  }

  /** Retorna o nome completo da pessoa pelo id, ou o próprio id se não encontrar */
  nomePessoa(idPessoa: string | null): string {
    if (!idPessoa) return '— Nenhuma —';
    return this.pessoas().find(p => p.id === idPessoa)?.nomeCompleto ?? idPessoa;
  }

  onFiltroChange(coluna: string, valor: string): void {
    this.filtros.update(f => ({ ...f, [coluna]: valor }));
    this.paginaAtual.set(1);
  }

  ordenarPor(coluna: string): void {
    if (this.sortColuna() === coluna) {
      this.sortDirecao.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColuna.set(coluna);
      this.sortDirecao.set('asc');
    }
    this.paginaAtual.set(1);
  }

  iconeSort(coluna: string): string {
    if (this.sortColuna() !== coluna) return '↕';
    return this.sortDirecao() === 'asc' ? '▲' : '▼';
  }

  irParaPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) this.paginaAtual.set(pagina);
  }

  private preencherForm(item: Usuario | null): void {
    this.formId.set(item?.id ?? null);
    this.formNome.set(item?.nome ?? '');
    this.formEmail.set(item?.email ?? '');
    this.formSenha.set(''); // senha nunca pré-preenchida por segurança
    this.formIdPessoa.set(item?.idPessoa ?? '');
    this.formDataCriacao.set(item?.dataCriacao ?? '');
  }

  onInserir(): void {
    this.itemSelecionado.set(null);
    this.preencherForm(null);
    this.modalAcao.set('inserir');
    this.modalAberto.set(true);
  }

  onVisualizar(item: Usuario): void {
    this.itemSelecionado.set(item);
    this.preencherForm(item);
    this.modalAcao.set('visualizar');
    this.modalAberto.set(true);
  }

  onAlterar(item: Usuario): void {
    this.itemSelecionado.set(item);
    this.preencherForm(item);
    this.modalAcao.set('alterar');
    this.modalAberto.set(true);
  }

  /** Registros protegidos que não podem ser excluídos */
  private readonly NOMES_PROTEGIDOS_USUARIO = ['admin'];

  isUsuarioProtegido(item: Usuario): boolean {
    return this.NOMES_PROTEGIDOS_USUARIO.includes(
      (item.nome ?? '').toLowerCase().trim()
    );
  }

  onExcluir(item: Usuario): void {
    if (this.isUsuarioProtegido(item)) {
      this.erro.set('O usuário "admin" é protegido e não pode ser excluído.');
      return;
    }
    this.itemSelecionado.set(item);
    this.preencherForm(item);
    this.modalAcao.set('excluir');
    this.modalAberto.set(true);
  }

  onResetSenha(item: Usuario): void {
    this.itemSelecionado.set(item);
    this.preencherForm(item);
    this.modalAcao.set('reset-senha');
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

    // POST /api/Usuarios — senha obrigatória na criação
    if (acao === 'inserir') {
      const body: Partial<Usuario> = {
        nome:       this.formNome().trim(),
        email:      this.formEmail().trim(),
        senha:      this.formSenha(),
        idPessoa:   this.formIdPessoa() || null,
        dataCriacao: new Date().toISOString(),
      };
      this.criarUseCase.execute(body).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: (err) => {
          console.error('POST /api/Usuarios falhou', err);
          this.erro.set('Erro ao criar usuário. Verifique os dados.');
        },
      });
      return;
    }

    // PUT /api/Usuarios/{id} — senha vazia = mantém a senha atual (não enviada no body)
    if (acao === 'alterar' && id) {
      const body: Partial<Usuario> = {
        id,
        nome:        this.formNome().trim(),
        email:       this.formEmail().trim(),
        idPessoa:    this.formIdPessoa() || null,
        dataCriacao: this.formDataCriacao(),
      };

      // Só inclui senha no body se o usuário digitou uma nova
      if (this.formSenha().trim()) {
        body['senha'] = this.formSenha();
      }

      this.atualizarUseCase.execute(id, body).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: (err) => {
          console.error(`PUT /api/Usuarios/${id} falhou`, err);
          this.erro.set('Erro ao atualizar usuário. Verifique os dados.');
        },
      });
      return;
    }

    // DELETE /api/Usuarios/{id}
    if (acao === 'excluir' && id) {
      this.excluirUseCase.execute(id).subscribe({
        next: () => { this.fecharModal(); this.carregarDados(); },
        error: (err) => {
          console.error(`DELETE /api/Usuarios/${id} falhou`, err);
          this.erro.set('Erro ao excluir usuário.');
        },
      });
    }

    // PUT /api/Usuarios/{id} — reset senha para valor padrão '123456'
    if (acao === 'reset-senha' && id) {
      const item = this.itemSelecionado()!;
      const body: Partial<Usuario> = {
        id,
        nome:        item.nome,
        email:       item.email,
        senha:       '123456',
        idPessoa:    item.idPessoa,
        dataCriacao: item.dataCriacao,
      };
      this.atualizarUseCase.execute(id, body).subscribe({
        next: () => { this.fecharModal(); },
        error: (err) => {
          console.error(`PUT /api/Usuarios/${id} reset-senha falhou`, err);
          this.erro.set('Erro ao resetar senha. Tente novamente.');
        },
      });
    }
  }

  /** Formata data ISO para exibição */
  formatarData(data: string): string {
    if (!data) return '';
    try {
      return new Date(data).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return data; }
  }
}
