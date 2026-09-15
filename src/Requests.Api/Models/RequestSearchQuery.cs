using System.ComponentModel.DataAnnotations;
using Requests.Application.Requests;

namespace Requests.Api.Models;

public sealed class RequestSearchQuery : IValidatableObject
{
    public string? RequestNumber { get; set; }

    /// <summary>Raw values, parsed and validated against <see cref="Domain.Entities.RequestStatus"/> in the controller.</summary>
    public string[]? Statuses { get; set; }

    /// <summary>Raw values, parsed and validated against <see cref="Domain.Entities.RequestType"/> in the controller.</summary>
    public string[]? Types { get; set; }

    public DateTime? CreatedFrom { get; set; }

    public DateTime? CreatedTo { get; set; }

    public RequestSortField SortBy { get; set; } = RequestSortField.CreatedAt;

    public SortDirection SortDir { get; set; } = SortDirection.Descending;

    [Range(1, int.MaxValue, ErrorMessage = "page must be 1 or greater.")]
    public int Page { get; set; } = 1;

    [Range(1, 200, ErrorMessage = "pageSize must be between 1 and 200.")]
    public int PageSize { get; set; } = 25;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (CreatedFrom is { } from && CreatedTo is { } to && from > to)
        {
            yield return new ValidationResult(
                "createdTo must be greater than or equal to createdFrom.",
                [nameof(CreatedTo)]);
        }
    }
}
