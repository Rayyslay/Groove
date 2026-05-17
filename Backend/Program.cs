using Backend.Data;
using Backend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// =====================
// SERVICES (before Build)
// =====================

// Controllers
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS — origins come from Cors:AllowedOrigins config / env var
var corsOrigins = builder.Configuration["Cors:AllowedOrigins"]
    ?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// DbContext (PostgreSQL)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

// Supabase Storage
builder.Services.AddHttpClient<SupabaseStorageService>();

// In-memory cache (used for the public user count, etc.)
builder.Services.AddMemoryCache();

// =====================
// JWT Authentication
// =====================

var jwtKey = builder.Configuration["JwtSettings:JWTkey"];

if (string.IsNullOrEmpty(jwtKey))
{
    throw new Exception("JWT Key is missing from configuration.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            )
        };
    });


// Authorization
builder.Services.AddAuthorization();

// =====================
// BUILD
// =====================

var app = builder.Build();

// Global Exception Handler
app.UseMiddleware<Backend.Middlewares.GlobalExceptionMiddleware>();

// Swagger (only in development recommended)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// =====================
// MIDDLEWARE
// =====================

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();   // IMPORTANT: before Authorization
app.UseAuthorization();

// =====================
// ENDPOINTS
// =====================

app.MapControllers();

app.Run();
