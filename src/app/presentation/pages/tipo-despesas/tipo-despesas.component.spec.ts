import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TipoDespesasComponent } from './tipo-despesas.component';
import { ListarDespesasUseCase } from '../../../core/usecases/listar-despesas.usecase';
import { Despesa } from '../../../core/models/despesa.model';

const MOCK: Despesa[] = [
  { id: 1, nome: 'Água', descricao: '', valor: 0, data: '', tipo: '' },
  { id: 2, nome: 'Energia', descricao: '', valor: 0, data: '', tipo: '' },
];

describe('TipoDespesasComponent', () => {
  let listar: jasmine.SpyObj<ListarDespesasUseCase>;

  beforeEach(async () => {
    listar = jasmine.createSpyObj('ListarDespesasUseCase', ['execute']);
    listar.execute.and.returnValue(of(MOCK));

    await TestBed.configureTestingModule({
      imports: [TipoDespesasComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ListarDespesasUseCase, useValue: listar },
      ],
    }).compileComponents();
  });

  it('deve criar o componente', () => {
    const f = TestBed.createComponent(TipoDespesasComponent);
    expect(f.componentInstance).toBeTruthy();
  });

  it('deve carregar despesas no init', () => {
    const f = TestBed.createComponent(TipoDespesasComponent);
    f.detectChanges();
    expect(f.componentInstance.despesas().length).toBe(2);
  });

  it('colunas devem ser definidas após carregar dados', () => {
    const f = TestBed.createComponent(TipoDespesasComponent);
    f.detectChanges();
    expect(f.componentInstance.colunas()).toContain('id');
    expect(f.componentInstance.colunas()).toContain('nome');
  });

  it('filtro deve reduzir resultados', () => {
    const f = TestBed.createComponent(TipoDespesasComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.onFiltroChange('nome', 'água');
    expect(comp.dadosFiltrados().length).toBe(1);
  });

  it('onInserir deve abrir modal', () => {
    const f = TestBed.createComponent(TipoDespesasComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.onInserir();
    expect(comp.modalAberto()).toBeTrue();
    expect(comp.modalAcao()).toBe('inserir');
    expect(comp.formNome()).toBe('');
  });

  it('fecharModal deve resetar estado', () => {
    const f = TestBed.createComponent(TipoDespesasComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.onInserir();
    comp.fecharModal();
    expect(comp.modalAberto()).toBeFalse();
  });
});
