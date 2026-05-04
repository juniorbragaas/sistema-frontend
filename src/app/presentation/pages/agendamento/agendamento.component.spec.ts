import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AgendamentoComponent } from './agendamento.component';
import { ListarReservasUseCase } from '../../../core/usecases/listar-reservas.usecase';
import { CriarReservaUseCase } from '../../../core/usecases/criar-reserva.usecase';
import { AtualizarReservaUseCase } from '../../../core/usecases/atualizar-reserva.usecase';
import { ExcluirReservaUseCase } from '../../../core/usecases/excluir-reserva.usecase';
import { ListarPessoasUseCase } from '../../../core/usecases/listar-pessoas.usecase';
import { Reserva } from '../../../core/models/reserva.model';

const MOCK_RESERVAS: Reserva[] = [
  { id: 1, responsavel: 'João', data: '2026-05-10', valor: 100, horaInicio: '08:00:00', horaFinal: '10:00:00', descricao: null },
  { id: 2, responsavel: 'Maria', data: '2026-05-10', valor: 200, horaInicio: '14:00:00', horaFinal: '16:00:00', descricao: 'Reunião' },
  { id: 3, responsavel: 'Pedro', data: '2026-05-11', valor: 150, horaInicio: '09:00:00', horaFinal: '11:00:00', descricao: null },
];

describe('AgendamentoComponent', () => {
  let listar: jasmine.SpyObj<ListarReservasUseCase>;
  let criar: jasmine.SpyObj<CriarReservaUseCase>;
  let atualizar: jasmine.SpyObj<AtualizarReservaUseCase>;
  let excluir: jasmine.SpyObj<ExcluirReservaUseCase>;
  let listarPessoas: jasmine.SpyObj<ListarPessoasUseCase>;

  beforeEach(async () => {
    listar       = jasmine.createSpyObj('ListarReservasUseCase', ['execute']);
    criar        = jasmine.createSpyObj('CriarReservaUseCase', ['execute']);
    atualizar    = jasmine.createSpyObj('AtualizarReservaUseCase', ['execute']);
    excluir      = jasmine.createSpyObj('ExcluirReservaUseCase', ['execute']);
    listarPessoas = jasmine.createSpyObj('ListarPessoasUseCase', ['execute']);
    listar.execute.and.returnValue(of(MOCK_RESERVAS));
    listarPessoas.execute.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [AgendamentoComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ListarReservasUseCase,   useValue: listar },
        { provide: CriarReservaUseCase,     useValue: criar },
        { provide: AtualizarReservaUseCase, useValue: atualizar },
        { provide: ExcluirReservaUseCase,   useValue: excluir },
        { provide: ListarPessoasUseCase,    useValue: listarPessoas },
      ],
    }).compileComponents();
  });

  it('deve criar o componente', () => {
    const f = TestBed.createComponent(AgendamentoComponent);
    expect(f.componentInstance).toBeTruthy();
  });

  it('deve carregar reservas no init', () => {
    const f = TestBed.createComponent(AgendamentoComponent);
    f.detectChanges();
    expect(f.componentInstance.reservas().length).toBe(3);
  });

  it('sem dia selecionado deve mostrar todas as reservas', () => {
    const f = TestBed.createComponent(AgendamentoComponent);
    f.detectChanges();
    expect(f.componentInstance.reservasDoDia().length).toBe(3);
  });

  it('ao selecionar dia deve filtrar reservas', () => {
    const f = TestBed.createComponent(AgendamentoComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.diaSelecionado.set(new Date('2026-05-10'));
    expect(comp.reservasDoDia().length).toBe(2);
  });

  it('toIsoDate deve formatar data corretamente', () => {
    const f = TestBed.createComponent(AgendamentoComponent);
    const comp = f.componentInstance;
    expect(comp.toIsoDate(new Date(2026, 4, 10))).toBe('2026-05-10');
  });

  it('formatarHora deve retornar HH:mm', () => {
    const f = TestBed.createComponent(AgendamentoComponent);
    expect(f.componentInstance.formatarHora('08:30:00')).toBe('08:30');
  });

  it('deve detectar conflito de horário', () => {
    const f = TestBed.createComponent(AgendamentoComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    // Tenta inserir reserva que conflita com id=1 (08:00-10:00 em 2026-05-10)
    comp.formData.set('2026-05-10');
    comp.formHoraInicio.set('09:00');
    comp.formHoraFinal.set('11:00');
    comp.formResponsavel.set('Teste');
    comp.formValor.set('50');
    comp.modalAcao.set('inserir');
    comp.confirmarModal();
    expect(comp.erro()).toContain('Conflito');
  });

  it('calendário deve ter 42 células', () => {
    const f = TestBed.createComponent(AgendamentoComponent);
    f.detectChanges();
    expect(f.componentInstance.diasCalendario().length).toBe(42);
  });
});
