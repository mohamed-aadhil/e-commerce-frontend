import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { Genre } from '../../services/genre.service';

@Component({
  selector: 'app-genre-card',
  standalone: true,
  imports: [],
  templateUrl: './genre-card.html',
  styleUrl: './genre-card.css'
})
export class GenreCard {
  @Input() genre!: Genre;
  @Output() select = new EventEmitter<Genre>();

  constructor(private cdr: ChangeDetectorRef) {}

  onClick() {
    this.select.emit(this.genre);
    this.cdr.detectChanges();
  }
}
