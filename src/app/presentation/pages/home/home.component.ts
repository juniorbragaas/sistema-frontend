import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { ListarPessoasUseCase }   from '../../../core/usecases/listar-pessoas.usecase';
import { ListarConvidadosUseCase } from '../../../core/usecases/listar-convidados.usecase';
import { ListarReservasUseCase }  from '../../../core/usecases/listar-reservas.usecase';
import { PessoaApi }  from '../../../core/models/pessoa-api.model';
import { Convidado }  from '../../../core/models/convidado.model';
import { Reserva }    from '../../../core/models/reserva.model';

interface DiaCalendario {
  data: Date;
  mesAtual: boolean;
  diaAtual: boolean;
  temReserva: boolean;
  qtdReservas: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  private listarPessoasUseCase    = inject(ListarPessoasUseCase);
  private listarConvidadosUseCase = inject(ListarConvidadosUseCase);
  private listarReservasUseCase   = inject(ListarReservasUseCase);

  // ── Dados ──────────────────────────────────────────────────────────────────
  pessoas    = signal<PessoaApi[]>([]);
  convidados = signal<Convidado[]>([]);
  reservas   = signal<Reserva[]>([]);
  loadingPessoas    = signal(false);
  loadingConvidados = signal(false);

  // ── Filtros tabelas ────────────────────────────────────────────────────────
  filtroPessoaNome    = signal('');
  filtroConvidadoNome = signal('');
  filtroResponsavel   = signal('');
  filtroDataEntrada   = signal('');
  filtroDataSaida     = signal('');

  pessoasFiltradas = computed(() => {
    const filtro = this.filtroPessoaNome().toLowerCase();
    if (!filtro) return this.pessoas();
    return this.pessoas().filter(p => p.nomeCompleto.toLowerCase().includes(filtro));
  });

  convidadosHoje = computed(() => {
    const hoje = new Date();
    const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
    const filtro      = this.filtroConvidadoNome().toLowerCase();
    const filtroResp  = this.filtroResponsavel().toLowerCase();
    const filtroEnt   = this.filtroDataEntrada().toLowerCase();
    const filtroSai   = this.filtroDataSaida().toLowerCase();
    return this.convidados().filter(c => {
      if (!c.dataEntrada || !c.dataSaida) return false;
      const ent = new Date(c.dataEntrada);
      const sai = new Date(c.dataSaida);
      const entT = new Date(ent.getFullYear(), ent.getMonth(), ent.getDate()).getTime();
      const saiT = new Date(sai.getFullYear(), sai.getMonth(), sai.getDate()).getTime();
      if (entT > hojeSemHora || saiT < hojeSemHora) return false;
      if (filtro     && !c.visitante.toLowerCase().includes(filtro)) return false;
      if (filtroResp && !(c.pessoa?.nomeCompleto ?? '').toLowerCase().includes(filtroResp)) return false;
      if (filtroEnt  && !c.dataEntrada.substring(0, 10).includes(filtroEnt)) return false;
      if (filtroSai  && !c.dataSaida.substring(0, 10).includes(filtroSai)) return false;
      return true;
    });
  });

  // ── Calendário de Reservas ─────────────────────────────────────────────────
  readonly hoje = new Date();
  mesAtual = signal(new Date(this.hoje.getFullYear(), this.hoje.getMonth(), 1));

  readonly DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  readonly MESES = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
  ];

  tituloMes = computed(() => {
    const m = this.mesAtual();
    return `${this.MESES[m.getMonth()]} ${m.getFullYear()}`;
  });

  diasCalendario = computed<DiaCalendario[]>(() => {
    const mes      = this.mesAtual();
    const reservas = this.reservas();

    const primeiroDia = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const ultimoDia   = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
    const dias: DiaCalendario[] = [];

    // Células antes do 1º dia (domingo = 0)
    const offset = primeiroDia.getDay();
    for (let i = offset - 1; i >= 0; i--) {
      const d = new Date(primeiroDia);
      d.setDate(d.getDate() - i - 1);
      dias.push(this.criarDia(d, false, reservas));
    }

    // Dias do mês
    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      dias.push(this.criarDia(new Date(mes.getFullYear(), mes.getMonth(), d), true, reservas));
    }

    // Completa até 42 células (6 linhas × 7 colunas)
    while (dias.length < 42) {
      const prox = new Date(dias[dias.length - 1].data);
      prox.setDate(prox.getDate() + 1);
      dias.push(this.criarDia(prox, false, reservas));
    }

    return dias;
  });

  private criarDia(data: Date, mesAtual: boolean, reservas: Reserva[]): DiaCalendario {
    const iso = this.isoDate(data);
    const qtd = reservas.filter(r => r.data?.substring(0, 10) === iso).length;
    return {
      data, mesAtual,
      diaAtual:    iso === this.isoDate(this.hoje),
      temReserva:  qtd > 0,
      qtdReservas: qtd,
    };
  }

  mesAnterior(): void {
    const m = this.mesAtual();
    this.mesAtual.set(new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  proximoMes(): void {
    const m = this.mesAtual();
    this.mesAtual.set(new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  // ── Modal reservas do dia ──────────────────────────────────────────────────
  modalReservasDiaAberto = signal(false);
  diaSelecionado         = signal<Date | null>(null);

  reservasDoDia = computed(() => {
    const sel = this.diaSelecionado();
    if (!sel) return [];
    const iso = this.isoDate(sel);
    return this.reservas().filter(r => r.data?.substring(0, 10) === iso);
  });

  labelDiaSelecionado = computed(() => {
    const sel = this.diaSelecionado();
    if (!sel) return '';
    return sel.toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
  });

  abrirReservasDia(dia: DiaCalendario): void {
    if (!dia.temReserva) return;
    this.diaSelecionado.set(dia.data);
    this.modalReservasDiaAberto.set(true);
  }

  fecharModalReservasDia(): void {
    this.modalReservasDiaAberto.set(false);
    this.diaSelecionado.set(null);
  }

  // ── Modal visitantes da pessoa ─────────────────────────────────────────────
  modalPessoaAberto = signal(false);
  pessoaSelecionada = signal<PessoaApi | null>(null);

  visitantesDaPessoa = computed(() => {
    const pessoa = this.pessoaSelecionada();
    if (!pessoa) return [];
    const hoje = new Date();
    const hT = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
    return this.convidados().filter(c => {
      if (c.idPessoa !== pessoa.id || !c.dataEntrada || !c.dataSaida) return false;
      const ent = new Date(c.dataEntrada);
      const sai = new Date(c.dataSaida);
      return new Date(ent.getFullYear(), ent.getMonth(), ent.getDate()).getTime() <= hT
          && new Date(sai.getFullYear(), sai.getMonth(), sai.getDate()).getTime() >= hT;
    });
  });

  onPessoaClick(pessoa: PessoaApi): void {
    this.pessoaSelecionada.set(pessoa);
    this.modalPessoaAberto.set(true);
  }

  fecharModalPessoa(): void {
    this.modalPessoaAberto.set(false);
    this.pessoaSelecionada.set(null);
  }

  // ── Ciclo de vida ──────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.carregarPessoas();
    this.carregarConvidados();
    this.carregarReservas();
  }

  carregarPessoas(): void {
    this.loadingPessoas.set(true);
    this.listarPessoasUseCase.execute().subscribe({
      next: d => { this.pessoas.set(d); this.loadingPessoas.set(false); },
      error: () => this.loadingPessoas.set(false),
    });
  }

  carregarConvidados(): void {
    this.loadingConvidados.set(true);
    this.listarConvidadosUseCase.execute().subscribe({
      next: d => { this.convidados.set(d); this.loadingConvidados.set(false); },
      error: () => this.loadingConvidados.set(false),
    });
  }

  carregarReservas(): void {
    this.listarReservasUseCase.execute().subscribe({
      next: d => this.reservas.set(d),
      error: () => { /* silencioso */ },
    });
  }

  // ── Utilitários ────────────────────────────────────────────────────────────
  isoDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  formatarData(data: string): string {
    if (!data) return '';
    return data.substring(0, 10);
  }

  formatarHora(h: string): string {
    return h?.substring(0, 5) ?? '';
  }

  hexToDataUrl(hex: string): string {
    if (!hex) return '';
    if (hex.startsWith('data:')) return hex;
    if (/^[A-Za-z0-9+/=]+$/.test(hex) && hex.length > 100) return `data:image/jpeg;base64,${hex}`;
    const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
    if (/^[0-9a-fA-F]+$/.test(clean)) {
      const bytes = new Uint8Array(clean.length / 2);
      for (let i = 0; i < clean.length; i += 2) bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
      let bin = '';
      bytes.forEach(b => bin += String.fromCharCode(b));
      return `data:image/jpeg;base64,${btoa(bin)}`;
    }
    return hex;
  }
}
