using testSite1.Data;
using Microsoft.EntityFrameworkCore;
using testSite1.Components;

var builder = WebApplication.CreateBuilder(args);

// --------------------------------------
// 1) Register PostgreSQL + EF Core
// --------------------------------------
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// --------------------------------------
// 2) Add Razor / Blazor services
// --------------------------------------
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

// --------------------------------------
// 3) Build the app
// --------------------------------------
var app = builder.Build();

// --------------------------------------
// 4) Middleware pipeline
// --------------------------------------
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStatusCodePagesWithReExecute("/not-found", createScopeForStatusCodePages: true);

app.UseAntiforgery();

// --------------------------------------
// 5) Map components
// --------------------------------------
app.MapStaticAssets();
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

// --------------------------------------
// 6) Run
// --------------------------------------
app.Run();
