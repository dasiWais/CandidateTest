namespace Requests.Api.Models;

/// <summary>
/// Parses multi-value enum query parameters (e.g. <c>?statuses=New&amp;statuses=InProgress</c>)
/// with a precise, testable error message per invalid value - rather than relying on default
/// list-of-enum model binding, whose failure behavior is less predictable.
/// </summary>
internal static class EnumQueryParser
{
    public static bool TryParseAll<TEnum>(string[]? rawValues, out List<TEnum>? parsed, out string? error)
        where TEnum : struct, Enum
    {
        parsed = null;
        error = null;

        if (rawValues is null || rawValues.Length == 0)
        {
            return true;
        }

        var result = new List<TEnum>(rawValues.Length);
        foreach (var raw in rawValues)
        {
            if (!Enum.TryParse<TEnum>(raw, ignoreCase: true, out var value) || !Enum.IsDefined(value))
            {
                var allowed = string.Join(", ", Enum.GetNames<TEnum>());
                error = $"Invalid value '{raw}'. Allowed values: {allowed}.";
                return false;
            }

            result.Add(value);
        }

        parsed = result;
        return true;
    }
}
