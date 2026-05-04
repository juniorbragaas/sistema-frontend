import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';

export interface LogEntry {
  linha:     number;
  timestamp: string;
  nivel:     string;
  mensagem:  string;
  raw:       string;
}

// Regex que tenta capturar: [TIMESTAMP] [NIVEL] mensagem
// Aceita formatos como: 2026-05-04 10:23:11 [INFO] texto
//                       [2026-05-04T10:23:11] ERROR texto
//                       info: texto  (sem timestamp)
const LOG_REGEX = /^(?:\[?(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[^\]]*)\]?\s+)?(?:\[?(TRACE|DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL|CRITICAL)\]?:?\s+)?(.+)$/i;

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [FormsModule, PageTitleComponent],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.css',
})
export class LogsComponent {
  // ── Estado ─────────────────────────────────────────────────────────────────
  entradas    = signal<LogEntry[]>([]);
  nomeArquivo = signal('');
  carregando  = signal(false);
  erro        = signal('');

  // ── Filtros e ordenação ────────────────────────────────────────────────────
  filtroTexto = signal('');
  filtroNivel = signal('');
  sortColuna  = signal('linha');
  sortDir     = signal<'asc' | 'desc'>('asc');
  paginaAtual = signal(1);
  itensPorPagina = signal(50);

  readonly NIVEIS = ['', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];

  dadosFiltrados = computed(() => {
    const texto = this.filtroTexto().toLowerCase();
    const nivel = this.filtroNivel().toUpperCase();
    const col   = this.sortColuna();
    const dir   = this.sortDir();

    let lista = this.entradas().filter(e => {
      if (nivel && e.nivel.toUpperCase() !== nivel) return false;
      if (texto && !e.raw.toLowerCase().includes(texto)) return false;
      return true;
    });

    lista = [...lista].sort((a, b) => {
      const va = String((a as unknown as Record<string, unknown>)[col] ?? '');
      const vb = String((b as unknown as Record<string, unknown>)[col] ?? '');
      const cmp = col === 'linha'
        ? (a.linha - b.linha)
        : va.localeCompare(vb);
      return dir === 'asc' ? cmp : -cmp;
    });

    return lista;
  });

  dadosPaginados = computed(() => {
    const inicio = (this.paginaAtual() - 1) * this.itensPorPagina();
    return this.dadosFiltrados().slice(inicio, inicio + this.itensPorPagina());
  });

  totalPaginas = computed(() =>
    Math.ceil(this.dadosFiltrados().length / this.itensPorPagina()) || 1
  );

  // ── Leitura do arquivo ─────────────────────────────────────────────────────
  onArquivoSelecionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.nomeArquivo.set(file.name);
    this.carregando.set(true);
    this.erro.set('');
    this.entradas.set([]);
    this.paginaAtual.set(1);

    const reader = new FileReader();
    reader.onload = () => {
      const texto = reader.result as string;
      const linhas = texto.split(/\r?\n/);
      const parsed: LogEntry[] = [];

      linhas.forEach((raw, idx) => {
        if (!raw.trim()) return;
        const m = LOG_REGEX.exec(raw);
        parsed.push({
          linha:     idx + 1,
          timestamp: m?.[1]?.trim() ?? '',
          nivel:     (m?.[2] ?? '').toUpperCase(),
          mensagem:  m?.[3]?.trim() ?? raw.trim(),
          raw,
        });
      });

      this.entradas.set(parsed);
      this.carregando.set(false);
    };
    reader.onerror = () => {
      this.erro.set('Erro ao ler o arquivo.');
      this.carregando.set(false);
    };
    reader.readAsText(file, 'utf-8');
    input.value = ''; // permite reselecionar o mesmo arquivo
  }

  // ── Ordenação ──────────────────────────────────────────────────────────────
  ordenarPor(col: string): void {
    if (this.sortColuna() === col) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColuna.set(col);
      this.sortDir.set('asc');
    }
    this.paginaAtual.set(1);
  }

  iconeSort(col: string): string {
    if (this.sortColuna() !== col) return '↕';
    return this.sortDir() === 'asc' ? '▲' : '▼';
  }

  irParaPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas()) this.paginaAtual.set(p);
  }

  // ── Exportar para Excel (CSV) ──────────────────────────────────────────────
  exportarExcel(): void {
    const dados = this.dadosFiltrados();
    if (!dados.length) return;

    const cabecalho = ['Linha', 'Timestamp', 'Nível', 'Mensagem'];
    const linhas = dados.map(e => [
      e.linha,
      `"${e.timestamp.replace(/"/g, '""')}"`,
      e.nivel,
      `"${e.mensagem.replace(/"/g, '""')}"`,
    ]);

    const csv = [cabecalho.join(';'), ...linhas.map(l => l.join(';'))].join('\r\n');
    const bom  = '\uFEFF'; // BOM para Excel reconhecer UTF-8
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `logs_${this.nomeArquivo() || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Cor por nível ──────────────────────────────────────────────────────────
  corNivel(nivel: string): string {
    switch (nivel.toUpperCase()) {
      case 'ERROR':
      case 'FATAL':
      case 'CRITICAL': return 'nivel-error';
      case 'WARN':
      case 'WARNING':  return 'nivel-warn';
      case 'INFO':     return 'nivel-info';
      case 'DEBUG':    return 'nivel-debug';
      case 'TRACE':    return 'nivel-trace';
      default:         return '';
    }
  }
}
