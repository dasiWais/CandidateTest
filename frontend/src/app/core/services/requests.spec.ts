import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RequestSearchParams, RequestStatus, RequestType } from '../models/request.model';
import { Requests } from './requests';

describe('Requests', () => {
  let service: Requests;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Requests);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sends enum names (not numbers), repeats multi-value params, and extends createdTo to end of day', () => {
    const params: RequestSearchParams = {
      requestNumber: '  REQ-1  ',
      statuses: [RequestStatus.New, RequestStatus.InProgress],
      types: [RequestType.Legal],
      createdFrom: '2025-01-01',
      createdTo: '2025-06-01',
      sortBy: 'CreatedAt',
      sortDir: 'Descending',
      page: 2,
      pageSize: 25,
    };

    service.search(params).subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === '/api/requests' &&
        r.params.get('requestNumber') === 'REQ-1' &&
        r.params.getAll('statuses')?.join(',') === 'New,InProgress' &&
        r.params.getAll('types')?.join(',') === 'Legal' &&
        r.params.get('createdFrom') === '2025-01-01' &&
        r.params.get('createdTo') === '2025-06-01T23:59:59.999' &&
        r.params.get('page') === '2',
    );
    req.flush({ items: [], totalCount: 0, page: 2, pageSize: 25 });
  });

  it('omits empty/unset filters entirely instead of sending blank values', () => {
    const params: RequestSearchParams = {
      requestNumber: '',
      statuses: [],
      types: [],
      createdFrom: null,
      createdTo: null,
      sortBy: 'CreatedAt',
      sortDir: 'Descending',
      page: 1,
      pageSize: 25,
    };

    service.search(params).subscribe();

    const req = httpMock.expectOne(
      '/api/requests?sortBy=CreatedAt&sortDir=Descending&page=1&pageSize=25',
    );
    req.flush({ items: [], totalCount: 0, page: 1, pageSize: 25 });
  });
});
