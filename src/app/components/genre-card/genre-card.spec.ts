import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenreCard } from './genre-card';

describe('GenreCard', () => {
  let component: GenreCard;
  let fixture: ComponentFixture<GenreCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenreCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenreCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
