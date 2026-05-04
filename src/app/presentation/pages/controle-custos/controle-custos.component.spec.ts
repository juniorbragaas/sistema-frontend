import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControleCustosComponent } from './controle-custos.component';

describe('ControleCustosComponent', () => {
  let component: ControleCustosComponent;
  let fixture: ComponentFixture<ControleCustosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ControleCustosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ControleCustosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
