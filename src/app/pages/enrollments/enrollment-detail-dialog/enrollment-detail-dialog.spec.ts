import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnrollmentDetailDialog } from './enrollment-detail-dialog';

describe('EnrollmentDetailDialog', () => {
  let component: EnrollmentDetailDialog;
  let fixture: ComponentFixture<EnrollmentDetailDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnrollmentDetailDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnrollmentDetailDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
