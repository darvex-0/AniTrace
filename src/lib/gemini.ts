import { searchTMDB, getTMDBRecommendations } from "./tmdb";
import { type Spinoff } from "./types";

export interface AISuggestion {
  title: string;
  type: "Anime" | "Series" | "Movie";
  total_eps?: number | null;
  total_seasons?: number | null;
  notes?: string | null;
  isAI?: boolean;
  tmdbId?: number;
  tmdbType?: "tv" | "movie";
}

// Fallback search suggestions from TMDB when Gemini is not configured
export const fetchTMDBAutocomplete = async (query: string): Promise<AISuggestion[]> => {
  try {
    const res = await searchTMDB(query);
    return res.results.slice(0, 5).map((item) => {
      const isMovie =
        item.media_type === "movie" ||
        (!!item.release_date && !item.first_air_date) ||
        (!!item.title && !item.name);
      
      // Guess if it's Anime: check genre_ids for 16 (Animation)
      const isAnime = item.genre_ids?.includes(16);
      const mType: "tv" | "movie" = isMovie ? "movie" : "tv";
      
      return {
        title: item.title || item.name || "",
        type: isMovie ? "Movie" : isAnime ? "Anime" : "Series",
        notes: item.overview
          ? item.overview.slice(0, 120) + (item.overview.length > 120 ? "..." : "")
          : null,
        total_eps: isMovie ? 1 : null,
        total_seasons: isMovie ? 1 : null,
        isAI: false,
        tmdbId: item.id,
        tmdbType: mType,
      };
    });
  } catch (error) {
    console.error("TMDB autocomplete error:", error);
    return [];
  }
};

// Fetch auto-suggestions using Gemini API
export const fetchAISuggestions = async (
  query: string,
  currentType: string,
  apiKey: string
): Promise<AISuggestion[]> => {
  if (!apiKey) {
    return fetchTMDBAutocomplete(query);
  }

  const typeFilterText =
    currentType && currentType !== "All"
      ? `Prioritize items that are of type "${currentType}".`
      : "";

  const prompt = `You are an autocomplete and media database assistant for AniTrace.
Suggest exactly 5 autocomplete names for an anime, TV series, or movie that matches or completes the partial text: "${query}".
${typeFilterText}
For each suggestion, provide:
1. title: The exact complete name of the title.
2. type: Must be exactly "Anime", "Series", or "Movie".
3. total_eps: Estimated number of episodes in the first season or total episodes (or null if unknown/ongoing).
4. total_seasons: Estimated number of seasons (or null if unknown).
5. notes: A brief, engaging 1-sentence description/genres (under 120 characters).

Return your response strictly as a JSON array of objects matching the schema. Do not wrap in markdown or backticks.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      const parsed = JSON.parse(text) as AISuggestion[];
      return parsed.map((item) => ({
        ...item,
        isAI: true,
      }));
    }
    
    // Fall back to TMDB if response format was unexpected
    return fetchTMDBAutocomplete(query);
  } catch (error) {
    console.warn("Gemini API error, falling back to TMDB:", error);
    return fetchTMDBAutocomplete(query);
  }
};

export interface FranchiseItem extends Spinoff {
  notes?: string;
  tmdbId?: number;
  total_eps?: number | null;
  total_seasons?: number | null;
}

// Fetch recommendations / spinoffs using TMDB search to ensure they are actually related franchise items
export const fetchTMDBFranchise = async (
  title: string,
  id: number
): Promise<FranchiseItem[]> => {
  try {
    // Search using the base name to find actual franchise movies/spin-offs
    const baseTitle = title.split(":")[0].split(/Season|Part|\d+nd Season|\d+rd Season|\d+th Season/i)[0].trim();
    const res = await searchTMDB(baseTitle || title);
    
    const baseLower = (baseTitle || title).toLowerCase();
    const seasonRegex = /(?:season\s*\d+|part\s*\d+|\d+(?:nd|rd|th|st)\s*season)/i;

    const franchiseItems = res.results.filter((item: any) => {
      if (item.id === id) return false;
      const itemName = (item.title || item.name || "").toLowerCase();
      
      // Must match base title
      const matchesBase = itemName.includes(baseLower) || baseLower.includes(itemName);
      if (!matchesBase) return false;

      // Exclude generic numbered next seasons of the same title
      const isMovie = item.media_type === "movie" || (!!item.release_date && !item.first_air_date) || (!!item.title && !item.name);
      if (!isMovie && seasonRegex.test(itemName)) {
        return false;
      }

      return true;
    });

    // Deduplicate by title
    const seen = new Set<string>();
    const unique = franchiseItems.filter((item: any) => {
      const name = (item.title || item.name || "").trim().toLowerCase();
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });

    return unique.slice(0, 12).map((item: any) => {
      const isMovie =
        item.media_type === "movie" ||
        (!!item.release_date && !item.first_air_date) ||
        (!!item.title && !item.name);
      
      const isAnime = item.genre_ids?.includes(16);
      
      let relation: "Prequel" | "Sequel" | "Spin-off" | "Related" = "Related";
      const name = (item.title || item.name || "").toLowerCase();
      if (isMovie) relation = "Spin-off";
      else if (name.includes("sequel") || name.includes("after") || name.includes("shippuden") || name.includes("next")) relation = "Sequel";
      else if (name.includes("prequel") || name.includes("origin") || name.includes("zero") || name.includes("first")) relation = "Prequel";
      
      return {
        title: item.title || item.name || "",
        type: isMovie ? "Movie" : isAnime ? "Anime" : "Series",
        relation,
        watched: false,
        notes: item.overview ? item.overview.slice(0, 140) + (item.overview.length > 140 ? "..." : "") : undefined,
        tmdbId: item.id,
        total_eps: isMovie ? 1 : null,
        total_seasons: isMovie ? 1 : null,
      };
    });
  } catch (error) {
    console.error("TMDB franchise error:", error);
    return [];
  }
};

// Fetch franchise timeline and connected shows using Gemini
export const fetchFranchiseTimeline = async (
  title: string,
  apiKey: string
): Promise<FranchiseItem[]> => {
  if (!apiKey) {
    return fetchTMDBFranchise(title, 0);
  }

  const prompt = `For the media title "${title}", list up to 8 directly connected franchise movies, standalone sequels with unique subtitles, prequels, spinoffs, or cinematic universe entries.
IMPORTANT RULES:
1. Do NOT include generic numbered seasons of the same show (e.g. do NOT return "${title} Season 2" or "${title} Part 2" as those are tracked inside the same entry).
2. ONLY include distinct connected works (such as Movies, Prequels, Spin-offs, or Sequels like "Spider-Man: No Way Home", "Spy x Family Code: White", etc.).
3. For each item, provide:
   - "title": Exact official title.
   - "type": Exactly "Anime", "Series", or "Movie".
   - "relation": Exactly "Sequel", "Prequel", "Spin-off", or "Related".
   - "notes": A short 1-sentence description or context in the franchise (under 120 chars).
   - "total_eps": Estimated episodes (1 if Movie, null if unknown).

Return your response strictly as a JSON array of objects. Do not wrap in markdown codeblocks.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      const items = JSON.parse(text) as FranchiseItem[];
      return items.map(item => ({
        ...item,
        watched: false,
      }));
    }
  } catch (error) {
    console.warn("Failed to fetch franchise timeline via Gemini, falling back to TMDB:", error);
  }

  return fetchTMDBFranchise(title, 0);
};
