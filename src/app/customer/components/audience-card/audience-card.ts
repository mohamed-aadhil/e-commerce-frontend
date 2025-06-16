import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Audience } from '../../services/product.service';

@Component({
  selector: 'app-audience-card',
  standalone: true,
  imports: [],
  templateUrl: './audience-card.html',
  styleUrl: './audience-card.css'
})
export class AudienceCard {
  @Input() audience!: Audience;
  @Output() select = new EventEmitter<Audience>();

  constructor(private cdr: ChangeDetectorRef, private router: Router) {}

  onClick() {
    this.select.emit(this.audience);
    this.router.navigate(['/audience', this.audience.id, 'products']);
    this.cdr.detectChanges();
  }
}
