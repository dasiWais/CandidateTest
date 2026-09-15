import { Component, computed, output, signal } from '@angular/core';
import {
  ALL_STATUSES,
  ALL_TYPES,
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  RequestSearchFilters,
  RequestStatus,
  RequestType,
  emptyFilters,
} from '../../../core/models/request.model';

// Request numbers are of the form "REQ-000123" (see DbSeeder) - letters, digits and
// hyphens only. Rejecting anything else client-side gives immediate feedback instead of
// a silent "no results" for input that could never match a real request number.
const REQUEST_NUMBER_PATTERN = /^[A-Za-z0-9-]*$/;

@Component({
  selector: 'app-request-filter-form',
  imports: [],
  templateUrl: './request-filter-form.html',
  styleUrl: './request-filter-form.scss',
})
export class RequestFilterForm {
  protected readonly statusOptions = ALL_STATUSES;
  protected readonly typeOptions = ALL_TYPES;
  protected readonly statusLabels = REQUEST_STATUS_LABELS;
  protected readonly typeLabels = REQUEST_TYPE_LABELS;

  protected readonly requestNumber = signal('');
  protected readonly selectedStatuses = signal<RequestStatus[]>([]);
  protected readonly selectedTypes = signal<RequestType[]>([]);
  protected readonly createdFrom = signal<string | null>(null);
  protected readonly createdTo = signal<string | null>(null);
  protected readonly dateRangeError = signal<string | null>(null);

  protected readonly requestNumberError = computed(() =>
    REQUEST_NUMBER_PATTERN.test(this.requestNumber())
      ? null
      : 'Request number can only contain letters, digits and hyphens (-).',
  );

  readonly search = output<RequestSearchFilters>();

  protected onRequestNumberInput(event: Event): void {
    this.requestNumber.set((event.target as HTMLInputElement).value);
  }

  protected onCreatedFromInput(event: Event): void {
    this.createdFrom.set((event.target as HTMLInputElement).value || null);
  }

  protected onCreatedToInput(event: Event): void {
    this.createdTo.set((event.target as HTMLInputElement).value || null);
  }

  protected onStatusChange(status: RequestStatus, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedStatuses.update((current) =>
      checked ? [...current, status] : current.filter((s) => s !== status),
    );
  }

  protected onTypeChange(type: RequestType, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedTypes.update((current) =>
      checked ? [...current, type] : current.filter((t) => t !== type),
    );
  }

  protected onSubmit(event: SubmitEvent): void {
    // FormsModule isn't imported here (no ngModel/reactive forms needed for a handful of
    // plain inputs), so Angular's (ngSubmit) - which comes from FormsModule's NgForm
    // directive - isn't available. Handling the native (submit) event and calling
    // preventDefault() ourselves avoids a real HTTP form submission / page reload.
    event.preventDefault();

    if (this.requestNumberError()) {
      // Field already shows the error live as the user types; re-checking here just
      // makes sure an invalid value can never actually be submitted.
      return;
    }

    const from = this.createdFrom();
    const to = this.createdTo();
    if (from && to && from > to) {
      this.dateRangeError.set('"Created from" must be on or before "Created to".');
      return;
    }
    this.dateRangeError.set(null);

    this.search.emit({
      requestNumber: this.requestNumber(),
      statuses: this.selectedStatuses(),
      types: this.selectedTypes(),
      createdFrom: from,
      createdTo: to,
    });
  }

  protected onClear(): void {
    this.requestNumber.set('');
    this.selectedStatuses.set([]);
    this.selectedTypes.set([]);
    this.createdFrom.set(null);
    this.createdTo.set(null);
    this.dateRangeError.set(null);
    this.search.emit(emptyFilters());
  }
}
