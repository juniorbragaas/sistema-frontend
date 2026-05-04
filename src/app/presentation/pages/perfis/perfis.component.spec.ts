import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PerfisComponent } from './perfis.component';
import { ListarPerfisUseCase } from '../../../core/usecases/listar-perfis.usecase';
import { CriarPerfilUseCase } from '../../../core/usecases/criar-perfil.usecase';
import { AtualizarPerfilUseCase } from '../../../core/usecases/atualizar-perfil.usecase';
import { ExcluirPerfilUseCase } from '../../../core/usecases/excluir-perfil.usecase';
import { Perfil } from '../../../core/models/perfil.model';

const MOCK: Perfil[] = [
  { id: 'id-1', nome: 'Administradores' },
  { id: 'id-2', nome: 'Usuários' },
];

describe('PerfisComponent', () => {
  let listar: jasmine.SpyObj<ListarPerfisUseCase>;
  let criar: jasmine.SpyObj<CriarPerfilUseCase>;
  let atualizar: jasmine.SpyObj<AtualizarPerfilUseCase>;
  let excluir: jasmine.SpyObj<ExcluirPerfilUseCase>;

  beforeEach(async () => {
    listar    = jasmine.createSpyObj('ListarPerfisUseCase', ['execute']);
    criar     = jasmine.createSpyObj('CriarPerfilUseCase', ['execute']);
    atualizar = jasmine.createSpyObj('AtualizarPerfilUseCase', ['execute']);
    excluir   = jasmine.createSpyObj('ExcluirPerfilUseCase', ['execute']);
    listar.execute.and.returnValue(of(MOCK));

    await TestBed.configureTestingModule({
      imports: [PerfisComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ListarPerfisUseCase,    useValue: listar },
        { provide: CriarPerfilUseCase,     useValue: criar },
        { provide: AtualizarPerfilUseCase, useValue: atualizar },
        { provide: ExcluirPerfilUseCase,   useValue: excluir },
      ],
    }).compileComponents();
  });

  it('deve criar o componente', () => {
    const f = TestBed.createComponent(PerfisComponent);
    expect(f.componentInstance).toBeTruthy();
  });

  it('deve carregar perfis no init', () => {
    const f = TestBed.createComponent(PerfisComponent);
    f.detectChanges();
    expect(f.componentInstance.perfis().length).toBe(2);
  });

  it('filtro por nome deve funcionar', () => {
    const f = TestBed.createComponent(PerfisComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.onFiltroChange('nome', 'admin');
    expect(comp.dadosFiltrados().length).toBe(1);
  });

  it('onVisualizar deve abrir modal em modo visualizar', () => {
    const f = TestBed.createComponent(PerfisComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.onVisualizar(MOCK[0]);
    expect(comp.modalAcao()).toBe('visualizar');
    expect(comp.formNome()).toBe('Administradores');
  });

  it('onAlterar deve preencher form com dados do item', () => {
    const f = TestBed.createComponent(PerfisComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.onAlterar(MOCK[1]);
    expect(comp.formId()).toBe('id-2');
    expect(comp.formNome()).toBe('Usuários');
  });

  it('somenteLeitura deve ser true em visualizar e excluir', () => {
    const f = TestBed.createComponent(PerfisComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.onVisualizar(MOCK[0]);
    expect(comp.somenteLeitura()).toBeTrue();
    comp.fecharModal();
    comp.onExcluir(MOCK[0]);
    expect(comp.somenteLeitura()).toBeTrue();
  });

  it('somenteLeitura deve ser false em inserir e alterar', () => {
    const f = TestBed.createComponent(PerfisComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.onInserir();
    expect(comp.somenteLeitura()).toBeFalse();
  });
});
