// TMDB API Client

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "";
const BASE_URL = "https://api.themoviedb.org/3";
export const IMG_BASE = "https://image.tmdb.org/t/p/w500";
export const BACKDROP_BASE = "https://image.tmdb.org/t/p/original";

export interface TMDBMedia {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  genre_ids: number[];
  release_date?: string;
  first_air_date?: string;
  media_type?: "movie" | "tv";
}

export interface TMDBGenre {
  id: number;
  name: string;
}

const MOVIE_GENRES: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie",
  53: "Thriller", 10752: "War", 37: "Western",
};

const TV_GENRES: Record<number, string> = {
  10759: "Action & Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  10762: "Kids", 9648: "Mystery", 10763: "News", 10764: "Reality",
  10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk",
  10768: "War & Politics", 37: "Western",
};

export const getGenreNames = (ids: number[] = [], type: "movie" | "tv" = "movie"): string[] => {
  const map = type === "movie" ? MOVIE_GENRES : TV_GENRES;
  return (ids || []).slice(0, 3).map((id) => map[id]).filter(Boolean);
};

export const getDisplayTitle = (item: TMDBMedia): string =>
  item.title || item.name || "Unknown";

export const getYear = (item: TMDBMedia): string => {
  const d = item.release_date || item.first_air_date;
  return d ? d.slice(0, 4) : "";
};

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("language", "en-US");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

interface TMDBResponse {
  results: TMDBMedia[];
  total_pages: number;
  total_results: number;
}

// Trending (used for Hero Banner)
export const getTrending = (type: "movie" | "tv" | "all" = "all", window: "day" | "week" = "week") =>
  tmdbFetch<TMDBResponse>(`/trending/${type}/${window}`);

// Anime (Japanese animation on TV)
export const getTopAnime = () =>
  tmdbFetch<TMDBResponse>("/discover/tv", {
    with_genres: "16",
    with_origin_country: "JP",
    sort_by: "vote_average.desc",
    "vote_count.gte": "200",
  });

export const getTrendingAnime = () =>
  tmdbFetch<TMDBResponse>("/discover/tv", {
    with_genres: "16",
    with_origin_country: "JP",
    sort_by: "popularity.desc",
    "vote_count.gte": "50",
  });

// Top Series
export const getTopSeries = () =>
  tmdbFetch<TMDBResponse>("/tv/top_rated");

// Popular Series
export const getPopularSeries = () =>
  tmdbFetch<TMDBResponse>("/tv/popular");

// Top Movies
export const getTopMovies = () =>
  tmdbFetch<TMDBResponse>("/movie/top_rated");

// Popular Movies
export const getPopularMovies = () =>
  tmdbFetch<TMDBResponse>("/movie/popular");

// Now Playing Movies
export const getNowPlayingMovies = () =>
  tmdbFetch<TMDBResponse>("/movie/now_playing");

// Search (all)
export const searchTMDB = (query: string) =>
  tmdbFetch<TMDBResponse>("/search/multi", { query, include_adult: "false" });
