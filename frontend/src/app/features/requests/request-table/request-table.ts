import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import {
  PagedResult,
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  RequestDto,
  SortDirection,
  SortField,
} from '../../../core/models/request.model';

interface ColumnDef {
  field: SortField;
  label: string;
}

@Component({
  selector: 'app-request-table',
  imports: [DatePipe],
  templateUrl: './request-table.html',
  styleUrl: './request-table.scss',
})
export class RequestTable {
  protected readonly statusLabels = REQUEST_STATUS_LABELS;
  protected readonly typeLabels = REQUEST_TYPE_LABELS;

  protected readonly columns: ColumnDef[] = [
    { field: 'RequestNumber', label: 'Request #' },
    { field: 'CustomerId', label: 'Customer' },
    { field: 'Status', label: 'Status' },
    { field: 'RequestType', label: 'Type' },
    { field: 'CreatedAt', label: 'Created' },
  ];

  readonly result = input<PagedResult<RequestDto> | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly sortBy = input<SortField>('CreatedAt');
  readonly sortDir = input<SortDirection>('Descending');

  readonly sortChange = output<SortField>();
  readonly pageChange = output<number>();

  protected readonly totalPages = computed(() => {
    const result = this.result();
    if (!result || result.pageSize === 0) {
      return 0;
    }
    return Math.max(1, Math.ceil(result.totalCount / result.pageSize));
  });

  protected sortIndicator(field: SortField): string {
    if (this.sortBy() !== field) {
      return '';
    }
    return this.sortDir() === 'Ascending' ? '▲' : '▼';
  }

  protected onHeaderClick(field: SortField): void {
    this.sortChange.emit(field);
  }

  protected goToPreviousPage(): void {
    const result = this.result();
    if (result && result.page > 1) {
      this.pageChange.emit(result.page - 1);
    }
  }

  protected goToNextPage(): void {
    const result = this.result();
    if (result && result.page < this.totalPages()) {
      this.pageChange.emit(result.page + 1);
    }
  }
}
