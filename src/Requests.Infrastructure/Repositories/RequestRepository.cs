using Microsoft.EntityFrameworkCore;
using Requests.Application.Requests;
using Requests.Domain.Entities;
using Requests.Infrastructure.Persistence;

namespace Requests.Infrastructure.Repositories;

public sealed class RequestRepository : IRequestRepository
{
    private readonly RequestsDbContext _db;

    public RequestRepository(RequestsDbContext db)
    {
        _db = db;
    }

    public async Task<(IReadOnlyList<Request> Items, int TotalCount)> SearchAsync(
        RequestSearchCriteria criteria,
        CancellationToken cancellationToken = default)
    {
        var query = _db.Requests.AsNoTracking();

        // Authorization is enforced here, as part of the same query that applies the
        // other filters - never by fetching everything and filtering in memory.
        if (!criteria.IsAdministrator)
        {
            query = query.Where(r =>
                r.OwnerId == criteria.CurrentUserId || r.AssignedToUserId == criteria.CurrentUserId);
        }

        if (!string.IsNullOrWhiteSpace(criteria.RequestNumber))
        {
            query = query.Where(r => r.RequestNumber.Contains(criteria.RequestNumber));
        }

        if (criteria.Statuses is { Count: > 0 })
        {
            query = query.Where(r => criteria.Statuses.Contains(r.Status));
        }

        if (criteria.Types is { Count: > 0 })
        {
            query = query.Where(r => criteria.Types.Contains(r.RequestType));
        }

        if (criteria.CreatedFrom is { } from)
        {
            query = query.Where(r => r.CreatedAt >= from);
        }

        if (criteria.CreatedTo is { } to)
        {
            query = query.Where(r => r.CreatedAt <= to);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        query = ApplySort(query, criteria.SortBy, criteria.SortDirection);

        var items = await query
            .Skip((criteria.Page - 1) * criteria.PageSize)
            .Take(criteria.PageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    private static IQueryable<Request> ApplySort(
        IQueryable<Request> query,
        RequestSortField sortBy,
        SortDirection sortDirection)
    {
        var ascending = sortDirection == SortDirection.Ascending;

        query = sortBy switch
        {
            RequestSortField.RequestNumber => ascending
                ? query.OrderBy(r => r.RequestNumber)
                : query.OrderByDescending(r => r.RequestNumber),
            RequestSortField.CustomerId => ascending
                ? query.OrderBy(r => r.CustomerId)
                : query.OrderByDescending(r => r.CustomerId),
            RequestSortField.Status => ascending
                ? query.OrderBy(r => r.Status)
                : query.OrderByDescending(r => r.Status),
            RequestSortField.RequestType => ascending
                ? query.OrderBy(r => r.RequestType)
                : query.OrderByDescending(r => r.RequestType),
            RequestSortField.CreatedAt => ascending
                ? query.OrderBy(r => r.CreatedAt)
                : query.OrderByDescending(r => r.CreatedAt),
            _ => query.OrderByDescending(r => r.CreatedAt)
        };

        // Tiebreaker: without a unique secondary sort key, Skip/Take over a non-unique
        // sort column (e.g. Status) can return inconsistent or duplicate rows across pages.
        return ((IOrderedQueryable<Request>)query).ThenBy(r => r.Id);
    }
}
