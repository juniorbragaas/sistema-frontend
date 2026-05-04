import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HomeComponent } from './home.component';
import { ListarPessoasUseCase } from '../../../core/usecases/listar-pessoas.usecase';
import { ListarConvidadosUseCase } from '../../../core/usecases/listar-convidados.usecase';
import { ListarReservasUseCase } from '../../../core/usecases/listar-reservas.usecase';
import { PessoaApi } from '../../../core/models/pessoa-api.model';
import { Reserva } from '../../../core/models/reserva.model';

const MOCK_PESSOAS: PessoaApi[] = [
  { id: 'p1', nomeCompleto: 'Ana', email: '', telefone: '', endereco: '', cpf: '', foto: '', predio: '', andar: '' },
  { id: 'p2', nomeCompleto: 'Bruno', email: '', telefone: '', endereco: '', cpf: '', foto: '', predio: '', andar: '' },
];

const HOJE = new Date();
const HOJE_ISO = `${HOJE.getFullYear()}-${String(HOJE.getMonth()+1).padStart(2,'0')}-${String(HOJE.getDate()).padStart(2,'0')}`;

const MOCK_RESERVAS: Reserva[] = [
  { id: 1, responsavel: 'Ana', data: HOJE_ISO, valor: 100, horaInicio: '08:00:00', horaFinal: '10:00:00', descricao: null },
];

describe('HomeComponent', () => {
  let listarPessoas: jasmine.SpyObj<ListarPessoasUseCase>;
  let listarConvidados: jasmine.SpyObj<ListarConvidadosUseCase>;
  let listarReservas: jasmine.SpyObj<ListarReservasUseCase>;

  beforeEach(async () => {
    listarPessoas   = jasmine.createSpyObj('ListarPessoasUseCase', ['execute']);
    listarConvidados = jasmine.createSpyObj('ListarConvidadosUseCase', ['execute']);
    listarReservas  = jasmine.createSpyObj('ListarReservasUseCase', ['execute']);
    listarPessoas.execute.and.returnValue(of(MOCK_PESSOAS));
    listarConvidados.execute.and.returnValue(of([]));
    listarReservas.execute.and.returnValue(of(MOCK_RESERVAS));

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ListarPessoasUseCase,   useValue: listarPessoas },
        { provide: ListarConvidadosUseCase, useValue: listarConvidados },
        { provide: ListarReservasUseCase,  useValue: listarReservas },
      ],
    }).compileComponents();
  });

  it('deve criar o componente', () => {
    const f = TestBed.createComponent(HomeComponent);
    expect(f.componentInstance).toBeTruthy();
  });

  it('deve carregar pessoas no init', () => {
    const f = TestBed.createComponent(HomeComponent);
    f.detectChanges();
    expect(f.componentInstance.pessoas().length).toBe(2);
  });

  it('deve carregar reservas no init', () => {
    const f = TestBed.createComponent(HomeComponent);
    f.detectChanges();
    expect(f.componentInstance.reservas().length).toBe(1);
  });

  it('filtro de pessoas deve funcionar', () => {
    const f = TestBed.createComponent(HomeComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.filtroPessoaNome.set('ana');
    expect(comp.pessoasFiltradas().length).toBe(1);
    expect(comp.pessoasFiltradas()[0].nomeCompleto).toBe('Ana');
  });

  it('calendário deve ter 42 células', () => {
    const f = TestBed.createComponent(HomeComponent);
    f.detectChanges();
    expect(f.componentInstance.diasCalendario().length).toBe(42);
  });

  it('dia de hoje deve ser marcado como diaAtual', () => {
    const f = TestBed.createComponent(HomeComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    const hoje = comp.diasCalendario().find(d => d.diaAtual);
    expect(hoje).toBeTruthy();
  });

  it('dia com reserva deve ter temReserva=true', () => {
    const f = TestBed.createComponent(HomeComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    const diaComReserva = comp.diasCalendario().find(d => d.temReserva);
    expect(diaComReserva).toBeTruthy();
    expect(diaComReserva!.qtdReservas).toBe(1);
  });

  it('abrirReservasDia deve abrir modal', () => {
    const f = TestBed.createComponent(HomeComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    const diaComReserva = comp.diasCalendario().find(d => d.temReserva)!;
    comp.abrirReservasDia(diaComReserva);
    expect(comp.modalReservasDiaAberto()).toBeTrue();
  });

  it('fecharModalReservasDia deve fechar modal', () => {
    const f = TestBed.createComponent(HomeComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.modalReservasDiaAberto.set(true);
    comp.fecharModalReservasDia();
    expect(comp.modalReservasDiaAberto()).toBeFalse();
  });

  it('isoDate deve formatar corretamente', () => {
    const f = TestBed.createComponent(HomeComponent);
    const comp = f.componentInstance;
    expect(comp.isoDate(new Date(2026, 4, 4))).toBe('2026-05-04');
  });
});
