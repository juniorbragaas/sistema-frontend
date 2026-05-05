import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtendimentoService, AtendimentoDto } from '../../../core/services/atendimento.service';

@Component({
  selector: 'app-fila-atendimento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fila-atendimento.component.html',
  styleUrl: './fila-atendimento.component.css',
})
export class FilaAtendimentoComponent implements OnInit {
  private atendimentoService = inject(AtendimentoService);

  // Signals
  atendimentos = signal<AtendimentoDto[]>([]);
  loading = signal(false);
  erro = signal('');
  autoRefresh = signal(true);
  refreshInterval = signal(5000); // 5 segundos
  mostraModalChamada = signal(false);
  atendimentoAtualAnterior = signal<AtendimentoDto | null>(null);
  timeoutModalId: any = null;
  synth: SpeechSynthesis | null = null;

  // Computed
  atendimentosEmFila = computed(() => {
    return this.atendimentos()
      .filter(item => item.status === 'EM FILA')
      .sort((a, b) => a.ordem - b.ordem);
  });

  atendimentosEmAtendimento = computed(() => {
    return this.atendimentos()
      .filter(item => item.status === 'EM ATENDIMENTO')
      .sort((a, b) => b.ordem - a.ordem);
  });

  proximoAtendimento = computed(() => {
    const fila = this.atendimentosEmFila();
    return fila.length > 0 ? fila[0] : null;
  });

  atendimentoAtual = computed(() => {
    const emAtendimento = this.atendimentosEmAtendimento();
    return emAtendimento.length > 0 ? emAtendimento[0] : null;
  });

  atendimentosFinalizados = computed(() => {
    return this.atendimentos()
      .filter(item => item.status === 'FINALIZADO')
      .sort((a, b) => new Date(b.dataEntrada).getTime() - new Date(a.dataEntrada).getTime());
  });

  totalNaFila = computed(() => this.atendimentosEmFila().length);

  ngOnInit(): void {
    this.carregarDados();
    
    // Auto-refresh a cada 5 segundos
    if (this.autoRefresh()) {
      setInterval(() => {
        this.carregarDados();
      }, this.refreshInterval());
    }
  }

  carregarDados(): void {
    this.loading.set(true);
    this.erro.set('');
    this.atendimentoService.listarAtendimentos().subscribe({
      next: (dados) => {
        this.atendimentos.set(dados);
        this.loading.set(false);

        // Verificar se o atendimento atual mudou
        const novoAtendimentoAtual = this.atendimentoAtual();
        const atendimentoAnterior = this.atendimentoAtualAnterior();

        if (novoAtendimentoAtual && 
            (!atendimentoAnterior || novoAtendimentoAtual.id !== atendimentoAnterior.id)) {
          // Atendimento atual mudou, abrir modal
          this.abrirModalChamada();
        }

        // Atualizar referência do atendimento anterior
        this.atendimentoAtualAnterior.set(novoAtendimentoAtual);
      },
      error: (err) => {
        console.error('Erro ao carregar atendimentos:', err);
        this.erro.set('Erro ao carregar fila de atendimento.');
        this.loading.set(false);
      },
    });
  }

  abrirModalChamada(): void {
    // Limpar timeout anterior se existir
    if (this.timeoutModalId) {
      clearTimeout(this.timeoutModalId);
    }

    this.mostraModalChamada.set(true);

    // Log para debug
    console.log('Modal aberta, iniciando reprodução de áudio');

    // Reproduzir áudio 3 vezes com intervalo de 3 segundos
    setTimeout(() => {
      this.reproduzirAudioTresVezes();
    }, 500);
  }

  reproduzirAudioTresVezes(): void {
    let contador = 0;
    const totalRepeticoes = 3;

    const reproduzirComIntervalo = () => {
      if (contador < totalRepeticoes) {
        this.reproduzirAudio();
        contador++;
        
        // Agendar próxima reprodução após 3 segundos
        setTimeout(() => {
          reproduzirComIntervalo();
        }, 3000);
      } else {
        // Após 3 reproduções, fechar a modal
        setTimeout(() => {
          this.fecharModalChamada();
        }, 1000);
      }
    };

    reproduzirComIntervalo();
  }

  reproduzirAudio(): void {
    const atendimento = this.atendimentoAtual();
    if (!atendimento) return;

    // Obter a síntese de fala do navegador
    this.synth = window.speechSynthesis;

    // Cancelar qualquer áudio anterior
    this.synth.cancel();

    // Criar o texto a ser falado - ler apenas o número inteiro sem zeros à esquerda
    const numeroInteiro = atendimento.ordem.toString();
    const texto = `Chamando senha ${numeroInteiro}`;

    // Criar utterance
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.7; // Velocidade mais lenta
    utterance.pitch = 1;
    utterance.volume = 1;

    // Log para debug
    console.log('Reproduzindo áudio:', texto);

    // Reproduzir
    this.synth.speak(utterance);
  }

  fecharModalChamada(): void {
    this.mostraModalChamada.set(false);
    if (this.timeoutModalId) {
      clearTimeout(this.timeoutModalId);
      this.timeoutModalId = null;
    }
    // Cancelar áudio se estiver reproduzindo
    if (this.synth) {
      this.synth.cancel();
    }
  }

  obterStatusCor(status: string): string {
    switch (status) {
      case 'Confirmado':
        return '#28a745';
      case 'Agendado':
        return '#0d6efd';
      case 'Realizado':
        return '#6c757d';
      case 'EM FILA':
        return '#ffc107';
      case 'Cancelado':
        return '#dc3545';
      default:
        return '#000';
    }
  }

  formatarSenha(ordem: number): string {
    return ordem.toString().padStart(6, '0');
  }
}
