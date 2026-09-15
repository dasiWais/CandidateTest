import { HttpClient, HttpParams } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  PagedResult,
  RequestDto,
  RequestSearchParams,
  RequestStatus,
  RequestType,
} from '../models/request.model';

@Service()
export class Requests {
  private readonly http = inject(HttpClient);

  search(params: RequestSearchParams): Observable<PagedResult<RequestDto>> {
    let httpParams = new HttpParams()
      .set('sortBy', params.sortBy)
      .set('sortDir', params.sortDir)
      .set('page', params.page)
      .set('pageSize', params.pageSize);

    if (params.requestNumber.trim()) {
      httpParams = httpParams.set('requestNumber', params.requestNumber.trim());
    }

    if (params.createdFrom) {
      httpParams = httpParams.set('createdFrom', params.createdFrom);
    }

    if (params.createdTo) {
      // Include the whole day: a bare date binds to midnight on the .NET side, which
      // would otherwise exclude every request created later that same day.
      httpParams = httpParams.set('createdTo', `${params.createdTo}T23:59:59.999`);
    }

    // Numeric TS enums expose a reverse name lookup (RequestStatus[1] === 'New'); the API
    // expects the enum's name, not its numeric value (see EnumQueryParser on the backend).
    for (const status of params.statuses) {
      httpParams = httpParams.append('statuses', RequestStatus[status]);
    }

    for (const type of params.types) {
      httpParams = httpParams.append('types', RequestType[type]);
    }

    return this.http.get<PagedResult<RequestDto>>('/api/requests', { params: httpParams });
  }
}
