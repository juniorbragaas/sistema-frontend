import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { LoginUseCase } from '../../../core/usecases/login.usecase';
import { AppConfigService } from '../../../core/services/app-config.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  styleUrl: './login.component.css',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private loginUseCase = inject(LoginUseCase);
  private router = inject(Router);
  private appConfig = inject(AppConfigService);

  appName = this.appConfig.appName;
  appIcon = this.appConfig.appIcon;
  loginBgImage = this.appConfig.loginBgImage;

  loginForm = new FormGroup({
    nome: new FormControl('', Validators.required),
    senha: new FormControl('', Validators.required),
  });

  loading = signal(false);
  errorMessage = signal('');

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');

    const nome = this.loginForm.value.nome!;
    const senha = this.loginForm.value.senha!;

    this.loginUseCase.execute(nome, senha).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 0) {
          this.errorMessage.set('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
        } else {
          this.errorMessage.set('Credenciais inválidas. Verifique seu nome e senha.');
        }
      },
    });
  }
}
