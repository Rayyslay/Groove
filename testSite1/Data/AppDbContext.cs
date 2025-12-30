using Microsoft.EntityFrameworkCore;

namespace testSite1.Data;

public class AppDbContext : DbContext {
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {
    }
}
