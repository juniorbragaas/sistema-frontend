import { Component, inject, input } from '@angular/core';
import { AppConfigService } from '../../../core/services/app-config.service';

@Component({
  selector: 'app-page-title',
  standalone: true,
  template: `
    <div class="card-header text-center w-100"
      [style.background-color]="appConfig.pageTitleBgColor()"
      [style.color]="appConfig.pageTitleTextColor()">
      <h1 class="mb-0" style="font-size: 1.15rem; font-weight: 600;">{{ titulo() }}</h1>
    </div>
  `,
})
export class PageTitleComponent {
  appConfig = inject(AppConfigService);
  titulo = input.required<string>();
}
