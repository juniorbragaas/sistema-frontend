import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListarPessoasUseCase } from '../../../core/usecases/listar-pessoas.usecase';
import { ListarConvidadosUseCase } from '../../../core/usecases/listar-convidados.usecase';
import { PessoaApi } from '../../../core/models/pessoa-api.model';
import { Convidado } from '../../../core/models/convidado.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  private listarPessoasUseCase = inject(ListarPessoasUseCase);
  private listarConvidadosUseCase = inject(ListarConvidadosUseCase);

  pessoas = signal<PessoaApi[]>([]);
  convidados = signal<Convidado[]>([]);
  loadingPessoas = signal(false);
  loadingConvidados = signal(false);

  filtroPessoaNome = signal('');
  filtroConvidadoNome = signal('');
  filtroResponsavel = signal('');
  filtroDataEntrada = signal('');
  filtroDataSaida = signal('');

  pessoasFiltradas = computed(() => {
    const filtro = this.filtroPessoaNome().toLowerCase();
    if (!filtro) return this.pessoas();
    return this.pessoas().filter(p =>
      p.nomeCompleto.toLowerCase().includes(filtro)
    );
  });

  convidadosHoje = computed(() => {
    const hoje = new Date();
    const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
    const filtro = this.filtroConvidadoNome().toLowerCase();
    const filtroResp = this.filtroResponsavel().toLowerCase();
    const filtroEntrada = this.filtroDataEntrada().toLowerCase();
    const filtroSaida = this.filtroDataSaida().toLowerCase();
    return this.convidados().filter(c => {
      if (!c.dataEntrada || !c.dataSaida) return false;
      const entrada = new Date(c.dataEntrada);
      const entradaSemHora = new Date(entrada.getFullYear(), entrada.getMonth(), entrada.getDate()).getTime();
      const saida = new Date(c.dataSaida);
      const saidaSemHora = new Date(saida.getFullYear(), saida.getMonth(), saida.getDate()).getTime();
      if (entradaSemHora > hojeSemHora) return false;
      if (saidaSemHora < hojeSemHora) return false;
      if (filtro && !c.visitante.toLowerCase().includes(filtro)) return false;
      if (filtroResp && !(c.pessoa?.nomeCompleto ?? '').toLowerCase().includes(filtroResp)) return false;
      if (filtroEntrada && !c.dataEntrada.substring(0, 10).includes(filtroEntrada)) return false;
      if (filtroSaida && !c.dataSaida.substring(0, 10).includes(filtroSaida)) return false;
      return true;
    });
  });

  ngOnInit(): void {
    this.carregarPessoas();
    this.carregarConvidados();
  }

  carregarPessoas(): void {
    this.loadingPessoas.set(true);
    this.listarPessoasUseCase.execute().subscribe({
      next: (d) => { this.pessoas.set(d); this.loadingPessoas.set(false); },
      error: () => this.loadingPessoas.set(false),
    });
  }

  carregarConvidados(): void {
    this.loadingConvidados.set(true);
    this.listarConvidadosUseCase.execute().subscribe({
      next: (d) => { this.convidados.set(d); this.loadingConvidados.set(false); },
      error: () => this.loadingConvidados.set(false),
    });
  }

  formatarData(data: string): string {
    if (!data) return '';
    return data.substring(0, 10);
  }

  // Modal visitantes da pessoa
  modalPessoaAberto = signal(false);
  pessoaSelecionada = signal<PessoaApi | null>(null);

  visitantesDaPessoa = computed(() => {
    const pessoa = this.pessoaSelecionada();
    if (!pessoa) return [];
    const hoje = new Date();
    const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
    return this.convidados().filter(c => {
      if (c.idPessoa !== pessoa.id) return false;
      if (!c.dataEntrada || !c.dataSaida) return false;
      const entrada = new Date(c.dataEntrada);
      const entradaSemHora = new Date(entrada.getFullYear(), entrada.getMonth(), entrada.getDate()).getTime();
      const saida = new Date(c.dataSaida);
      const saidaSemHora = new Date(saida.getFullYear(), saida.getMonth(), saida.getDate()).getTime();
      return entradaSemHora <= hojeSemHora && saidaSemHora >= hojeSemHora;
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

  hexToDataUrl(hex: string): string {
    if (!hex) return '';
    if (hex.startsWith('data:')) return hex;
    if (/^[A-Za-z0-9+/=]+$/.test(hex) && hex.length > 100) {
      return `data:image/jpeg;base64,${hex}`;
    }
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    if (/^[0-9a-fA-F]+$/.test(cleanHex)) {
      const bytes = new Uint8Array(cleanHex.length / 2);
      for (let i = 0; i < cleanHex.length; i += 2) {
        bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
      }
      let binary = '';
      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }
      return `data:image/jpeg;base64,${btoa(binary)}`;
    }
    return hex;
  }
}
