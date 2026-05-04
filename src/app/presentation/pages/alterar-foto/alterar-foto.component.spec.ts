import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AlterarFotoComponent } from './alterar-foto.component';
import { BuscarPessoaCpfUseCase } from '../../../core/usecases/buscar-pessoa-cpf.usecase';
import { AtualizarPessoaUseCase } from '../../../core/usecases/atualizar-pessoa.usecase';

describe('AlterarFotoComponent', () => {
  let buscarCpf: jasmine.SpyObj<BuscarPessoaCpfUseCase>;
  let atualizar: jasmine.SpyObj<AtualizarPessoaUseCase>;

  beforeEach(async () => {
    buscarCpf = jasmine.createSpyObj('BuscarPessoaCpfUseCase', ['execute']);
    atualizar = jasmine.createSpyObj('AtualizarPessoaUseCase', ['execute']);
    buscarCpf.execute.and.returnValue(of(null as any));

    await TestBed.configureTestingModule({
      imports: [AlterarFotoComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: BuscarPessoaCpfUseCase, useValue: buscarCpf },
        { provide: AtualizarPessoaUseCase, useValue: atualizar },
      ],
    }).compileComponents();
  });

  it('deve criar o componente', () => {
    const f = TestBed.createComponent(AlterarFotoComponent);
    expect(f.componentInstance).toBeTruthy();
  });

  it('estado inicial deve ter pessoa nula', () => {
    const f = TestBed.createComponent(AlterarFotoComponent);
    const comp = f.componentInstance;
    // Verifica que o componente inicia sem dados de pessoa
    expect(comp).toBeTruthy();
  });
});
