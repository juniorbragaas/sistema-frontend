import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { InicioSistemaComponent } from './inicio-sistema.component';
import { AppConfigService } from '../../../core/services/app-config.service';

describe('InicioSistemaComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioSistemaComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();
  });

  it('deve criar o componente', () => {
    const f = TestBed.createComponent(InicioSistemaComponent);
    expect(f.componentInstance).toBeTruthy();
  });

  it('deve inicializar signals com valores do AppConfigService', () => {
    const f = TestBed.createComponent(InicioSistemaComponent);
    const comp = f.componentInstance;
    const cfg = TestBed.inject(AppConfigService);
    expect(comp.nome()).toBe(cfg.appName());
    expect(comp.barColor()).toBe(cfg.barColor());
  });

  it('salvo deve ser false inicialmente', () => {
    const f = TestBed.createComponent(InicioSistemaComponent);
    expect(f.componentInstance.salvo()).toBeFalse();
  });

  it('onIconChange deve atualizar iconPreview com base64', (done) => {
    const f = TestBed.createComponent(InicioSistemaComponent);
    const comp = f.componentInstance;
    const blob = new Blob(['fake-image'], { type: 'image/png' });
    const file = new File([blob], 'icon.png', { type: 'image/png' });
    const event = { target: { files: [file] } } as unknown as Event;
    comp.onIconChange(event);
    setTimeout(() => {
      expect(comp.iconPreview()).toContain('data:');
      done();
    }, 100);
  });

  it('removerLoginBg deve limpar loginBgPreview', () => {
    const f = TestBed.createComponent(InicioSistemaComponent);
    const comp = f.componentInstance;
    comp.loginBgPreview.set('data:image/png;base64,abc');
    comp.removerLoginBg();
    expect(comp.loginBgPreview()).toBe('');
  });
});
