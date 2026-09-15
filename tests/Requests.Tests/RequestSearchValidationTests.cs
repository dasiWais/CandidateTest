using System.ComponentModel.DataAnnotations;
using Requests.Api.Models;
using Requests.Domain.Entities;
using Xunit;

namespace Requests.Tests;

public class RequestSearchValidationTests
{
    [Fact]
    public void CreatedToBeforeCreatedFrom_FailsValidation()
    {
        var query = new RequestSearchQuery
        {
            CreatedFrom = new DateTime(2025, 06, 01),
            CreatedTo = new DateTime(2025, 01, 01)
        };

        var results = Validate(query);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(RequestSearchQuery.CreatedTo)));
    }

    [Fact]
    public void CreatedToOnOrAfterCreatedFrom_PassesValidation()
    {
        var query = new RequestSearchQuery
        {
            CreatedFrom = new DateTime(2025, 01, 01),
            CreatedTo = new DateTime(2025, 06, 01)
        };

        Assert.Empty(Validate(query));
    }

    [Fact]
    public void PageBelowOne_FailsRangeValidation()
    {
        var query = new RequestSearchQuery { Page = 0 };

        var results = Validate(query, validateAllProperties: true);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(RequestSearchQuery.Page)));
    }

    [Fact]
    public void PageSizeAboveMaximum_FailsRangeValidation()
    {
        var query = new RequestSearchQuery { PageSize = 500 };

        var results = Validate(query, validateAllProperties: true);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(RequestSearchQuery.PageSize)));
    }

    [Fact]
    public void EnumQueryParser_RejectsUnknownStatusValue()
    {
        var ok = EnumQueryParser.TryParseAll<RequestStatus>(["Foo"], out var parsed, out var error);

        Assert.False(ok);
        Assert.Null(parsed);
        Assert.Contains("Foo", error);
        Assert.Contains(nameof(RequestStatus.New), error);
    }

    [Fact]
    public void EnumQueryParser_ParsesKnownValuesCaseInsensitively()
    {
        var ok = EnumQueryParser.TryParseAll<RequestStatus>(
            ["new", "InProgress"], out var parsed, out var error);

        Assert.True(ok);
        Assert.Null(error);
        Assert.Equal([RequestStatus.New, RequestStatus.InProgress], parsed);
    }

    [Fact]
    public void EnumQueryParser_ReturnsNullListWhenNoValuesGiven()
    {
        var ok = EnumQueryParser.TryParseAll<RequestStatus>(null, out var parsed, out var error);

        Assert.True(ok);
        Assert.Null(parsed);
        Assert.Null(error);
    }

    private static List<ValidationResult> Validate(RequestSearchQuery query, bool validateAllProperties = false)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(
            query,
            new ValidationContext(query),
            results,
            validateAllProperties);
        return results;
    }
}
