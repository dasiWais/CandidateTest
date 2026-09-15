import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RequestsSearchPage } from './requests-search-page';

describe('RequestsSearchPage', () => {
  let fixture: ComponentFixture<RequestsSearchPage>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestsSearchPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestsSearchPage);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges(); // triggers the initial search via the constructor effect
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('shows the empty state when the API returns no items', () => {
    httpMock
      .expectOne(() => true)
      .flush({ items: [], totalCount: 0, page: 1, pageSize: 25 });
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('No requests match your filters');
  });

  it('shows a readable message when the API rejects the request', () => {
    httpMock.expectOne(() => true).flush(
      { errors: { CreatedTo: ['createdTo must be greater than or equal to createdFrom.'] } },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('createdTo must be greater than or equal to createdFrom.');
  });
});
