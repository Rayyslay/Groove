using Backend.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// =====================
// SERVICES (before Build)
// =====================

// Controllers
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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
app.UseSwagger();
app.UseSwaggerUI();

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
