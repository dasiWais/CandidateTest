import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RequestTable } from './request-table';

describe('RequestTable', () => {
  let component: RequestTable;
  let fixture: ComponentFixture<RequestTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestTable],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
