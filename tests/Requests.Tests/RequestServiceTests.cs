using Requests.Application.Requests;
using Requests.Domain.Entities;
using Xunit;

namespace Requests.Tests;

// These tests exercise RequestService's orchestration only (mapping to DTOs, wrapping in
// PagedResult, passing the criteria through). The actual filter/sort/paging query logic
// lives in RequestRepository and is covered separately in RequestRepositorySearchTests,
// against a real EF Core DbContext.
public class RequestServiceTests
{
    [Fact]
    public async Task MapsRepositoryResultsToDtosAndPreservesPagingInfo()
    {
        var repository = new SpyRequestRepository(
            items:
            [
                Create(1, ownerId: 1, assignedTo: 2),
                Create(2, ownerId: 3, assignedTo: 4)
            ],
            totalCount: 57);

        var service = new RequestService(repository);

        var criteria = DefaultCriteria() with { Page = 3, PageSize = 10 };
        var result = await service.SearchRequestsAsync(criteria);

        Assert.Equal(2, result.Items.Count);
        Assert.Equal(57, result.TotalCount);
        Assert.Equal(3, result.Page);
        Assert.Equal(10, result.PageSize);
        Assert.Equal(1, result.Items[0].Id);
        Assert.Equal("REQ-001", result.Items[0].RequestNumber);
    }

    [Fact]
    public async Task PassesTheGivenCriteriaThroughToTheRepositoryUnchanged()
    {
        var repository = new SpyRequestRepository(items: [], totalCount: 0);
        var service = new RequestService(repository);

        var criteria = DefaultCriteria() with { CurrentUserId = 5, IsAdministrator = false };
        await service.SearchRequestsAsync(criteria);

        Assert.NotNull(repository.LastCriteria);
        Assert.Equal(5, repository.LastCriteria!.CurrentUserId);
        Assert.False(repository.LastCriteria.IsAdministrator);
    }

    private static RequestSearchCriteria DefaultCriteria()
        => new(
            CurrentUserId: 1,
            IsAdministrator: true,
            RequestNumber: null,
            Statuses: null,
            Types: null,
            CreatedFrom: null,
            CreatedTo: null,
            SortBy: RequestSortField.CreatedAt,
            SortDirection: SortDirection.Descending,
            Page: 1,
            PageSize: 25);

    private static Request Create(int id, int ownerId, int assignedTo)
        => new()
        {
            Id = id,
            RequestNumber = $"REQ-{id:000}",
            CustomerId = id,
            OwnerId = ownerId,
            AssignedToUserId = assignedTo,
            Status = RequestStatus.New,
            RequestType = RequestType.General,
            CreatedAt = DateTime.UtcNow
        };

    private sealed class SpyRequestRepository : IRequestRepository
    {
        private readonly List<Request> _items;
        private readonly int _totalCount;

        public SpyRequestRepository(List<Request> items, int totalCount)
        {
            _items = items;
            _totalCount = totalCount;
        }

        public RequestSearchCriteria? LastCriteria { get; private set; }

        public Task<(IReadOnlyList<Request> Items, int TotalCount)> SearchAsync(
            RequestSearchCriteria criteria,
            CancellationToken cancellationToken = default)
        {
            LastCriteria = criteria;
            return Task.FromResult(((IReadOnlyList<Request>)_items, _totalCount));
        }
    }
}
