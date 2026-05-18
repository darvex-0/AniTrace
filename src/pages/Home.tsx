import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play, Star, Plus, ChevronLeft, ChevronRight, Flame, Tv2, Film, Sparkles, TrendingUp, Check, Search, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getTrending, getTopAnime, getTrendingAnime, getTopSeries,
  getPopularSeries, getTopMovies, getPopularMovies,
  IMG_BASE, BACKDROP_BASE, getDisplayTitle, getGenreNames, getYear,
  type TMDBMedia,
} from "@/lib/tmdb";
import { useAuth } from "@/hooks/useAuth";
import { UserNav } from "@/components/UserNav";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { type MediaType } from "@/lib/types";

// ── Hero Banner ──────────────────────────────────────────────────────────────

const HeroBanner = ({ items, onTrack }: { items: TMDBMedia[]; onTrack: (item: TMDBMedia) => void }) => {
  const [current, setCurrent] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const navigate = useNavigate();

  const safeCurrent = current < items.length ? current : 0;

  useEffect(() => {
    if (isHeroHovered || items.length <= 1) return;
    
    const timeout = setTimeout(() => {
      setCurrent(prev => (prev + 1) % items.length);
    }, 4500);
    
    return () => clearTimeout(timeout);
  }, [isHeroHovered, items.length, safeCurrent]);

  if (!items.length) {
    return (
      <div className="relative w-full h-[70vh] min-h-[480px] bg-muted/20 animate-pulse rounded-none" />
    );
  }

  const heroAnime = items[safeCurrent];
  const backdrop = heroAnime.backdrop_path ? `${BACKDROP_BASE}${heroAnime.backdrop_path}` : (heroAnime.poster_path ? `${IMG_BASE}${heroAnime.poster_path}` : '');
  const title = getDisplayTitle(heroAnime);
  const tags = getGenreNames(heroAnime.genre_ids, heroAnime.media_type === "movie" ? "movie" : "tv").slice(0, 3).concat(heroAnime.media_type === "movie" ? ['Movie'] : ['Series']);
  const year = getYear(heroAnime);
  const subtitle = year ? `${year} • RECENT` : 'RECENT';
  const description = heroAnime.overview || "No description available.";

  return (
    <div 
      className="relative w-full h-[70vh] min-h-[500px] overflow-hidden"
      onMouseEnter={() => setIsHeroHovered(true)}
      onMouseLeave={() => setIsHeroHovered(false)}
    >
      <AnimatePresence>
        <motion.div 
          key={`hero-bg-${heroAnime.id || safeCurrent}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-0"
        >
          {backdrop ? (
            <img src={backdrop} alt="Hero" className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/80 lg:via-[#09090b]/20 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 w-full z-10 p-6 lg:p-12 pb-16 flex flex-col items-start max-w-4xl pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={`hero-content-${heroAnime.id || safeCurrent}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex flex-col items-start"
          >
            <div className="flex gap-2 mb-4 pointer-events-auto">
              {tags.map((tag: string) => (
                <span key={tag} className="px-3 py-1 text-[10px] uppercase tracking-widest font-bold rounded-sm bg-white/10 backdrop-blur-md text-zinc-300 border border-white/10">
                  {tag}
                </span>
              ))}
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-black tracking-tight mb-2 uppercase drop-shadow-lg pointer-events-auto">
              {title}
            </h1>

            <p className="text-fuchsia-400 font-semibold tracking-wider text-sm mb-4 drop-shadow-md pointer-events-auto">
              {subtitle}
            </p>
            
            <p className="text-zinc-300 max-w-xl text-sm lg:text-base leading-relaxed mb-8 line-clamp-3 drop-shadow-md pointer-events-auto">
              {description}
            </p>

            <div className="flex gap-4 items-center pointer-events-auto mb-4 lg:mb-0">
              <button 
                onClick={() => onTrack(heroAnime)}
                className="group flex items-center justify-center gap-2 bg-white text-black px-6 py-3.5 rounded-full font-bold hover:scale-105 transition-all w-48"
              >
                <Play className="w-5 h-5 fill-black group-hover:fill-fuchsia-600 transition-colors" />
                Start Tracking
              </button>
              <button 
                onClick={() => onTrack(heroAnime)}
                className="flex items-center justify-center w-14 h-14 rounded-full glass-panel hover:bg-white/10 transition-all hover:scale-105 group relative"
              >
                <Plus className="w-6 h-6 text-white" />
                <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-zinc-800 text-xs py-1 px-2 rounded font-medium whitespace-nowrap text-white">
                  Add to List
                </span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Carousel Navigation */}
        {items.length > 1 && (
          <div className="absolute right-6 bottom-16 lg:right-12 lg:bottom-16 flex items-center gap-4 pointer-events-auto">
            <button 
              onClick={(e) => {
                 e.stopPropagation();
                 setCurrent(prev =>(prev - 1 + items.length) % items.length);
              }} 
              className="w-10 h-10 rounded-full glass-panel flex justify-center items-center hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            
            <div className="flex gap-2 bg-black/40 px-3 py-2 rounded-full glass-panel">
              {items.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrent(idx);
                  }}
                  className={`h-2 rounded-full transition-all duration-500 ease-in-out ${safeCurrent === idx ? 'w-8 bg-fuchsia-500' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                />
              ))}
            </div>

            <button 
              onClick={(e) => {
                 e.stopPropagation();
                 setCurrent(prev =>(prev + 1) % items.length);
              }} 
              className="w-10 h-10 rounded-full glass-panel flex justify-center items-center hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Shelf Item ────────────────────────────────────────────────────────────────

const ShelfItem = ({ item, type, onTrack }: { item: TMDBMedia; type: "movie" | "tv"; onTrack: (item: TMDBMedia, type: "movie" | "tv") => void }) => {
  const poster = item.poster_path ? `${IMG_BASE}${item.poster_path}` : null;
  const title = getDisplayTitle(item);
  const rating = item.vote_average.toFixed(1);

  return (
    <div 
      onClick={() => onTrack(item, type)}
      className="poster-card shrink-0 w-36 cursor-pointer group"
    >
      <div className="relative w-36 h-52 rounded-xl overflow-hidden bg-muted/30 mb-2 border border-border/30 group-hover:border-primary/45 transition-all">
        {poster ? (
          <img src={poster} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div
            className="w-full h-full flex items-end p-3"
            style={{ background: "linear-gradient(160deg, hsl(292 60% 10%), hsl(243 60% 12%))" }}
          >
            <span className="text-xs font-semibold text-white/60 line-clamp-2">{title}</span>
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 justify-between">
          <div className="flex items-center gap-1 text-yellow-400">
            <Star className="h-3 w-3 fill-current" />
            <span className="text-xs font-bold">{rating}</span>
          </div>
          <span className="text-[9px] bg-primary/95 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Track</span>
        </div>
      </div>
      <p className="text-xs font-medium text-foreground/80 truncate leading-tight">{title}</p>
    </div>
  );
};

// ── Shelf ─────────────────────────────────────────────────────────────────────

interface ShelfProps {
  title: string;
  icon: React.ReactNode;
  items: TMDBMedia[];
  loading?: boolean;
  type: "movie" | "tv";
  onTrack: (item: TMDBMedia, type: "movie" | "tv") => void;
}

const Shelf = ({ title, icon, items, loading, type, onTrack }: ShelfProps) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir === "right" ? 400 : -400, behavior: "smooth" });
  };

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between px-6 lg:px-8 mb-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          {icon}
          {title}
        </h2>
        <div className="flex gap-1.5">
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded-lg glass-panel border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded-lg glass-panel border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={rowRef} className="shelf-scroll flex gap-4 px-6 lg:px-8 pb-2">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shrink-0 w-36 h-52 rounded-xl bg-muted/30 animate-pulse border border-border/20" />
            ))
          : items.map((item) => <ShelfItem key={item.id} item={item} type={type} onTrack={onTrack} />)}
      </div>
    </section>
  );
};

// ── Home Page ─────────────────────────────────────────────────────────────────

// Curated fallback trending items for zero-loading/fail-safe experience
const FALLBACK_HEROES: TMDBMedia[] = [
  {
    id: 157336,
    title: "Interstellar",
    backdrop_path: "/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
    poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
    vote_average: 8.4,
    genre_ids: [12, 18, 878],
    media_type: "movie",
    release_date: "2014-11-05"
  },
  {
    id: 1399,
    name: "Game of Thrones",
    backdrop_path: "/2omb0kv25i51822wZqHn87z5NNc.jpg",
    poster_path: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
    overview: "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war. All while a very ancient evil awakens in the farthest north.",
    vote_average: 8.4,
    genre_ids: [10765, 18, 10759],
    media_type: "tv",
    first_air_date: "2011-04-17"
  },
  {
    id: 119661,
    name: "Re:ZERO -Starting Life in Another World-",
    backdrop_path: "/6s1x7gZJ12V9K1l6K12l9V1K2.jpg",
    poster_path: "/yHkHhGszHnBA.jpg",
    overview: "Subaru Natsuki is suddenly summoned to another world on his way home from the convenience store. With no sign of who summoned him, and things getting worse when he is attacked, he is saved by a mysterious silver-haired girl.",
    vote_average: 8.6,
    genre_ids: [16, 10765, 18],
    media_type: "tv",
    first_air_date: "2016-04-04"
  }
];

const Home = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const [heroItems, setHeroItems] = useState<TMDBMedia[]>(FALLBACK_HEROES);
  const [topAnime, setTopAnime] = useState<TMDBMedia[]>([]);
  const [trendingAnime, setTrendingAnime] = useState<TMDBMedia[]>([]);
  const [topSeries, setTopSeries] = useState<TMDBMedia[]>([]);
  const [popularSeries, setPopularSeries] = useState<TMDBMedia[]>([]);
  const [topMovies, setTopMovies] = useState<TMDBMedia[]>([]);
  const [popularMovies, setPopularMovies] = useState<TMDBMedia[]>([]);

  const [loadingHero, setLoadingHero] = useState(false);
  const [loadingShelves, setLoadingShelves] = useState(true);

  useEffect(() => {
    // 1. Fetch trending items (might be blocked by adblockers/privacy shields)
    getTrending("all", "week")
      .then((r) => {
        const filtered = r.results.filter((i) => i.backdrop_path);
        if (filtered.length > 0) {
          setHeroItems(filtered.slice(0, 5));
        }
      })
      .catch((err) => {
        console.warn("getTrending failed (possibly blocked by adblocker):", err);
      })
      .finally(() => setLoadingHero(false));

    // 2. Fetch all other content categories
    Promise.all([
      getTopAnime(),
      getTrendingAnime(),
      getTopSeries(),
      getPopularSeries(),
      getTopMovies(),
      getPopularMovies(),
    ])
      .then(([anime, tAnime, series, popSeries, movies, popMovies]) => {
        const aList = anime.results.slice(0, 20);
        const tAList = tAnime.results.slice(0, 20);
        const sList = series.results.slice(0, 20);
        const popSList = popSeries.results.slice(0, 20);
        const mList = movies.results.slice(0, 20);
        const popMList = popMovies.results.slice(0, 20);

        setTopAnime(aList);
        setTrendingAnime(tAList);
        setTopSeries(sList);
        setPopularSeries(popSList);
        setTopMovies(mList);
        setPopularMovies(popMList);

        // Fail-safe / Premium mix: Construct dynamic hero banner items from these categories!
        // This ensures the Hero section is ALWAYS loaded with real TMDB content even if '/trending' gets blocked!
        const heroMix: TMDBMedia[] = [];

        // Mix 1: Top Rated Movie
        const topM = mList.find(i => i.backdrop_path);
        if (topM) heroMix.push({ ...topM, media_type: "movie" });

        // Mix 2: Top Rated Anime
        const topA = aList.find(i => i.backdrop_path);
        if (topA) heroMix.push({ ...topA, media_type: "tv" });

        // Mix 3: Top Rated TV Series
        const topS = sList.find(i => i.backdrop_path);
        if (topS) heroMix.push({ ...topS, media_type: "tv" });

        // Mix 4: Trending Anime
        const trendA = tAList.find(i => i.backdrop_path && !heroMix.some(h => h.id === i.id));
        if (trendA) heroMix.push({ ...trendA, media_type: "tv" });

        // Mix 5: Popular Movie
        const popM = popMList.find(i => i.backdrop_path && !heroMix.some(h => h.id === i.id));
        if (popM) heroMix.push({ ...popM, media_type: "movie" });

        if (heroMix.length > 0) {
          setHeroItems(heroMix);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingShelves(false));
  }, []);

  const handleAddToLibrary = async (item: TMDBMedia, mediaType?: "movie" | "tv") => {
    if (!user) {
      toast.error("Please sign in to track shows!");
      navigate("/auth");
      return;
    }
    
    // Map TMDB raw types ("tv", "movie") to capitalized frontend MediaType ("Anime" | "Series" | "Movie")
    let finalType: MediaType = "Series";
    
    // Completely bulletproof check: Determine if it's a Movie or a TV show.
    // TMDB movies strictly contain release_date or title, while TV shows contain first_air_date or name.
    const isMovie = 
      mediaType === "movie" || 
      item.media_type === "movie" || 
      (!!item.release_date && !item.first_air_date) || 
      (!!item.title && !item.name);
      
    if (isMovie) {
      finalType = "Movie";
    } else {
      // Check if it is Anime based on genre 16 (Animation)
      const isAnime = item.genre_ids?.includes(16);
      finalType = isAnime ? "Anime" : "Series";
    }

    const title = getDisplayTitle(item);
    
    // Show a loading toast
    const toastId = toast.loading(`Adding "${title}" to library...`);
    
    try {
      // 1. Check if already tracking
      const q = query(
        collection(db, "media"),
        where("user_id", "==", user.uid),
        where("source_id", "==", String(item.id))
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        toast.dismiss(toastId);
        toast.info(`"${title}" is already in your library!`);
        return;
      }
      
      // 2. Add to Firestore
      await addDoc(collection(db, "media"), {
        user_id: user.uid,
        title,
        type: finalType,
        source_id: String(item.id),
        source_name: "TMDB",
        poster_path: item.poster_path || null,
        backdrop_path: item.backdrop_path || null,
        status: "Watching",
        current_ep: 0,
        total_eps: finalType === "Movie" ? 1 : null,
        current_season: 1,
        total_seasons: null,
        notes: null,
        rating: null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        last_watched: null
      });
      
      toast.dismiss(toastId);
      toast.success(`"${title}" added to your library! 🎌`);
    } catch (error: any) {
      toast.dismiss(toastId);
      console.error("Error adding to library:", error);
      toast.error(`Failed to add: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Glow blobs */}
      <div className="glow-blob-fuchsia" style={{ width: 600, height: 600, top: -100, right: -100, opacity: 0.08 }} />
      <div className="glow-blob-indigo" style={{ width: 500, height: 500, top: "40%", left: -100, opacity: 0.06 }} />

      {/* Floating Header for Desktop */}
      <header className="hidden lg:flex absolute top-0 left-0 w-full z-50 p-6 justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="relative w-full max-w-sm pointer-events-auto">
          <div className="glass-panel flex items-center gap-3 px-4 py-2 rounded-full w-full border border-white/5 hover:border-white/15 transition-all">
            <Search className="w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search library, movies, anime..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="bg-transparent border-none outline-none text-xs w-full placeholder:text-zinc-500 text-zinc-100"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-zinc-400 hover:text-white">
                <X className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 pointer-events-auto">
          {user && <UserNav user={user} signOut={signOut} />}
        </div>
      </header>

      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-border/40 glass-panel sticky top-0 z-10">
        <span className="text-xl font-black gradient-text">AniTrace</span>
        {user && <UserNav user={user} signOut={signOut} />}
      </header>

      {/* Hero */}
      {loadingHero ? (
        <div className="w-full h-[72vh] min-h-[500px] bg-muted/20 animate-pulse" />
      ) : (
        <HeroBanner items={heroItems} onTrack={(item) => handleAddToLibrary(item)} />
      )}

      {/* Shelves */}
      <div className="py-8 relative z-10">
        <Shelf
          title="Top Anime"
          icon={<Sparkles className="h-5 w-5 text-primary" />}
          items={topAnime}
          loading={loadingShelves}
          type="tv"
          onTrack={handleAddToLibrary}
        />
        <Shelf
          title="Trending Anime"
          icon={<Flame className="h-5 w-5 text-orange-400" />}
          items={trendingAnime}
          loading={loadingShelves}
          type="tv"
          onTrack={handleAddToLibrary}
        />
        <Shelf
          title="Top Series"
          icon={<TrendingUp className="h-5 w-5 text-indigo-400" />}
          items={topSeries}
          loading={loadingShelves}
          type="tv"
          onTrack={handleAddToLibrary}
        />
        <Shelf
          title="Popular Series"
          icon={<Tv2 className="h-5 w-5 text-blue-400" />}
          items={popularSeries}
          loading={loadingShelves}
          type="tv"
          onTrack={handleAddToLibrary}
        />
        <Shelf
          title="Top Rated Movies"
          icon={<Star className="h-5 w-5 text-yellow-400" />}
          items={topMovies}
          loading={loadingShelves}
          type="movie"
          onTrack={handleAddToLibrary}
        />
        <Shelf
          title="Popular Movies"
          icon={<Film className="h-5 w-5 text-pink-400" />}
          items={popularMovies}
          loading={loadingShelves}
          type="movie"
          onTrack={handleAddToLibrary}
        />
      </div>
    </div>
  );
};

export default Home;
