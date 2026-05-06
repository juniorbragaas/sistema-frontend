import { Component, signal, inject, OnInit, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtendimentoService, AtendimentoDto } from '../../../core/services/atendimento.service';

@Component({
  selector: 'app-fila-atendimento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fila-atendimento.component.html',
  styleUrl: './fila-atendimento.component.css',
})
export class FilaAtendimentoComponent implements OnInit, OnDestroy {
  private atendimentoService = inject(AtendimentoService);

  readonly totalRepeticoes = 3;

  // Signals
  atendimentos = signal<AtendimentoDto[]>([]);
  loading = signal(false);
  erro = signal('');
  mostraModalChamada = signal(false);
  atendimentoAtualAnterior = signal<AtendimentoDto | null>(null);
  audioAtivado = signal(false);
  repeticaoAtual = signal(0);

  private intervalId: any = null;
  private timeoutModalId: any = null;
  private synth: SpeechSynthesis | null = null;

  // ─── Computed ────────────────────────────────────────────────────────────────

  atendimentosEmFila = computed(() =>
    this.atendimentos()
      .filter(item => item.status === 'EM FILA')
      .sort((a, b) => a.ordem - b.ordem)
  );

  atendimentosEmAtendimento = computed(() =>
    this.atendimentos()
      .filter(item => item.status === 'EM ATENDIMENTO')
      .sort((a, b) => b.ordem - a.ordem)
  );

  proximoAtendimento = computed(() => {
    const fila = this.atendimentosEmFila();
    return fila.length > 0 ? fila[0] : null;
  });

  atendimentoAtual = computed(() => {
    const em = this.atendimentosEmAtendimento();
    return em.length > 0 ? em[0] : null;
  });

  atendimentosFinalizados = computed(() =>
    this.atendimentos()
      .filter(item => item.status === 'FINALIZADO')
      .sort((a, b) => new Date(b.dataEntrada).getTime() - new Date(a.dataEntrada).getTime())
  );

  totalNaFila = computed(() => this.atendimentosEmFila().length);

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.carregarDados();

    // Auto-refresh a cada 5 segundos
    this.intervalId = setInterval(() => this.carregarDados(), 5000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.timeoutModalId) clearTimeout(this.timeoutModalId);
    this.synth?.cancel();
  }

  // ─── Dados ───────────────────────────────────────────────────────────────────

  carregarDados(): void {
    this.loading.set(true);
    this.erro.set('');
    this.atendimentoService.listarAtendimentos().subscribe({
      next: (dados) => {
        this.atendimentos.set(dados);
        this.loading.set(false);

        const novoAtual = this.atendimentoAtual();
        const anterior = this.atendimentoAtualAnterior();

        // Só abre modal se o atendimento atual mudou E o áudio está ativado
        if (
          novoAtual &&
          this.audioAtivado() &&
          (!anterior || novoAtual.id !== anterior.id)
        ) {
          this.abrirModalChamada();
        }

        this.atendimentoAtualAnterior.set(novoAtual);
      },
      error: (err) => {
        console.error('Erro ao carregar atendimentos:', err);
        this.erro.set('Erro ao carregar fila de atendimento.');
        this.loading.set(false);
      },
    });
  }

  // ─── Áudio ───────────────────────────────────────────────────────────────────

  /**
   * Deve ser chamado por um clique do usuário para desbloquear
   * a Web Speech API nos navegadores modernos.
   */
  ativarAudio(): void {
    if (!this.synth) return;

    // Faz uma fala silenciosa para desbloquear a política de autoplay
    const teste = new SpeechSynthesisUtterance(' ');
    teste.volume = 0;
    teste.onend = () => {
      this.audioAtivado.set(true);
      console.log('Áudio desbloqueado pelo usuário.');
    };
    this.synth.speak(teste);
  }

  abrirModalChamada(): void {
    if (this.timeoutModalId) {
      clearTimeout(this.timeoutModalId);
      this.timeoutModalId = null;
    }

    this.repeticaoAtual.set(0);
    this.mostraModalChamada.set(true);

    // Pequeno delay para garantir que o DOM atualizou
    setTimeout(() => this.falarSenha(), 300);
  }

  private falarSenha(): void {
    const atendimento = this.atendimentoAtual();
    if (!atendimento || !this.synth) return;

    // Corrige bug do Chrome onde speechSynthesis trava após inatividade
    if (this.synth.paused) this.synth.resume();
    this.synth.cancel();

    const numero = atendimento.ordem.toString();
    const texto = `Chamando senha ${numero}. ${atendimento.nome}. Dirija-se ao setor ${atendimento.setor}.`;

    let repeticao = 0;

    const falar = () => {
      if (repeticao >= this.totalRepeticoes) {
        // Fechar modal 1,5s após a última fala
        this.timeoutModalId = setTimeout(() => this.fecharModalChamada(), 1500);
        return;
      }

      this.repeticaoAtual.set(repeticao + 1);

      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => {
        repeticao++;
        if (repeticao < this.totalRepeticoes) {
          // Pausa de 1,5s entre repetições
          setTimeout(falar, 1500);
        } else {
          this.timeoutModalId = setTimeout(() => this.fecharModalChamada(), 1500);
        }
      };

      utterance.onerror = (e) => {
        // Ignora erros de "interrupted" (causados pelo cancel() anterior)
        if (e.error === 'interrupted') return;
        console.warn('Erro na síntese de voz:', e.error);
        repeticao++;
        setTimeout(falar, 500);
      };

      console.log(`Falando (${repeticao + 1}/${this.totalRepeticoes}): ${texto}`);
      this.synth!.speak(utterance);
    };

    falar();
  }

  fecharModalChamada(): void {
    this.mostraModalChamada.set(false);
    this.repeticaoAtual.set(0);
    if (this.timeoutModalId) {
      clearTimeout(this.timeoutModalId);
      this.timeoutModalId = null;
    }
    this.synth?.cancel();
  }

  // ─── Utilitários ─────────────────────────────────────────────────────────────

  obterStatusCor(status: string): string {
    switch (status) {
      case 'EM FILA':         return '#ffc107';
      case 'EM ATENDIMENTO':  return '#0d6efd';
      case 'FINALIZADO':      return '#198754';
      case 'Confirmado':      return '#28a745';
      case 'Agendado':        return '#0d6efd';
      case 'Realizado':       return '#6c757d';
      case 'Cancelado':       return '#dc3545';
      default:                return '#6c757d';
    }
  }

  formatarSenha(ordem: number): string {
    return ordem.toString().padStart(6, '0');
  }
}
