import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MapeamentoMenuComponent } from './mapeamento-menu.component';
import { ListarMenusUseCase } from '../../../core/usecases/listar-menus.usecase';
import { CriarMenuUseCase } from '../../../core/usecases/criar-menu.usecase';
import { AtualizarMenuUseCase } from '../../../core/usecases/atualizar-menu.usecase';
import { ExcluirMenuUseCase } from '../../../core/usecases/excluir-menu.usecase';
import { MenuApi } from '../../../core/models/menu.model';
import { MenuStateService } from '../../../core/services/menu-state.service';

const MOCK_MENUS: MenuApi[] = [
  { id: 'm1', nome: 'Home', url: '/home', idPai: null, icone: null },
  { id: 'm2', nome: 'Configurações', url: '#', idPai: 'm1', icone: null },
  { id: 'm3', nome: 'Perfis', url: '/perfis', idPai: 'm2', icone: null },
];

describe('MapeamentoMenuComponent', () => {
  let listar: jasmine.SpyObj<ListarMenusUseCase>;
  let criar: jasmine.SpyObj<CriarMenuUseCase>;
  let atualizar: jasmine.SpyObj<AtualizarMenuUseCase>;
  let excluir: jasmine.SpyObj<ExcluirMenuUseCase>;

  beforeEach(async () => {
    listar   = jasmine.createSpyObj('ListarMenusUseCase', ['execute']);
    criar    = jasmine.createSpyObj('CriarMenuUseCase', ['execute']);
    atualizar = jasmine.createSpyObj('AtualizarMenuUseCase', ['execute']);
    excluir  = jasmine.createSpyObj('ExcluirMenuUseCase', ['execute']);
    listar.execute.and.returnValue(of(MOCK_MENUS));

    await TestBed.configureTestingModule({
      imports: [MapeamentoMenuComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        MenuStateService,
        { provide: ListarMenusUseCase,   useValue: listar },
        { provide: CriarMenuUseCase,     useValue: criar },
        { provide: AtualizarMenuUseCase, useValue: atualizar },
        { provide: ExcluirMenuUseCase,   useValue: excluir },
      ],
    }).compileComponents();
  });

  it('deve criar o componente', () => {
    const f = TestBed.createComponent(MapeamentoMenuComponent);
    expect(f.componentInstance).toBeTruthy();
  });

  it('deve carregar menus no init', () => {
    const f = TestBed.createComponent(MapeamentoMenuComponent);
    f.detectChanges();
    expect(f.componentInstance.menus().length).toBe(3);
  });

  it('árvore deve ter apenas raízes no nível 0', () => {
    const f = TestBed.createComponent(MapeamentoMenuComponent);
    f.detectChanges();
    const raizes = f.componentInstance.arvore();
    expect(raizes.length).toBe(1);
    expect(raizes[0].nome).toBe('Home');
  });

  it('nó com filhos deve ser identificado corretamente', () => {
    const f = TestBed.createComponent(MapeamentoMenuComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    const raiz = comp.arvore()[0];
    expect(comp.temFilhos(raiz)).toBeTrue();
  });

  it('nomePai deve retornar nome correto', () => {
    const f = TestBed.createComponent(MapeamentoMenuComponent);
    f.detectChanges();
    expect(f.componentInstance.nomePai('m1')).toBe('Home');
  });

  it('nomePai deve retornar raiz para null', () => {
    const f = TestBed.createComponent(MapeamentoMenuComponent);
    f.detectChanges();
    expect(f.componentInstance.nomePai(null)).toBe('— Nenhum (raiz) —');
  });

  it('onInserir com paiId deve pré-preencher formIdPai', () => {
    const f = TestBed.createComponent(MapeamentoMenuComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.onInserir('m1');
    expect(comp.formIdPai()).toBe('m1');
    expect(comp.modalAcao()).toBe('inserir');
  });

  it('expandirTodos deve marcar todos como expandidos', () => {
    const f = TestBed.createComponent(MapeamentoMenuComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.expandirTodos();
    MOCK_MENUS.forEach(m => {
      expect(comp.expandidos()[m.id]).toBeTrue();
    });
  });

  it('recolherTodos deve marcar todos como recolhidos', () => {
    const f = TestBed.createComponent(MapeamentoMenuComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.recolherTodos();
    MOCK_MENUS.forEach(m => {
      expect(comp.expandidos()[m.id]).toBeFalse();
    });
  });
});
