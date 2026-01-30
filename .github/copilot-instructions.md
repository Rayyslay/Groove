Purpose
This file gives concise, actionable guidance to Copilot-style agents working on this repository: an ASP.NET 10.0 Blazor/interactive server app that also exposes minimal Web API controllers and uses EF Core with PostgreSQL.

**Architecture**
- **Type**: Blazor Server-style interactive Razor Components hosted in a minimal `WebApplication` (see [testSite1/Program.cs](testSite1/Program.cs#L1-L60)).
- **API surface**: Lightweight Web API controllers live under [testSite1/Controllers](testSite1/Controllers) (example: [testSite1/Controllers/TestController.cs](testSite1/Controllers/TestController.cs#L1-L12)).
- **Data**: EF Core DbContext `AppDbContext` is registered in `Program.cs` and implemented at [testSite1/Data/AppDbContext.cs](testSite1/Data/AppDbContext.cs#L1-L20). Connection string key: `DefaultConnection`.
- **Static assets & UI**: Razor components and pages are under `Components/` and `Pages/`; `wwwroot/` holds static assets. App maps components via `MapRazorComponents<App>()` and `MapStaticAssets()`.

**Build / Run / Debug**
- **Build**: from repo root or `testSite1` folder: `dotnet build testSite1` or `dotnet build testSite1/testSite1.csproj`.
- **Run (dev)**: use launch profiles from [testSite1/Properties/launchSettings.json](testSite1/Properties/launchSettings.json#L1-L40) or run directly:

```bash
dotnet run --project testSite1/testSite1.csproj
``` 

- **Launch profile example**: use the `https` profile to start with HTTPS and the Development environment. The app listens on ports shown in `launchSettings.json` (e.g. `https://localhost:7166`).
- **Quick API smoke test**: after running, verify API with `curl http://localhost:5078/api/test` (see `TestController`).

**Database & Migrations**
- **EF provider**: project references Npgsql (Postgres) and Microsoft.EntityFrameworkCore packages in [testSite1/testSite1.csproj](testSite1/testSite1.csproj). Use EF tools from repository root.
- **Common commands** (run from repository root or specify `-p`/`-s`):

```bash
dotnet ef migrations add Initial -p testSite1 -s testSite1
dotnet ef database update -p testSite1 -s testSite1
```

**Project Conventions & Patterns**
- **Minimal-hosting**: all DI/service registration and middleware lives in `Program.cs`. Add services there rather than scattering startup code.
- **Controllers**: decorated with `[ApiController]` and `[Route("api/<name>")]`. Prefer returning `IActionResult` and use standard status codes (see [TestController.cs](testSite1/Controllers/TestController.cs#L1-L12)).
- **Razor Components**: mapped with `MapRazorComponents<App>().AddInteractiveServerRenderMode()`. Interactive server rendering is expected—avoid client-only patterns unless adding a static Blazor WASM app.
- **Antiforgery**: `UseAntiforgery()` is present in middleware pipeline—maintain tokens when altering forms/JS calling server endpoints.

**Integration Points & Notable Dependencies**
- `Program.cs` registers `AddDbContext<AppDbContext>(options => options.UseNpgsql(...))` — connection string is in `appsettings*.json` under key `DefaultConnection`.
- Static web assets are mapped explicitly (`MapStaticAssets()`); keep `wwwroot/` and component CSS in sync with mapped routes.
- Both `Microsoft.EntityFrameworkCore.SqlServer` and `Npgsql.EntityFrameworkCore.PostgreSQL` package references exist—Postgres is used at runtime; be cautious before switching providers.

**Testing / Missing Tests**
- There are no unit/integration tests in the repo. When adding tests, follow the same target framework (`net10.0`) and place tests in a `tests/` folder at the repository root.

**What to change / Where to look**
- Config: [testSite1/appsettings.json](testSite1/appsettings.json) and [testSite1/appsettings.Development.json](testSite1/appsettings.Development.json).
- Service registration & routing: [testSite1/Program.cs](testSite1/Program.cs#L1-L100).
- Data model & migrations: [testSite1/Data/AppDbContext.cs](testSite1/Data/AppDbContext.cs#L1-L20) and add model classes under `Models/`.

If anything in this doc is unclear or you want more examples (e.g., a sample migration, controller pattern, or a dev debug run recipe), tell me which area to expand and I will iterate.
