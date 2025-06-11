import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenreProducts } from './genre-products';

describe('GenreProducts', () => {
  let component: GenreProducts;
  let fixture: ComponentFixture<GenreProducts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenreProducts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenreProducts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
