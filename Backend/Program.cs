using Backend.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// =====================
// SERVICES (before Build)
// =====================

// Controllers
builder.Services.AddControllers();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy
                .WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});

// DbContext (PostgreSQL)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

// =====================
// BUILD
// =====================

var app = builder.Build();

// =====================
// MIDDLEWARE
// =====================

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

// =====================
// ENDPOINTS
// =====================

app.MapControllers();

app.Run();
