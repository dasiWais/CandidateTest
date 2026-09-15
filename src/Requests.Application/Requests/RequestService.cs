namespace Requests.Application.Requests;

public sealed class RequestService : IRequestService
{
    private readonly IRequestRepository _repository;

    public RequestService(IRequestRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<RequestDto>> SearchRequestsAsync(
        RequestSearchCriteria criteria,
        CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await _repository.SearchAsync(criteria, cancellationToken);

        var dtos = items
            .Select(x => new RequestDto(
                x.Id,
                x.RequestNumber,
                x.CustomerId,
                x.OwnerId,
                x.AssignedToUserId,
                x.Status,
                x.RequestType,
                x.CreatedAt))
            .ToList();

        return new PagedResult<RequestDto>(dtos, totalCount, criteria.Page, criteria.PageSize);
    }
}
