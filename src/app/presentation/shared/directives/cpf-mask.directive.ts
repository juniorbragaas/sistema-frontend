import { Directive, ElementRef, HostListener, OnInit, inject, input } from '@angular/core';

/**
 * Diretiva de máscara de CPF: 000.000.000-00
 * Uso: <input appCpfMask ... />
 *
 * - Formata enquanto o usuário digita
 * - Ao receber um valor sem máscara (ex: "12345678901"), aplica automaticamente
 * - Emite o valor formatado via (input) do elemento nativo
 */
@Directive({
  selector: '[appCpfMask]',
  standalone: true,
})
export class CpfMaskDirective implements OnInit {
  private el = inject(ElementRef);

  ngOnInit(): void {
    // Aplica máscara no valor inicial (caso venha sem formatação do banco)
    const val = this.el.nativeElement.value;
    if (val) {
      this.el.nativeElement.value = this.aplicarMascara(val);
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatado = this.aplicarMascara(input.value);
    input.value = formatado;

    // Dispara evento nativo para que o Angular detecte a mudança via (input)
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  @HostListener('blur')
  onBlur(): void {
    const input = this.el.nativeElement as HTMLInputElement;
    input.value = this.aplicarMascara(input.value);
  }

  private aplicarMascara(valor: string): string {
    // Remove tudo que não é dígito
    const digits = valor.replace(/\D/g, '').substring(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }
}
