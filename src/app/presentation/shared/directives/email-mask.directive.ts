import { Directive, ElementRef, HostListener, inject } from '@angular/core';

/**
 * Diretiva de validação visual de e-mail.
 * - Converte para minúsculas automaticamente
 * - Remove espaços
 * - Adiciona borda vermelha se o formato for inválido ao sair do campo
 * Uso: <input appEmailMask ... />
 */
@Directive({
  selector: '[appEmailMask]',
  standalone: true,
})
export class EmailMaskDirective {
  private el = inject(ElementRef);

  private readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Remove espaços e converte para minúsculas
    const limpo = input.value.replace(/\s/g, '').toLowerCase();
    if (input.value !== limpo) {
      input.value = limpo;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    // Remove feedback de erro enquanto digita
    input.classList.remove('is-invalid');
  }

  @HostListener('blur')
  onBlur(): void {
    const input = this.el.nativeElement as HTMLInputElement;
    const val = input.value.trim();
    if (val && !this.EMAIL_REGEX.test(val)) {
      input.classList.add('is-invalid');
    } else {
      input.classList.remove('is-invalid');
    }
  }

  @HostListener('focus')
  onFocus(): void {
    (this.el.nativeElement as HTMLInputElement).classList.remove('is-invalid');
  }
}
