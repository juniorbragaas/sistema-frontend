import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TipoGastosComponent } from './tipo-gastos.component';
import { ListarTipoGastosUseCase } from '../../../core/usecases/listar-tipo-gastos.usecase';
import { CriarTipoGastoUseCase } from '../../../core/usecases/criar-tipo-gasto.usecase';
import { AtualizarTipoGastoUseCase } from '../../../core/usecases/atualizar-tipo-gasto.usecase';
import { ExcluirTipoGastoUseCase } from '../../../core/usecases/excluir-tipo-gasto.usecase';
import { TipoGasto } from '../../../core/models/tipo-gasto.model';

const MOCK_DADOS: TipoGasto[] = [
  { id: 1, nome: 'Água' },
  { id: 2, nome: 'Energia' },
  { id: 3, nome: 'Condomínio' },
];

describe('TipoGastosComponent', () => {
  let listar: jasmine.SpyObj<ListarTipoGastosUseCase>;
  let criar: jasmine.SpyObj<CriarTipoGastoUseCase>;
  let atualizar: jasmine.SpyObj<AtualizarTipoGastoUseCase>;
  let excluir: jasmine.SpyObj<ExcluirTipoGastoUseCase>;

  beforeEach(async () => {
    listar    = jasmine.createSpyObj('ListarTipoGastosUseCase', ['execute']);
    criar     = jasmine.createSpyObj('CriarTipoGastoUseCase', ['execute']);
    atualizar = jasmine.createSpyObj('AtualizarTipoGastoUseCase', ['execute']);
    excluir   = jasmine.createSpyObj('ExcluirTipoGastoUseCase', ['execute']);
    listar.execute.and.returnValue(of(MOCK_DADOS));

    await TestBed.configureTestingModule({
      imports: [TipoGastosComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ListarTipoGastosUseCase, useValue: listar },
        { provide: CriarTipoGastoUseCase,    useValue: criar },
        { provide: AtualizarTipoGastoUseCase, useValue: atualizar },
        { provide: ExcluirTipoGastoUseCase,  useValue: excluir },
      ],
    }).compileComponents();
  });

  it('deve criar o componente', () => {
    const fixture = TestBed.createComponent(TipoGastosComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('deve carregar dados no ngOnInit', () => {
    const fixture = TestBed.createComponent(TipoGastosComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.tipoGastos().length).toBe(3);
  });

  it('filtro por nome deve reduzir resultados', () => {
    const fixture = TestBed.createComponent(TipoGastosComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.onFiltroChange('nome', 'água');
    expect(comp.dadosFiltrados().length).toBe(1);
    expect(comp.dadosFiltrados()[0].nome).toBe('Água');
  });

  it('ordenação ascendente por nome', () => {
    const fixture = TestBed.createComponent(TipoGastosComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.ordenarPor('nome');
    const nomes = comp.dadosFiltrados().map(d => d.nome);
    expect(nomes).toEqual([...nomes].sort());
  });

  it('ordenação descendente ao clicar duas vezes', () => {
    const fixture = TestBed.createComponent(TipoGastosComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.ordenarPor('nome');
    comp.ordenarPor('nome');
    expect(comp.sortDirecao()).toBe('desc');
  });

  it('onInserir deve abrir modal com ação inserir', () => {
    const fixture = TestBed.createComponent(TipoGastosComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.onInserir();
    expect(comp.modalAberto()).toBeTrue();
    expect(comp.modalAcao()).toBe('inserir');
  });

  it('fecharModal deve limpar estado', () => {
    const fixture = TestBed.createComponent(TipoGastosComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.onInserir();
    comp.fecharModal();
    expect(comp.modalAberto()).toBeFalse();
    expect(comp.modalAcao()).toBeNull();
  });

  it('paginação deve limitar itens por página', () => {
    const fixture = TestBed.createComponent(TipoGastosComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.itensPorPagina.set(2);
    expect(comp.dadosPaginados().length).toBe(2);
    expect(comp.totalPaginas()).toBe(2);
  });
});
