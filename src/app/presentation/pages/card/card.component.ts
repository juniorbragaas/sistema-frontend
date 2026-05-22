import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent {

  numero = '105';
  letras = 'LWF';
  nome = 'Cristiano Ronaldo';

  escudo = '';
  fundo = '';
  foto = '';
  miniFoto = '';
  fotoScale = 1;
fotoX = 0;
fotoY = 0;
  

  upload(event: any, campo: string) {
    const file = event.target.files?.[0];

    if (file) {
      (this as any)[campo] = URL.createObjectURL(file);
    }
  }

  exportarPNG() {
    alert('Instale html-to-image para exportação real.');
  }
  zoomMais() {
  this.fotoScale += 0.1;
}

zoomMenos() {
  if (this.fotoScale > 0.2) {
    this.fotoScale -= 0.1;
  }
}

moverEsquerda() {
  this.fotoX -= 10;
}

moverDireita() {
  this.fotoX += 10;
}

moverCima() {
  this.fotoY -= 10;
}

moverBaixo() {
  this.fotoY += 10;
}

}