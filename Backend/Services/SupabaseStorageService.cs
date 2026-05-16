using System.Net.Http.Headers;

namespace Backend.Services;

public class SupabaseStorageService
{
    private readonly HttpClient _http;
    private readonly string _bucket;
    private readonly string _supabaseUrl;

    public SupabaseStorageService(HttpClient http, IConfiguration config)
    {
        _supabaseUrl = config["Supabase:Url"]!.TrimEnd('/');
        _bucket = config["Supabase:Bucket"] ?? "media";

        _http = http;
        _http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", config["Supabase:ServiceRoleKey"]);
    }

    public async Task<string> UploadAsync(Stream fileStream, string storagePath, string contentType)
    {
        var url = $"{_supabaseUrl}/storage/v1/object/{_bucket}/{storagePath}";

        using var content = new StreamContent(fileStream);
        content.Headers.ContentType = new MediaTypeHeaderValue(contentType);

        var response = await _http.PostAsync(url, content);
        response.EnsureSuccessStatusCode();

        return $"{_supabaseUrl}/storage/v1/object/public/{_bucket}/{storagePath}";
    }
}
