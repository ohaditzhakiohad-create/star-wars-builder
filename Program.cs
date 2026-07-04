using System.Text.Json;
using Microsoft.AspNetCore.StaticFiles;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();

var app = builder.Build();
var webRoot = Path.Combine(Directory.GetCurrentDirectory(), "public");
var dataDir = Path.Combine(Directory.GetCurrentDirectory(), "data");
var scoresFile = Path.Combine(dataDir, "scores.json");

Directory.CreateDirectory(dataDir);
if (!File.Exists(scoresFile))
{
    File.WriteAllText(scoresFile, "[]");
}

var categories = new Dictionary<string, List<CharacterOption>>
{
    ["forceStrength"] = new()
    {
        new("Palpatine", 20, "/images/palpatine.png"),
        new("Vader", 17, "/images/darthvader.jpeg"),
        new("Windu", 12, "/images/MaceWindu.jpeg"),
        new("Obi-Wan", 8, "/images/obiwan.jpeg"),
        new("Ezra", 0, "/images/ezra.jpeg")
    },
    ["master"] = new()
    {
        new("Yoda", 20, "/images/yoda.png"),
        new("Dooku", 15, "/images/dooku.webp"),
        new("Obi-Wan", 12, "/images/obiwan.jpeg"),
        new("Kit Fisto", 7, "/images/kitfisto.jpeg"),
        new("Coleman Trebor", 0, "/images/colemantrebor.webp")
    },
    ["lightsaberSkills"] = new()
    {
        new("Anakin Skywalker", 20, "/images/anakin.jpeg"),
        new("Luke Skywalker", 18, "/images/luke.jpeg"),
        new("Darth Maul", 12, "/images/darthmaul.webp"),
        new("3rd Sister Reva", 5, "/images/reva.jpeg"),
        new("Princess Leia", 0, "/images/leia.jpg")
    },
    ["pilotingSkills"] = new()
    {
        new("Anakin Skywalker", 20, "/images/anakin.jpeg"),
        new("Han Solo", 18, "/images/hansolo.jpg"),
        new("Lando", 13, "/images/lando.webp"),
        new("Rey Skywalker", 6, "/images/rey.jpeg"),
        new("Ratts Tyerell", 0, "/images/ratts.jpeg")
    },
    ["tacticalIntelligence"] = new()
    {
        new("Palpatine", 20, "/images/palpatine.png"),
        new("Obi-Wan Kenobi", 16, "/images/obiwan.jpeg"),
        new("Qui-Gon Jinn", 12, "/images/quigon.png"),
        new("Ahsoka", 8, "/images/ahsoka.jpeg"),
        new("Rey Skywalker", 0, "/images/rey.jpeg")
    }
};

var categoryLabels = new Dictionary<string, string>
{
    ["forceStrength"] = "Force Strength",
    ["master"] = "Master",
    ["lightsaberSkills"] = "Lightsaber Skills",
    ["pilotingSkills"] = "Piloting Skills",
    ["tacticalIntelligence"] = "Tactical Intelligence"
};

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(webRoot),
    RequestPath = ""
});

app.MapPost("/api/randomize", async (HttpContext context) =>
{
    using var reader = new StreamReader(context.Request.Body);
    var json = await reader.ReadToEndAsync();
    var body = JsonSerializer.Deserialize<RandomizeRequest>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    var locked = body?.Locked ?? new Dictionary<string, CharacterOption>();

    var state = new Dictionary<string, object>();
    foreach (var key in categories.Keys)
    {
        if (locked.ContainsKey(key))
        {
            var lockedOption = locked[key];
            state[key] = new
            {
                name = lockedOption.Name,
                points = lockedOption.Points,
                image = lockedOption.Image,
                locked = true,
                category = categoryLabels[key]
            };
        }
        else
        {
            var option = categories[key][Random.Shared.Next(categories[key].Count)];
            state[key] = new
            {
                name = option.Name,
                points = option.Points,
                image = option.Image,
                locked = false,
                category = categoryLabels[key]
            };
        }
    }

    return Results.Json(new { state });
});

app.MapGet("/api/scores", () =>
{
    var scores = File.Exists(scoresFile)
        ? JsonSerializer.Deserialize<List<ScoreEntry>>(File.ReadAllText(scoresFile)) ?? new List<ScoreEntry>()
        : new List<ScoreEntry>();

    scores = scores.OrderByDescending(s => s.TotalScore).ThenByDescending(s => s.Percentile).ToList();
    return Results.Json(scores);
});

app.MapPost("/api/scores", async (HttpContext context) =>
{
    using var reader = new StreamReader(context.Request.Body);
    var json = await reader.ReadToEndAsync();
    var payload = JsonSerializer.Deserialize<ScorePayload>(json, new JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true
    });

    if (payload == null || string.IsNullOrWhiteSpace(payload.Username) || payload.Selections == null || payload.TotalScore is null || payload.Percentile is null)
    {
        return Results.BadRequest(new { error = "Missing or invalid required fields." });
    }

    var scores = File.Exists(scoresFile)
        ? JsonSerializer.Deserialize<List<ScoreEntry>>(File.ReadAllText(scoresFile)) ?? new List<ScoreEntry>()
        : new List<ScoreEntry>();

    var entry = new ScoreEntry
    {
        Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString(),
        Username = payload.Username.Trim().Substring(0, Math.Min(20, payload.Username.Trim().Length)),
        Selections = payload.Selections,
        TotalScore = payload.TotalScore.Value,
        Percentile = payload.Percentile.Value,
        CreatedAt = DateTimeOffset.UtcNow.ToString("O")
    };

    scores.Add(entry);
    scores = scores.OrderByDescending(s => s.TotalScore).ThenByDescending(s => s.Percentile).ToList();
    File.WriteAllText(scoresFile, JsonSerializer.Serialize(scores, new JsonSerializerOptions { WriteIndented = true }));

    return Results.Created($"/api/scores/{entry.Id}", new { success = true, entry });
});

app.MapGet("/", (HttpContext context) =>
{
    context.Response.Redirect("/index.html");
    return Task.CompletedTask;
});

app.MapFallback(async context =>
{
    var indexFile = Path.Combine(webRoot, "index.html");
    if (File.Exists(indexFile))
    {
        context.Response.ContentType = "text/html; charset=utf-8";
        await context.Response.SendFileAsync(indexFile);
    }
    else
    {
        context.Response.StatusCode = 404;
    }
});

app.Run("http://localhost:3012");

public record CharacterOption(string Name, int Points, string Image);
public record RandomizeRequest(Dictionary<string, CharacterOption>? Locked);
public class ScoreEntry
{
    public string? Id { get; set; }
    public string? Username { get; set; }
    public List<Selection>? Selections { get; set; }
    public int TotalScore { get; set; }
    public int Percentile { get; set; }
    public string? CreatedAt { get; set; }
}

public class Selection
{
    public string? Category { get; set; }
    public string? Name { get; set; }
    public int Points { get; set; }
    public string? Image { get; set; }
}

public class ScorePayload
{
    public string? Username { get; set; }
    public List<Selection>? Selections { get; set; }
    public int? TotalScore { get; set; }
    public int? Percentile { get; set; }
}
