import { useState, useEffect, useRef } from "react";
import { Search, X, Star, Loader2, Film, Tv2, Sparkles } from "lucide-react";
import { searchTMDB, IMG_BASE, getDisplayTitle, getGenreNames, getYear, type TMDBMedia } from "@/lib/tmdb";
import { useAuth } from "@/hooks/useAuth";
import { UserNav } from "@/components/UserNav";

const MediaTypeIcon = ({ type }: { type?: string }) => {
  if (type === "movie") return <Film className="h-3 w-3" />;
  if (type === "tv") return <Tv2 className="h-3 w-3" />;
  return <Sparkles className="h-3 w-3" />;
};

const ResultCard = ({ item }: { item: TMDBMedia }) => {
  const poster = item.poster_path ? `${IMG_BASE}${item.poster_path}` : null;
  const title = getDisplayTitle(item);
  const year = getYear(item);
  const type = item.media_type || "tv";
  const genres = getGenreNames(item.genre_ids, type as "movie" | "tv");
  const rating = item.vote_average.toFixed(1);

  const accent =
    type === "movie" ? "hsl(340 75% 55%)" : "hsl(243 75% 59%)";

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-border/40 hover:border-primary/25 transition-all group poster-card">
      <div className="relative aspect-[2/3] bg-muted/30 overflow-hidden">
        {poster ? (
          <img src={poster} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-end p-3 bg-gradient-to-br from-primary/10 to-secondary/10">
            <span className="text-xs font-semibold text-white/50 line-clamp-3">{title}</span>
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 gap-1.5">
          <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
            <Star className="h-3 w-3 fill-current" />
            {rating}
          </div>
          {genres.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {genres.slice(0, 2).map((g) => (
                <span key={g} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/15 text-white/80">
                  {g}
                </span>
              ))}
            </div>
          )}
          <p className="text-[10px] text-white/60 line-clamp-2 leading-relaxed">{item.overview}</p>
        </div>
        {/* Type badge */}
        <div
          className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white border border-white/10 backdrop-blur-sm"
          style={{ background: `${accent}35` }}
        >
          <MediaTypeIcon type={type} />
          {type === "movie" ? "Movie" : type === "tv" ? "Series" : "Unknown"}
        </div>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs font-semibold text-foreground/90 truncate">{title}</p>
        {year && <p className="text-[10px] text-muted-foreground mt-0.5">{year}</p>}
      </div>
    </div>
  );
};

const Discover = () => {
  const { user, signOut } = useAuth();
  const [query, setQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("q") || "";
  });
  const [results, setResults] = useState<TMDBMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const qParam = new URLSearchParams(window.location.search).get("q");
    if (qParam !== null && qParam !== query) {
      setQuery(qParam);
    }
  }, [window.location.search]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await searchTMDB(query.trim());
        setResults(r.results.filter((i) => i.media_type !== "person" && (i.poster_path || i.overview)));
        setSearched(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <div className="min-h-screen relative">
      <div className="glow-blob-fuchsia" style={{ width: 500, height: 500, top: -100, right: -50, opacity: 0.07 }} />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/40 glass-panel-heavy">
        <div className="px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold lg:block hidden">Discover</h1>
          <span className="lg:hidden text-xl font-black gradient-text">Discover</span>
          {user && <UserNav user={user} signOut={signOut} />}
        </div>
      </header>

      <div className="px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl font-black mb-2">
            Find your next <span className="gradient-text">obsession</span>
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Search across movies, anime, and series from TMDB.
          </p>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anime, series, movies..."
              className="w-full pl-12 pr-12 py-4 rounded-2xl bg-muted/30 border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all text-base"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/40 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No results found for "{query}"</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground mb-4">{results.length} results for "{query}"</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {results.map((item) => (
                <ResultCard key={`${item.media_type}-${item.id}`} item={item} />
              ))}
            </div>
          </>
        )}

        {!loading && !searched && (
          <div className="text-center py-16">
            <div className="inline-flex p-4 rounded-2xl bg-muted/20 border border-border/30 mb-4">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Search for anything</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Type in the search box above to find anime, series, and movies from TMDB.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
