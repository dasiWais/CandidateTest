using Microsoft.EntityFrameworkCore;
using Requests.Application.Requests;
using Requests.Domain.Entities;
using Requests.Infrastructure.Persistence;
using Requests.Infrastructure.Repositories;
using Xunit;

namespace Requests.Tests;

// Unlike RequestServiceTests (which uses a fake repository to test orchestration),
// these tests run against a real EF Core DbContext (InMemory provider) to verify that
// RequestRepository actually translates search criteria into a correct query: filtering,
// authorization scoping, sorting (including the paging tiebreaker) and Skip/Take paging.
public class RequestRepositorySearchTests
{
    [Fact]
    public async Task Administrator_SeesRequestsRegardlessOfOwnerOrAssignee()
    {
        var repository = await CreateRepositoryAsync(
            Create(1, ownerId: 1, assignedTo: 2),
            Create(2, ownerId: 3, assignedTo: 4));

        var (items, totalCount) = await repository.SearchAsync(DefaultCriteria() with
        {
            CurrentUserId = 1,
            IsAdministrator = true
        });

        Assert.Equal(2, totalCount);
        Assert.Equal(2, items.Count);
    }

    [Fact]
    public async Task RegularUser_OnlySeesOwnedOrAssignedRequests()
    {
        var repository = await CreateRepositoryAsync(
            Create(1, ownerId: 1, assignedTo: 5),
            Create(2, ownerId: 3, assignedTo: 1),
            Create(3, ownerId: 3, assignedTo: 5));

        var (items, totalCount) = await repository.SearchAsync(DefaultCriteria() with
        {
            CurrentUserId = 1,
            IsAdministrator = false
        });

        Assert.Equal(2, totalCount);
        Assert.DoesNotContain(items, x => x.Id == 3);
    }

    [Fact]
    public async Task FiltersByPartialRequestNumber()
    {
        var repository = await CreateRepositoryAsync(
            Create(1, requestNumber: "REQ-000001"),
            Create(2, requestNumber: "REQ-000002"),
            Create(3, requestNumber: "OTHER-000001"));

        var (items, totalCount) = await repository.SearchAsync(DefaultCriteria() with
        {
            RequestNumber = "REQ-"
        });

        Assert.Equal(2, totalCount);
        Assert.All(items, x => Assert.StartsWith("REQ-", x.RequestNumber));
    }

    [Fact]
    public async Task FiltersByMultipleStatuses()
    {
        var repository = await CreateRepositoryAsync(
            Create(1, status: RequestStatus.New),
            Create(2, status: RequestStatus.InProgress),
            Create(3, status: RequestStatus.Completed));

        var (items, totalCount) = await repository.SearchAsync(DefaultCriteria() with
        {
            Statuses = [RequestStatus.New, RequestStatus.Completed]
        });

        Assert.Equal(2, totalCount);
        Assert.DoesNotContain(items, x => x.Id == 2);
    }

    [Fact]
    public async Task FiltersByRequestType()
    {
        var repository = await CreateRepositoryAsync(
            Create(1, type: RequestType.Legal),
            Create(2, type: RequestType.Payment));

        var (items, totalCount) = await repository.SearchAsync(DefaultCriteria() with
        {
            Types = [RequestType.Legal]
        });

        Assert.Equal(1, totalCount);
        Assert.Equal(1, items[0].Id);
    }

    [Fact]
    public async Task FiltersByCreatedDateRange()
    {
        var now = DateTime.UtcNow;
        var repository = await CreateRepositoryAsync(
            Create(1, createdAt: now.AddDays(-10)),
            Create(2, createdAt: now.AddDays(-5)),
            Create(3, createdAt: now));

        var (items, totalCount) = await repository.SearchAsync(DefaultCriteria() with
        {
            CreatedFrom = now.AddDays(-6),
            CreatedTo = now.AddDays(-1)
        });

        Assert.Equal(1, totalCount);
        Assert.Equal(2, items[0].Id);
    }

    [Fact]
    public async Task SortsByRequestedFieldAndBreaksTiesById()
    {
        var repository = await CreateRepositoryAsync(
            Create(3, status: RequestStatus.New),
            Create(1, status: RequestStatus.New),
            Create(2, status: RequestStatus.New));

        var (items, _) = await repository.SearchAsync(DefaultCriteria() with
        {
            SortBy = RequestSortField.Status,
            SortDirection = SortDirection.Ascending
        });

        // All three share the same Status, so the Id tiebreaker must decide the order.
        Assert.Equal([1, 2, 3], items.Select(x => x.Id));
    }

    [Fact]
    public async Task PagesResultsAndReturnsTotalCountBeforePaging()
    {
        var repository = await CreateRepositoryAsync(
            Enumerable.Range(1, 25).Select(i => Create(i)).ToArray());

        var (items, totalCount) = await repository.SearchAsync(DefaultCriteria() with
        {
            SortBy = RequestSortField.CustomerId,
            SortDirection = SortDirection.Ascending,
            Page = 2,
            PageSize = 10
        });

        Assert.Equal(25, totalCount);
        Assert.Equal(10, items.Count);
        Assert.Equal([11, 12, 13, 14, 15, 16, 17, 18, 19, 20], items.Select(x => x.Id));
    }

    private static async Task<RequestRepository> CreateRepositoryAsync(params Request[] requests)
    {
        var options = new DbContextOptionsBuilder<RequestsDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var db = new RequestsDbContext(options);
        db.Requests.AddRange(requests);
        await db.SaveChangesAsync();

        return new RequestRepository(db);
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
            PageSize: 50);

    private static Request Create(
        int id,
        int ownerId = 1,
        int assignedTo = 1,
        string? requestNumber = null,
        RequestStatus status = RequestStatus.New,
        RequestType type = RequestType.General,
        DateTime? createdAt = null)
        => new()
        {
            Id = id,
            RequestNumber = requestNumber ?? $"REQ-{id:000}",
            CustomerId = id,
            OwnerId = ownerId,
            AssignedToUserId = assignedTo,
            Status = status,
            RequestType = type,
            CreatedAt = createdAt ?? DateTime.UtcNow
        };
}
