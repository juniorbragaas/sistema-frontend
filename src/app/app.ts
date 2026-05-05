import { Component, inject, effect } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { AppConfigService } from './core/services/app-config.service';
import { FaviconService } from './core/services/favicon.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private title = inject(Title);
  private appConfig = inject(AppConfigService);
  private favicon = inject(FaviconService);  // Injetar para inicializar o serviço

  constructor() {
    // Atualiza o <title> da página sempre que appName mudar
    effect(() => {
      const nome = this.appConfig.appName();
      if (nome) {
        this.title.setTitle(nome);
      }
    });
  }
}
