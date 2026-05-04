import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PessoasComponent } from './pessoas.component';
import { ListarPessoasUseCase } from '../../../core/usecases/listar-pessoas.usecase';
import { AtualizarPessoaUseCase } from '../../../core/usecases/atualizar-pessoa.usecase';
import { CriarPessoaUseCase } from '../../../core/usecases/criar-pessoa.usecase';
import { PessoaApi } from '../../../core/models/pessoa-api.model';

const MOCK: PessoaApi[] = [
  { id: 'p1', nomeCompleto: 'Administrador', email: 'a@a.com', telefone: '', endereco: '', cpf: '111', foto: '', predio: 'A', andar: '1' },
  { id: 'p2', nomeCompleto: 'João Silva', email: 'j@j.com', telefone: '', endereco: '', cpf: '222', foto: '', predio: 'B', andar: '2' },
];

describe('PessoasComponent', () => {
  let listar: jasmine.SpyObj<ListarPessoasUseCase>;
  let atualizar: jasmine.SpyObj<AtualizarPessoaUseCase>;
  let criar: jasmine.SpyObj<CriarPessoaUseCase>;

  beforeEach(async () => {
    listar   = jasmine.createSpyObj('ListarPessoasUseCase', ['execute']);
    atualizar = jasmine.createSpyObj('AtualizarPessoaUseCase', ['execute']);
    criar    = jasmine.createSpyObj('CriarPessoaUseCase', ['execute']);
    listar.execute.and.returnValue(of(MOCK));

    await TestBed.configureTestingModule({
      imports: [PessoasComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ListarPessoasUseCase,   useValue: listar },
        { provide: AtualizarPessoaUseCase, useValue: atualizar },
        { provide: CriarPessoaUseCase,     useValue: criar },
      ],
    }).compileComponents();
  });

  it('deve criar o componente', () => {
    const f = TestBed.createComponent(PessoasComponent);
    expect(f.componentInstance).toBeTruthy();
  });

  it('deve carregar pessoas no init', () => {
    const f = TestBed.createComponent(PessoasComponent);
    f.detectChanges();
    expect(f.componentInstance.pessoas().length).toBe(2);
  });

  it('isPessoaProtegida deve retornar true para Administrador', () => {
    const f = TestBed.createComponent(PessoasComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    expect(comp.isPessoaProtegida(MOCK[0])).toBeTrue();
    expect(comp.isPessoaProtegida(MOCK[1])).toBeFalse();
  });

  it('onExcluir não deve abrir modal para Administrador', () => {
    const f = TestBed.createComponent(PessoasComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.onExcluir(MOCK[0]);
    expect(comp.modalAberto()).toBeFalse();
    expect(comp.erro()).toContain('protegido');
  });

  it('filtro por nomeCompleto deve funcionar', () => {
    const f = TestBed.createComponent(PessoasComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.onFiltroChange('nomeCompleto', 'joão');
    expect(comp.dadosFiltrados().length).toBe(1);
  });

  it('ordenação deve funcionar', () => {
    const f = TestBed.createComponent(PessoasComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.ordenarPor('nomeCompleto');
    expect(comp.sortColuna()).toBe('nomeCompleto');
    expect(comp.sortDirecao()).toBe('asc');
  });
});
