import { Directive, ElementRef, effect, inject } from '@angular/core';
import { AppConfigService } from '../../../core/services/app-config.service';

/**
 * Diretiva aplicada em <table appTable> que injeta as CSS variables
 * de configuração do datatable no elemento host.
 * As classes CSS das telas usam var(--dt-*) para estilizar.
 */
@Directive({
  selector: 'table[appTable]',
  standalone: true,
})
export class AppTableDirective {
  private el = inject(ElementRef<HTMLTableElement>);
  private cfg = inject(AppConfigService);

  constructor() {
    effect(() => {
      const s = this.el.nativeElement.style;
      s.setProperty('--dt-header-bg',    this.cfg.tableHeaderBg());
      s.setProperty('--dt-header-text',  this.cfg.tableHeaderText());
      s.setProperty('--dt-filter-bg',    this.cfg.tableFilterBg());
      s.setProperty('--dt-row-odd-bg',   this.cfg.tableRowOddBg());
      s.setProperty('--dt-row-even-bg',  this.cfg.tableRowEvenBg());
      s.setProperty('--dt-row-hover-bg', this.cfg.tableRowHoverBg());
      s.setProperty('--dt-row-text',     this.cfg.tableRowText());
    });
  }
}
