import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { UsuariosComponent } from './usuarios.component';
import { ListarUsuariosUseCase } from '../../../core/usecases/listar-usuarios.usecase';
import { CriarUsuarioUseCase } from '../../../core/usecases/criar-usuario.usecase';
import { AtualizarUsuarioUseCase } from '../../../core/usecases/atualizar-usuario.usecase';
import { ExcluirUsuarioUseCase } from '../../../core/usecases/excluir-usuario.usecase';
import { ListarPessoasUseCase } from '../../../core/usecases/listar-pessoas.usecase';
import { Usuario } from '../../../core/models/usuario.model';

const MOCK_USUARIOS: Usuario[] = [
  { id: 'u1', nome: 'admin', email: 'admin@test.com', senha: '', dataCriacao: '2026-01-01', idPessoa: null },
  { id: 'u2', nome: 'joao', email: 'joao@test.com', senha: '', dataCriacao: '2026-02-01', idPessoa: null },
];

describe('UsuariosComponent', () => {
  let listar: jasmine.SpyObj<ListarUsuariosUseCase>;
  let criar: jasmine.SpyObj<CriarUsuarioUseCase>;
  let atualizar: jasmine.SpyObj<AtualizarUsuarioUseCase>;
  let excluir: jasmine.SpyObj<ExcluirUsuarioUseCase>;
  let listarPessoas: jasmine.SpyObj<ListarPessoasUseCase>;

  beforeEach(async () => {
    listar       = jasmine.createSpyObj('ListarUsuariosUseCase', ['execute']);
    criar        = jasmine.createSpyObj('CriarUsuarioUseCase', ['execute']);
    atualizar    = jasmine.createSpyObj('AtualizarUsuarioUseCase', ['execute']);
    excluir      = jasmine.createSpyObj('ExcluirUsuarioUseCase', ['execute']);
    listarPessoas = jasmine.createSpyObj('ListarPessoasUseCase', ['execute']);
    listar.execute.and.returnValue(of(MOCK_USUARIOS));
    listarPessoas.execute.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [UsuariosComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ListarUsuariosUseCase,  useValue: listar },
        { provide: CriarUsuarioUseCase,    useValue: criar },
        { provide: AtualizarUsuarioUseCase, useValue: atualizar },
        { provide: ExcluirUsuarioUseCase,  useValue: excluir },
        { provide: ListarPessoasUseCase,   useValue: listarPessoas },
      ],
    }).compileComponents();
  });

  it('deve criar o componente', () => {
    const f = TestBed.createComponent(UsuariosComponent);
    expect(f.componentInstance).toBeTruthy();
  });

  it('deve carregar usuários no init', () => {
    const f = TestBed.createComponent(UsuariosComponent);
    f.detectChanges();
    expect(f.componentInstance.usuarios().length).toBe(2);
  });

  it('filtro por nome deve funcionar', () => {
    const f = TestBed.createComponent(UsuariosComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.onFiltroChange('nome', 'joao');
    expect(comp.dadosFiltrados().length).toBe(1);
  });

  it('isUsuarioProtegido deve retornar true para admin', () => {
    const f = TestBed.createComponent(UsuariosComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    expect(comp.isUsuarioProtegido(MOCK_USUARIOS[0])).toBeTrue();
    expect(comp.isUsuarioProtegido(MOCK_USUARIOS[1])).toBeFalse();
  });

  it('onExcluir não deve abrir modal para usuário protegido', () => {
    const f = TestBed.createComponent(UsuariosComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.onExcluir(MOCK_USUARIOS[0]);
    expect(comp.modalAberto()).toBeFalse();
    expect(comp.erro()).toContain('protegido');
  });

  it('onExcluir deve abrir modal para usuário não protegido', () => {
    const f = TestBed.createComponent(UsuariosComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.onExcluir(MOCK_USUARIOS[1]);
    expect(comp.modalAberto()).toBeTrue();
    expect(comp.modalAcao()).toBe('excluir');
  });

  it('formatarData deve retornar string vazia para entrada vazia', () => {
    const f = TestBed.createComponent(UsuariosComponent);
    expect(f.componentInstance.formatarData('')).toBe('');
  });

  it('ordenação deve alternar direção ao clicar na mesma coluna', () => {
    const f = TestBed.createComponent(UsuariosComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.ordenarPor('nome');
    expect(comp.sortDirecao()).toBe('asc');
    comp.ordenarPor('nome');
    expect(comp.sortDirecao()).toBe('desc');
  });
});
