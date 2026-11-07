import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentDetailDialog } from './student-detail-dialog';

describe('StudentDetailDialog', () => {
  let component: StudentDetailDialog;
  let fixture: ComponentFixture<StudentDetailDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentDetailDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentDetailDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
