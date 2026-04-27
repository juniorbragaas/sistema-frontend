import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

const CONFIG_KEY = 'app_config';

const KEYS = [
  'appName','appIcon','barColor','barTextColor','pageTitleBgColor','pageTitleTextColor',
  'btnInserirBg','btnInserirText','btnVisualizarBg','btnVisualizarText',
  'btnAlterarBg','btnAlterarText','btnExcluirBg','btnExcluirText',
  'btnSalvarBg','btnSalvarText','btnCancelarBg','btnCancelarText',
  'btnSimBg','btnSimText','btnNaoBg','btnNaoText',
] as const;

type ConfigKey = typeof KEYS[number];

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private platformId = inject(PLATFORM_ID);
  private signals: Record<ConfigKey, ReturnType<typeof signal<string>>>;

  appName; appIcon; barColor; barTextColor;
  pageTitleBgColor; pageTitleTextColor;
  btnInserirBg; btnInserirText; btnVisualizarBg; btnVisualizarText;
  btnAlterarBg; btnAlterarText; btnExcluirBg; btnExcluirText;
  btnSalvarBg; btnSalvarText; btnCancelarBg; btnCancelarText;
  btnSimBg; btnSimText; btnNaoBg; btnNaoText;

  constructor() {
    const env = environment as unknown as Record<string, string>;
    const s: Record<string, ReturnType<typeof signal<string>>> = {};
    for (const k of KEYS) {
      s[k] = signal(env[k] ?? '');
    }
    this.signals = s as Record<ConfigKey, ReturnType<typeof signal<string>>>;

    this.appName = this.signals.appName.asReadonly();
    this.appIcon = this.signals.appIcon.asReadonly();
    this.barColor = this.signals.barColor.asReadonly();
    this.barTextColor = this.signals.barTextColor.asReadonly();
    this.pageTitleBgColor = this.signals.pageTitleBgColor.asReadonly();
    this.pageTitleTextColor = this.signals.pageTitleTextColor.asReadonly();
    this.btnInserirBg = this.signals.btnInserirBg.asReadonly();
    this.btnInserirText = this.signals.btnInserirText.asReadonly();
    this.btnVisualizarBg = this.signals.btnVisualizarBg.asReadonly();
    this.btnVisualizarText = this.signals.btnVisualizarText.asReadonly();
    this.btnAlterarBg = this.signals.btnAlterarBg.asReadonly();
    this.btnAlterarText = this.signals.btnAlterarText.asReadonly();
    this.btnExcluirBg = this.signals.btnExcluirBg.asReadonly();
    this.btnExcluirText = this.signals.btnExcluirText.asReadonly();
    this.btnSalvarBg = this.signals.btnSalvarBg.asReadonly();
    this.btnSalvarText = this.signals.btnSalvarText.asReadonly();
    this.btnCancelarBg = this.signals.btnCancelarBg.asReadonly();
    this.btnCancelarText = this.signals.btnCancelarText.asReadonly();
    this.btnSimBg = this.signals.btnSimBg.asReadonly();
    this.btnSimText = this.signals.btnSimText.asReadonly();
    this.btnNaoBg = this.signals.btnNaoBg.asReadonly();
    this.btnNaoText = this.signals.btnNaoText.asReadonly();

    this.restore();
  }

  update(config: Record<string, string>): void {
    for (const [key, val] of Object.entries(config)) {
      if (this.signals[key as ConfigKey] && val !== undefined) {
        this.signals[key as ConfigKey].set(val);
      }
    }
    if (isPlatformBrowser(this.platformId)) {
      const data: Record<string, string> = {};
      for (const k of KEYS) {
        data[k] = this.signals[k]();
      }
      localStorage.setItem(CONFIG_KEY, JSON.stringify(data));
    }
  }

  private restore(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return;
    try {
      const c: Record<string, string> = JSON.parse(raw);
      for (const k of KEYS) {
        if (c[k]) this.signals[k].set(c[k]);
      }
    } catch { /* ignore */ }
  }
}
