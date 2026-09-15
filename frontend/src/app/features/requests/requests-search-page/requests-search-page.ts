import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, signal, untracked } from '@angular/core';
import { CurrentUser } from '../../../core/services/current-user';
import { Requests } from '../../../core/services/requests';
import {
  PagedResult,
  RequestDto,
  RequestSearchFilters,
  RequestSearchParams,
  SortDirection,
  SortField,
  ValidationProblemDetails,
  emptyFilters,
} from '../../../core/models/request.model';
import { RequestFilterForm } from '../request-filter-form/request-filter-form';
import { RequestTable } from '../request-table/request-table';

const PAGE_SIZE = 25;

@Component({
  selector: 'app-requests-search-page',
  imports: [RequestFilterForm, RequestTable],
  templateUrl: './requests-search-page.html',
  styleUrl: './requests-search-page.scss',
})
export class RequestsSearchPage {
  private readonly requestsService = inject(Requests);
  private readonly currentUser = inject(CurrentUser);

  protected readonly filters = signal<RequestSearchFilters>(emptyFilters());
  protected readonly sortBy = signal<SortField>('CreatedAt');
  protected readonly sortDir = signal<SortDirection>('Descending');
  protected readonly page = signal(1);

  protected readonly result = signal<PagedResult<RequestDto> | null>(null);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    // Re-run the search whenever the simulated user identity changes (admin toggle,
    // user id) - and once on startup. This is what makes server-side authorization
    // visibly demonstrable: the client just asks again as whoever is selected right now.
    //
    // runSearch() itself reads other signals (page, filters, sort) that must NOT become
    // dependencies of this effect - otherwise every page/filter/sort change would trigger
    // it a second time on top of the explicit runSearch() call already made by the event
    // handlers below. untracked() keeps this effect scoped to only the identity signals.
    effect(() => {
      this.currentUser.userId();
      this.currentUser.isAdministrator();
      untracked(() => {
        this.page.set(1);
        this.runSearch();
      });
    });
  }

  protected onFiltersSubmitted(filters: RequestSearchFilters): void {
    this.filters.set(filters);
    this.page.set(1);
    this.runSearch();
  }

  protected onSortChange(field: SortField): void {
    if (this.sortBy() === field) {
      this.sortDir.set(this.sortDir() === 'Ascending' ? 'Descending' : 'Ascending');
    } else {
      this.sortBy.set(field);
      this.sortDir.set('Ascending');
    }
    this.page.set(1);
    this.runSearch();
  }

  protected onPageChange(page: number): void {
    this.page.set(page);
    this.runSearch();
  }

  private runSearch(): void {
    const params: RequestSearchParams = {
      ...this.filters(),
      sortBy: this.sortBy(),
      sortDir: this.sortDir(),
      page: this.page(),
      pageSize: PAGE_SIZE,
    };

    this.loading.set(true);
    this.errorMessage.set(null);

    this.requestsService.search(params).subscribe({
      next: (result) => {
        this.result.set(result);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.result.set(null);
        this.errorMessage.set(this.describeError(err));
        this.loading.set(false);
      },
    });
  }

  private describeError(err: HttpErrorResponse): string {
    const problem = err.error as ValidationProblemDetails | undefined;
    if (err.status === 400 && problem?.errors) {
      return Object.values(problem.errors).flat().join(' ');
    }
    return 'Something went wrong while loading requests. Please try again.';
  }
}
