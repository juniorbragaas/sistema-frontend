import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppConfigService } from '../../../core/services/app-config.service';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';

@Component({
  selector: 'app-inicio-sistema',
  standalone: true,
  imports: [FormsModule, PageTitleComponent],
  templateUrl: './inicio-sistema.component.html',
  styleUrl: './inicio-sistema.component.css',
})
export class InicioSistemaComponent {
  cfg = inject(AppConfigService);

  nome = signal(this.cfg.appName());
  iconPreview = signal(this.cfg.appIcon());
  barColor = signal(this.cfg.barColor());
  barTextColor = signal(this.cfg.barTextColor());
  pageTitleBgColor = signal(this.cfg.pageTitleBgColor());
  pageTitleTextColor = signal(this.cfg.pageTitleTextColor());
  btnInserirBg = signal(this.cfg.btnInserirBg());
  btnInserirText = signal(this.cfg.btnInserirText());
  btnVisualizarBg = signal(this.cfg.btnVisualizarBg());
  btnVisualizarText = signal(this.cfg.btnVisualizarText());
  btnAlterarBg = signal(this.cfg.btnAlterarBg());
  btnAlterarText = signal(this.cfg.btnAlterarText());
  btnExcluirBg = signal(this.cfg.btnExcluirBg());
  btnExcluirText = signal(this.cfg.btnExcluirText());
  btnSalvarBg = signal(this.cfg.btnSalvarBg());
  btnSalvarText = signal(this.cfg.btnSalvarText());
  btnCancelarBg = signal(this.cfg.btnCancelarBg());
  btnCancelarText = signal(this.cfg.btnCancelarText());
  btnSimBg = signal(this.cfg.btnSimBg());
  btnSimText = signal(this.cfg.btnSimText());
  btnNaoBg = signal(this.cfg.btnNaoBg());
  btnNaoText = signal(this.cfg.btnNaoText());
  salvo = signal(false);

  onIconChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const reader = new FileReader();
    reader.onload = () => this.iconPreview.set(reader.result as string);
    reader.readAsDataURL(input.files[0]);
  }

  salvar(): void {
    this.cfg.update({
      appName: this.nome(), appIcon: this.iconPreview(),
      barColor: this.barColor(), barTextColor: this.barTextColor(),
      pageTitleBgColor: this.pageTitleBgColor(), pageTitleTextColor: this.pageTitleTextColor(),
      btnInserirBg: this.btnInserirBg(), btnInserirText: this.btnInserirText(),
      btnVisualizarBg: this.btnVisualizarBg(), btnVisualizarText: this.btnVisualizarText(),
      btnAlterarBg: this.btnAlterarBg(), btnAlterarText: this.btnAlterarText(),
      btnExcluirBg: this.btnExcluirBg(), btnExcluirText: this.btnExcluirText(),
      btnSalvarBg: this.btnSalvarBg(), btnSalvarText: this.btnSalvarText(),
      btnCancelarBg: this.btnCancelarBg(), btnCancelarText: this.btnCancelarText(),
      btnSimBg: this.btnSimBg(), btnSimText: this.btnSimText(),
      btnNaoBg: this.btnNaoBg(), btnNaoText: this.btnNaoText(),
    });
    this.salvo.set(true);
    setTimeout(() => this.salvo.set(false), 3000);
  }
}
