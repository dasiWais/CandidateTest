using Requests.Domain.Entities;

namespace Requests.Application.Requests;

public enum RequestSortField
{
    RequestNumber,
    CustomerId,
    Status,
    RequestType,
    CreatedAt
}

public enum SortDirection
{
    Ascending,
    Descending
}

public sealed record RequestSearchCriteria(
    int CurrentUserId,
    bool IsAdministrator,
    string? RequestNumber,
    IReadOnlyCollection<RequestStatus>? Statuses,
    IReadOnlyCollection<RequestType>? Types,
    DateTime? CreatedFrom,
    DateTime? CreatedTo,
    RequestSortField SortBy,
    SortDirection SortDirection,
    int Page,
    int PageSize);
