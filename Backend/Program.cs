var builder = WebApplication.CreateBuilder(args);

// =====================
// SERVICES (before Build)
// =====================

builder.Services.AddControllers();

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
