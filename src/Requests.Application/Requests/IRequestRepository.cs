using Requests.Domain.Entities;

namespace Requests.Application.Requests;

public interface IRequestRepository
{
    Task<(IReadOnlyList<Request> Items, int TotalCount)> SearchAsync(
        RequestSearchCriteria criteria,
        CancellationToken cancellationToken = default);
}
