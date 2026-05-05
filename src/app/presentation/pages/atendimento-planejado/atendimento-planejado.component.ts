import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { CrudButtonsComponent } from '../../shared/crud-buttons/crud-buttons.component';
import { AtendimentoService, AtendimentoDto } from '../../../core/services/atendimento.service';
import { AuthPort } from '../../../core/ports/auth.port';

interface AtendimentoPlanejado {
  id: string;
  data: string;
  hora: string;
  cliente: string;
  telefone: string;
  email: string;
  servico: string;
  descricao: string;
  status: 'Agendado' | 'Confirmado' | 'Cancelado' | 'Realizado';
  observacoes: string;
}

type ModalAcao = 'gerar-senha' | null;

@Component({
  selector: 'app-atendimento-planejado',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitleComponent, CrudButtonsComponent],
  templateUrl: './atendimento-planejado.component.html',
  styleUrl: './atendimento-planejado.component.css',
})
export class AtendimentoPlanejadoComponent implements OnInit {
  private atendimentoService = inject(AtendimentoService);
  private authPort = inject(AuthPort);

  // Signals - Datatable
  atendimentos = signal<AtendimentoDto[]>([]);
  loading = signal(false);
  erro = signal('');
  filtros = signal<Record<string, string>>({});
  paginaAtual = signal(1);
  itensPorPagina = signal(10);

  // Modal Senha
  senhaGerada = signal<AtendimentoDto | null>(null);
  mostraSenha = signal(false);
  carregandoSenha = signal(false);

  // Computed
  proximoAtendimento = computed(() => {
    const atendimentos = this.atendimentos();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // Filtrar apenas atendimentos de hoje com status EM FILA
    const atendimentosHoje = atendimentos.filter(item => {
      const dataItem = new Date(item.dataEntrada);
      dataItem.setHours(0, 0, 0, 0);
      return dataItem.getTime() === hoje.getTime() && item.status === 'EM FILA';
    });
    
    // Retornar o primeiro (próximo) se houver
    return atendimentosHoje.length > 0 ? atendimentosHoje[0] : null;
  });
  colunas = [
    { key: 'ordem', label: 'Ordem' },
    { key: 'status', label: 'Status' },
    { key: 'dataEntrada', label: 'Data Entrada' },
    { key: 'nome', label: 'Nome' },
    { key: 'atendente', label: 'Atendente' },
    { key: 'setor', label: 'Setor' },
    { key: 'numero', label: 'Número' },
    { key: 'tempoAtendimento', label: 'Tempo de Atendimento' },
  ];

  // Computed
  dadosFiltrados = computed(() => {
    const dados = this.atendimentos();
    const f = this.filtros();
    
    const filtrados = dados.filter(item =>
      Object.keys(f).every(c => {
        const filtro = f[c]?.toLowerCase() ?? '';
        if (!filtro) return true;
        const valor = String((item as any)[c] ?? '').toLowerCase();
        return valor.includes(filtro);
      })
    );
    
    return filtrados;
  });

  dadosPaginados = computed(() => {
    const filtrados = this.dadosFiltrados();
    const inicio = (this.paginaAtual() - 1) * this.itensPorPagina();
    return filtrados.slice(inicio, inicio + this.itensPorPagina());
  });

  totalPaginas = computed(() =>
    Math.ceil(this.dadosFiltrados().length / this.itensPorPagina()) || 1
  );

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.loading.set(true);
    this.erro.set('');
    this.atendimentoService.listarAtendimentos().subscribe({
      next: (dados) => {
        // Filtrar atendimentos com status EM FILA ou EM ATENDIMENTO
        const dadosOrdenados = [...dados]
          .filter(item => item.status === 'EM FILA' || item.status === 'EM ATENDIMENTO')
          .sort((a, b) => {
            // Colocar EM ATENDIMENTO na frente
            if (a.status === 'EM ATENDIMENTO' && b.status !== 'EM ATENDIMENTO') {
              return -1;
            }
            if (a.status !== 'EM ATENDIMENTO' && b.status === 'EM ATENDIMENTO') {
              return 1;
            }
            
            // Se ambos têm o mesmo status, ordenar por data e ordem crescente
            const dataA = new Date(a.dataEntrada).getTime();
            const dataB = new Date(b.dataEntrada).getTime();
            
            if (dataA !== dataB) {
              return dataA - dataB; // Crescente por data
            }
            return a.ordem - b.ordem; // Crescente por ordem
          });
        
        this.atendimentos.set(dadosOrdenados);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar atendimentos:', err);
        this.erro.set('Erro ao carregar dados de atendimentos.');
        this.loading.set(false);
      },
    });
  }

  onFiltroChange(coluna: string, valor: string): void {
    this.filtros.update(f => ({ ...f, [coluna]: valor }));
    this.paginaAtual.set(1);
  }

  irParaPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaAtual.set(pagina);
    }
  }

  gerarSenhaAtendimento(): void {
    this.carregandoSenha.set(true);
    this.atendimentoService.gerarSenha().subscribe({
      next: (response) => {
        this.senhaGerada.set(response);
        this.mostraSenha.set(true);
        this.carregandoSenha.set(false);
        this.carregarDados();
      },
      error: (error) => {
        console.error('Erro ao gerar senha:', error);
        this.erro.set('Erro ao gerar senha de atendimento');
        this.carregandoSenha.set(false);
      }
    });
  }

  formatarSenha(ordem: number): string {
    return ordem.toString().padStart(6, '0');
  }

  copiarSenha(): void {
    if (this.senhaGerada()) {
      const senhaFormatada = this.formatarSenha(this.senhaGerada()!.ordem);
      navigator.clipboard.writeText(senhaFormatada).then(() => {
        const botao = document.querySelector('.btn-copy-senha') as HTMLButtonElement;
        if (botao) {
          const textoOriginal = botao.innerHTML;
          botao.innerHTML = '✓ Copiado!';
          botao.disabled = true;
          setTimeout(() => {
            botao.innerHTML = textoOriginal;
            botao.disabled = false;
          }, 2000);
        }
      }).catch(() => {
        this.erro.set('Erro ao copiar a senha!');
      });
    }
  }

  imprimirSenha(): void {
    if (this.senhaGerada()) {
      const senhaFormatada = this.formatarSenha(this.senhaGerada()!.ordem);
      const printWindow = window.open('', '', 'height=400,width=600');
      
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Senha de Atendimento</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  background-color: #f5f5f5;
                }
                .container {
                  text-align: center;
                  background-color: white;
                  padding: 40px;
                  border-radius: 10px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .titulo {
                  font-size: 24px;
                  font-weight: bold;
                  color: #333;
                  margin-bottom: 30px;
                }
                .senha {
                  font-size: 80px;
                  font-weight: bold;
                  color: #28a745;
                  letter-spacing: 10px;
                  font-family: 'Courier New', monospace;
                  margin: 30px 0;
                  padding: 20px;
                  border: 3px solid #28a745;
                  border-radius: 10px;
                  background-color: #f0f8f0;
                }
                .mensagem {
                  font-size: 14px;
                  color: #666;
                  margin-top: 20px;
                }
                @media print {
                  body {
                    background-color: white;
                  }
                  .container {
                    box-shadow: none;
                  }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="titulo">🔐 Senha de Atendimento</div>
                <div class="senha">${senhaFormatada}</div>
                <div class="mensagem">Apresente esta senha no atendimento</div>
              </div>
              <script>
                window.print();
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  }

  fecharSenha(): void {
    this.mostraSenha.set(false);
    this.senhaGerada.set(null);
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

  atenderProximoDaFila(): void {
    const proximo = this.proximoAtendimento();
    if (!proximo) {
      this.erro.set('Nenhum atendimento na fila para atender.');
      return;
    }

    const usuarioLogado = this.authPort.currentUser();
    const nomeAtendente = usuarioLogado?.pessoa?.nomeCompleto ?? 'Atendente';
    const dataAtual = new Date().toISOString();

    // Criar objeto completo com todos os campos necessários
    const atendimentoAtualizado: AtendimentoDto = {
      ...proximo,
      status: 'EM ATENDIMENTO',
      atendente: nomeAtendente,
      dataEntrada: dataAtual
    };

    console.log('Atualizando atendimento:', atendimentoAtualizado);

    this.atendimentoService.atualizarAtendimentoCompleto(atendimentoAtualizado).subscribe({
      next: (response) => {
        console.log('Atendimento atualizado com sucesso:', response);
        // Aguardar um pouco antes de recarregar para garantir que o backend processou
        setTimeout(() => {
          this.carregarDados();
        }, 500);
      },
      error: (error) => {
        console.error('Erro ao atender próximo:', error);
        this.erro.set('Erro ao atender o próximo da fila.');
      }
    });
  }

  calcularTempoAtendimento(atendimento: AtendimentoDto): string {
    // Mostrar tempo apenas para atendimentos em atendimento
    if (atendimento.status !== 'EM ATENDIMENTO') {
      return '-';
    }

    const dataEntrada = new Date(atendimento.dataEntrada);
    const agora = new Date();
    const diferenca = agora.getTime() - dataEntrada.getTime();

    // Converter para segundos, minutos, horas
    const segundos = Math.floor(diferenca / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);

    if (horas > 0) {
      return `${horas}h ${minutos % 60}m`;
    } else if (minutos > 0) {
      return `${minutos}m ${segundos % 60}s`;
    } else {
      return `${segundos}s`;
    }
  }

  finalizarAtendimento(id: string): void {
    if (confirm('Tem certeza que deseja finalizar este atendimento?')) {
      // Encontrar o atendimento na lista
      const atendimento = this.atendimentos().find(a => a.id === id);
      if (!atendimento) {
        this.erro.set('Atendimento não encontrado');
        return;
      }

      // Criar objeto atualizado com status FINALIZADO e data de saída atual
      const atendimentoAtualizado: AtendimentoDto = {
        ...atendimento,
        status: 'FINALIZADO',
        dataSaida: new Date().toISOString()
      };

      console.log('Finalizando atendimento:', atendimentoAtualizado);

      this.atendimentoService.atualizarAtendimentoCompleto(atendimentoAtualizado).subscribe({
        next: () => {
          console.log('Atendimento finalizado com sucesso');
          this.carregarDados();
        },
        error: (err) => {
          console.error('Erro ao finalizar atendimento:', err);
          this.erro.set('Erro ao finalizar atendimento');
        },
      });
    }
  }
}
