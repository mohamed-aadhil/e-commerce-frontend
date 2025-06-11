import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestockDialog } from './restock-dialog';

describe('RestockDialog', () => {
  let component: RestockDialog;
  let fixture: ComponentFixture<RestockDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestockDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestockDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
