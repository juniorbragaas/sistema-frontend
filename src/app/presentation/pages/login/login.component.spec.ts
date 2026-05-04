import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { LoginUseCase } from '../../../core/usecases/login.usecase';
import { AppConfigService } from '../../../core/services/app-config.service';

describe('LoginComponent', () => {
  let mockLoginUseCase: jasmine.SpyObj<LoginUseCase>;

  beforeEach(async () => {
    mockLoginUseCase = jasmine.createSpyObj('LoginUseCase', ['execute']);
    mockLoginUseCase.execute.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: LoginUseCase, useValue: mockLoginUseCase },
      ],
    }).compileComponents();
  });

  it('deve criar o componente', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('formulário deve ser inválido quando vazio', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const comp = fixture.componentInstance;
    expect(comp.loginForm.invalid).toBeTrue();
  });

  it('formulário deve ser válido com nome e senha preenchidos', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const comp = fixture.componentInstance;
    comp.loginForm.setValue({ nome: 'admin', senha: '123456' });
    expect(comp.loginForm.valid).toBeTrue();
  });

  it('loading deve ser false inicialmente', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    expect(fixture.componentInstance.loading()).toBeFalse();
  });

  it('errorMessage deve ser vazio inicialmente', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    expect(fixture.componentInstance.errorMessage()).toBe('');
  });

  it('deve exibir mensagem de erro quando API retorna 401', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const comp = fixture.componentInstance;
    mockLoginUseCase.execute.and.returnValue(throwError(() => ({ status: 401 })));
    comp.loginForm.setValue({ nome: 'admin', senha: 'errada' });
    comp.onSubmit();
    expect(comp.errorMessage()).toContain('Credenciais inválidas');
  });

  it('deve exibir mensagem de erro de conexão quando status 0', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const comp = fixture.componentInstance;
    mockLoginUseCase.execute.and.returnValue(throwError(() => ({ status: 0 })));
    comp.loginForm.setValue({ nome: 'admin', senha: '123' });
    comp.onSubmit();
    expect(comp.errorMessage()).toContain('servidor');
  });
});
