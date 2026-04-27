import { Component, inject, input, output } from '@angular/core';
import { AppConfigService } from '../../../core/services/app-config.service';

@Component({
  selector: 'app-crud-buttons',
  standalone: true,
  template: `
    @if (mostrarInserir()) {
      <button class="btn btn-sm me-1"
        [style.background-color]="cfg.btnInserirBg()"
        [style.color]="cfg.btnInserirText()"
        title="Inserir Novo"
        (click)="inserir.emit()">➕ Novo</button>
    }
    @if (mostrarVisualizar()) {
      <button class="btn btn-sm me-1"
        [style.background-color]="cfg.btnVisualizarBg()"
        [style.color]="cfg.btnVisualizarText()"
        title="Visualizar"
        (click)="visualizar.emit()">👁️</button>
    }
    @if (mostrarAlterar()) {
      <button class="btn btn-sm me-1"
        [style.background-color]="cfg.btnAlterarBg()"
        [style.color]="cfg.btnAlterarText()"
        title="Alterar"
        (click)="alterar.emit()">✏️</button>
    }
    @if (mostrarExcluir()) {
      <button class="btn btn-sm"
        [style.background-color]="cfg.btnExcluirBg()"
        [style.color]="cfg.btnExcluirText()"
        title="Excluir"
        (click)="excluir.emit()">🗑️</button>
    }
  `,
})
export class CrudButtonsComponent {
  cfg = inject(AppConfigService);
  mostrarInserir = input(false);
  mostrarVisualizar = input(true);
  mostrarAlterar = input(true);
  mostrarExcluir = input(true);
  inserir = output<void>();
  visualizar = output<void>();
  alterar = output<void>();
  excluir = output<void>();
}
