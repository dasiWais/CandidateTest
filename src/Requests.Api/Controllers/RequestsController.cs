using Microsoft.AspNetCore.Mvc;
using Requests.Api.Models;
using Requests.Application.Requests;
using Requests.Domain.Entities;

namespace Requests.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RequestsController : ControllerBase
{
    private readonly IRequestService _service;

    public RequestsController(IRequestService service)
    {
        _service = service;
    }

    // For the exercise, the current user is supplied through headers:
    // X-User-Id: integer
    // X-Is-Admin: true|false
    [HttpGet]
    public async Task<ActionResult<PagedResult<RequestDto>>> Get(
        [FromQuery] RequestSearchQuery query,
        CancellationToken cancellationToken)
    {
        if (!EnumQueryParser.TryParseAll<RequestStatus>(query.Statuses, out var statuses, out var statusError))
        {
            ModelState.AddModelError(nameof(query.Statuses), statusError!);
        }

        if (!EnumQueryParser.TryParseAll<RequestType>(query.Types, out var types, out var typeError))
        {
            ModelState.AddModelError(nameof(query.Types), typeError!);
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var userId = ParseUserId(Request.Headers["X-User-Id"].FirstOrDefault());
        var isAdmin = string.Equals(
            Request.Headers["X-Is-Admin"].FirstOrDefault(),
            "true",
            StringComparison.OrdinalIgnoreCase);

        var criteria = new RequestSearchCriteria(
            userId,
            isAdmin,
            query.RequestNumber,
            statuses,
            types,
            query.CreatedFrom,
            query.CreatedTo,
            query.SortBy,
            query.SortDir,
            query.Page,
            query.PageSize);

        var result = await _service.SearchRequestsAsync(criteria, cancellationToken);
        return Ok(result);
    }

    private static int ParseUserId(string? value)
        => int.TryParse(value, out var userId) ? userId : 1;
}
