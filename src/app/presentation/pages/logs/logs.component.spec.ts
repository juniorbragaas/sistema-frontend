import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { LogsComponent } from './logs.component';

const LOG_CONTENT = `2026-05-01 10:00:00 [INFO] Sistema iniciado
2026-05-01 10:01:00 [ERROR] Falha na conexão
2026-05-01 10:02:00 [WARN] Memória alta
2026-05-01 10:03:00 [DEBUG] Processando requisição
`;

describe('LogsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogsComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();
  });

  it('deve criar o componente', () => {
    const f = TestBed.createComponent(LogsComponent);
    expect(f.componentInstance).toBeTruthy();
  });

  it('estado inicial deve ter entradas vazias', () => {
    const f = TestBed.createComponent(LogsComponent);
    const comp = f.componentInstance;
    expect(comp.entradas().length).toBe(0);
    expect(comp.nomeArquivo()).toBe('');
  });

  it('corNivel deve retornar classe correta para ERROR', () => {
    const f = TestBed.createComponent(LogsComponent);
    expect(f.componentInstance.corNivel('ERROR')).toBe('nivel-error');
  });

  it('corNivel deve retornar classe correta para WARN', () => {
    const f = TestBed.createComponent(LogsComponent);
    expect(f.componentInstance.corNivel('WARN')).toBe('nivel-warn');
  });

  it('corNivel deve retornar classe correta para INFO', () => {
    const f = TestBed.createComponent(LogsComponent);
    expect(f.componentInstance.corNivel('INFO')).toBe('nivel-info');
  });

  it('filtro por nível deve funcionar', () => {
    const f = TestBed.createComponent(LogsComponent);
    const comp = f.componentInstance;
    // Simula entradas carregadas
    comp.entradas.set([
      { linha: 1, timestamp: '', nivel: 'INFO',  mensagem: 'msg1', raw: 'INFO msg1' },
      { linha: 2, timestamp: '', nivel: 'ERROR', mensagem: 'msg2', raw: 'ERROR msg2' },
      { linha: 3, timestamp: '', nivel: 'WARN',  mensagem: 'msg3', raw: 'WARN msg3' },
    ]);
    comp.filtroNivel.set('ERROR');
    expect(comp.dadosFiltrados().length).toBe(1);
    expect(comp.dadosFiltrados()[0].nivel).toBe('ERROR');
  });

  it('filtro por texto deve funcionar', () => {
    const f = TestBed.createComponent(LogsComponent);
    const comp = f.componentInstance;
    comp.entradas.set([
      { linha: 1, timestamp: '', nivel: 'INFO', mensagem: 'conexão estabelecida', raw: 'conexão estabelecida' },
      { linha: 2, timestamp: '', nivel: 'INFO', mensagem: 'usuário logado', raw: 'usuário logado' },
    ]);
    comp.filtroTexto.set('conexão');
    expect(comp.dadosFiltrados().length).toBe(1);
  });

  it('paginação deve funcionar', () => {
    const f = TestBed.createComponent(LogsComponent);
    const comp = f.componentInstance;
    const entradas = Array.from({ length: 60 }, (_, i) => ({
      linha: i + 1, timestamp: '', nivel: 'INFO', mensagem: `msg ${i}`, raw: `msg ${i}`,
    }));
    comp.entradas.set(entradas);
    comp.itensPorPagina.set(50);
    expect(comp.dadosPaginados().length).toBe(50);
    expect(comp.totalPaginas()).toBe(2);
  });

  it('ordenação por linha deve funcionar', () => {
    const f = TestBed.createComponent(LogsComponent);
    const comp = f.componentInstance;
    comp.entradas.set([
      { linha: 3, timestamp: '', nivel: 'INFO', mensagem: 'c', raw: 'c' },
      { linha: 1, timestamp: '', nivel: 'INFO', mensagem: 'a', raw: 'a' },
      { linha: 2, timestamp: '', nivel: 'INFO', mensagem: 'b', raw: 'b' },
    ]);
    comp.ordenarPor('linha');
    expect(comp.dadosFiltrados()[0].linha).toBe(1);
    expect(comp.dadosFiltrados()[2].linha).toBe(3);
  });
});
