using Microsoft.EntityFrameworkCore;
using Requests.Domain.Entities;

namespace Requests.Infrastructure.Persistence;

public class RequestsDbContext : DbContext
{
    public RequestsDbContext(DbContextOptions<RequestsDbContext> options) : base(options)
    {
    }

    public DbSet<Request> Requests => Set<Request>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // These indexes target a real relational provider (SQL Server/PostgreSQL/etc).
        // The InMemory provider used for this exercise ignores indexes entirely, but the
        // shape documents the intended production schema for the columns the search API
        // filters and sorts by.
        modelBuilder.Entity<Request>(entity =>
        {
            entity.HasIndex(r => r.RequestNumber);
            entity.HasIndex(r => new { r.OwnerId, r.AssignedToUserId });
            entity.HasIndex(r => r.Status);
            entity.HasIndex(r => r.RequestType);
            entity.HasIndex(r => r.CreatedAt);
        });
    }
}
