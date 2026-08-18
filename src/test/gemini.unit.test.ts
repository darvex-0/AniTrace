import { describe, it, expect, vi } from "vitest";
import { fetchTMDBAutocomplete, fetchAISuggestions } from "../lib/gemini";
import * as tmdbModule from "../lib/tmdb";

describe("White-Box Unit Testing: Gemini & TMDB Autocomplete Logic", () => {
  it("Path 1 (Branch): Fallback to TMDB when Gemini apiKey is empty string", async () => {
    const spySearchTMDB = vi.spyOn(tmdbModule, "searchTMDB").mockResolvedValueOnce({
      results: [
        {
          id: 101,
          name: "Naruto",
          media_type: "tv",
          first_air_date: "2002-10-03",
          genre_ids: [16],
          overview: "Ninja adventures",
        },
      ],
    } as any);

    // Calling with empty apiKey should take the branch directly to fetchTMDBAutocomplete
    const suggestions = await fetchAISuggestions("Naruto", "All", "");

    expect(spySearchTMDB).toHaveBeenCalledWith("Naruto");
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].title).toBe("Naruto");
    expect(suggestions[0].type).toBe("Anime");
    expect(suggestions[0].isAI).toBe(false);
  });

  it("Path 2 (Condition): Correctly categorizes media as Movie when release_date is present", async () => {
    vi.spyOn(tmdbModule, "searchTMDB").mockResolvedValueOnce({
      results: [
        {
          id: 202,
          title: "Spirited Away",
          media_type: "movie",
          release_date: "2001-07-20",
          overview: "A magical adventure",
        },
      ],
    } as any);

    const suggestions = await fetchTMDBAutocomplete("Spirited Away");
    expect(suggestions[0].type).toBe("Movie");
    expect(suggestions[0].total_eps).toBe(1);
    expect(suggestions[0].total_seasons).toBe(1);
  });

  it("Path 3 (Exception/Catch): Handles network errors safely and returns empty array", async () => {
    vi.spyOn(tmdbModule, "searchTMDB").mockRejectedValueOnce(new Error("Network connection lost"));

    const suggestions = await fetchTMDBAutocomplete("ErrorQuery");
    expect(suggestions).toEqual([]);
  });
});
