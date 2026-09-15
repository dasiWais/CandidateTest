namespace Requests.Application.Requests;

public interface IRequestService
{
    Task<PagedResult<RequestDto>> SearchRequestsAsync(
        RequestSearchCriteria criteria,
        CancellationToken cancellationToken = default);
}
