export enum RequestStatus {
  New = 1,
  InProgress = 2,
  Completed = 3,
  Cancelled = 4,
}

export enum RequestType {
  General = 1,
  Legal = 2,
  Payment = 3,
  Appeal = 4,
}

export const ALL_STATUSES = [
  RequestStatus.New,
  RequestStatus.InProgress,
  RequestStatus.Completed,
  RequestStatus.Cancelled,
] as const;

export const ALL_TYPES = [
  RequestType.General,
  RequestType.Legal,
  RequestType.Payment,
  RequestType.Appeal,
] as const;

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  [RequestStatus.New]: 'New',
  [RequestStatus.InProgress]: 'In Progress',
  [RequestStatus.Completed]: 'Completed',
  [RequestStatus.Cancelled]: 'Cancelled',
};

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  [RequestType.General]: 'General',
  [RequestType.Legal]: 'Legal',
  [RequestType.Payment]: 'Payment',
  [RequestType.Appeal]: 'Appeal',
};

export interface RequestDto {
  id: number;
  requestNumber: string;
  customerId: number;
  ownerId: number;
  assignedToUserId: number | null;
  status: RequestStatus;
  requestType: RequestType;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export type SortField = 'RequestNumber' | 'CustomerId' | 'Status' | 'RequestType' | 'CreatedAt';
export type SortDirection = 'Ascending' | 'Descending';

/** What the filter form produces. */
export interface RequestSearchFilters {
  requestNumber: string;
  statuses: RequestStatus[];
  types: RequestType[];
  createdFrom: string | null; // yyyy-MM-dd, from <input type="date">
  createdTo: string | null;
}

export function emptyFilters(): RequestSearchFilters {
  return { requestNumber: '', statuses: [], types: [], createdFrom: null, createdTo: null };
}

/** Everything the search page needs to ask the API for one page of results. */
export interface RequestSearchParams extends RequestSearchFilters {
  sortBy: SortField;
  sortDir: SortDirection;
  page: number;
  pageSize: number;
}

/** Shape of ASP.NET Core's automatic 400 response for invalid input. */
export interface ValidationProblemDetails {
  title?: string;
  errors?: Record<string, string[]>;
}
