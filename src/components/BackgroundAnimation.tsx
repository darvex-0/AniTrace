import { useEffect, useState, useRef } from "react";
import { getTrending, IMG_BASE, getDisplayTitle, type TMDBMedia } from "@/lib/tmdb";

// Curated fallback titles for when TMDB is loading
const FALLBACK_POSTERS = [
  { title: "Attack on Titan", color: "#1a0a00", accent: "#c0392b" },
  { title: "Demon Slayer", color: "#0a0015", accent: "#8e44ad" },
  { title: "One Piece", color: "#001a10", accent: "#27ae60" },
  { title: "Jujutsu Kaisen", color: "#000d1a", accent: "#2980b9" },
  { title: "Naruto", color: "#1a0f00", accent: "#e67e22" },
  { title: "Dragon Ball Z", color: "#1a1200", accent: "#f39c12" },
  { title: "Bleach", color: "#00101a", accent: "#16a085" },
  { title: "Death Note", color: "#080808", accent: "#e74c3c" },
  { title: "Fullmetal Alchemist", color: "#0f0800", accent: "#d35400" },
  { title: "Hunter x Hunter", color: "#001500", accent: "#229954" },
  { title: "My Hero Academia", color: "#00001a", accent: "#1abc9c" },
  { title: "Violet Evergarden", color: "#000a1a", accent: "#5dade2" },
  { title: "Chainsaw Man", color: "#1a0000", accent: "#e74c3c" },
  { title: "Spy x Family", color: "#001a08", accent: "#58d68d" },
  { title: "Vinland Saga", color: "#0a0f00", accent: "#a9cce3" },
  { title: "Frieren", color: "#080010", accent: "#bb8fce" },
];

interface PosterCardProps {
  poster: TMDBMedia | null;
  fallback: (typeof FALLBACK_POSTERS)[0];
}

const PosterCard = ({ poster, fallback }: PosterCardProps) => {
  if (poster?.poster_path) {
    return (
      <div className="w-36 h-52 rounded-xl overflow-hidden shrink-0 shadow-lg">
        <img
          src={`${IMG_BASE}${poster.poster_path}`}
          alt={getDisplayTitle(poster)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }
  return (
    <div
      className="w-36 h-52 rounded-xl shrink-0 shadow-lg flex items-end p-3 overflow-hidden"
      style={{
        background: `linear-gradient(160deg, ${fallback.color} 0%, ${fallback.accent}22 100%)`,
        border: `1px solid ${fallback.accent}33`,
      }}
    >
      <span className="text-xs font-semibold text-white/70 line-clamp-2 leading-tight">
        {fallback.title}
      </span>
    </div>
  );
};

interface ColumnProps {
  posters: (TMDBMedia | null)[];
  fallbacks: (typeof FALLBACK_POSTERS)[0][];
  direction: "up" | "down" | "up-slow" | "up-fast";
}

const PosterColumn = ({ posters, fallbacks, direction }: ColumnProps) => {
  // Duplicate for seamless loop
  const items = [...posters, ...posters];
  const fallbacksDoubled = [...fallbacks, ...fallbacks];

  const animClass =
    direction === "up"
      ? "animate-scroll-up"
      : direction === "down"
      ? "animate-scroll-down"
      : direction === "up-slow"
      ? "animate-scroll-up-slow"
      : "animate-scroll-up-fast";

  return (
    <div className="flex flex-col gap-3 overflow-hidden h-full">
      <div className={`flex flex-col gap-3 ${animClass}`}>
        {items.map((poster, i) => (
          <PosterCard
            key={i}
            poster={poster}
            fallback={fallbacksDoubled[i % fallbacksDoubled.length]}
          />
        ))}
      </div>
    </div>
  );
};

const BackgroundAnimation = () => {
  const [posters, setPosters] = useState<TMDBMedia[]>([]);

  useEffect(() => {
    getTrending("tv", "week")
      .then((r) => setPosters(r.results.slice(0, 16)))
      .catch(() => {});
  }, []);

  // Split posters into 4 columns
  const col1 = posters.slice(0, 4);
  const col2 = posters.slice(4, 8);
  const col3 = posters.slice(8, 12);
  const col4 = posters.slice(12, 16);

  const fb1 = FALLBACK_POSTERS.slice(0, 4);
  const fb2 = FALLBACK_POSTERS.slice(4, 8);
  const fb3 = FALLBACK_POSTERS.slice(8, 12);
  const fb4 = FALLBACK_POSTERS.slice(12, 16);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#09090b]">
      {/* Poster columns — angled container */}
      <div
        className="absolute inset-0 flex gap-4 items-start justify-center opacity-35"
        style={{
          transform: "rotate(-8deg) scale(1.2)",
          transformOrigin: "center center",
          height: "130%",
          top: "-15%",
          left: "-5%",
          width: "110%",
        }}
      >
        <PosterColumn posters={col1} fallbacks={fb1} direction="up" />
        <PosterColumn posters={col2} fallbacks={fb2} direction="down" />
        <PosterColumn posters={col3} fallbacks={fb3} direction="up-slow" />
        <PosterColumn posters={col4} fallbacks={fb4} direction="up-fast" />
        {/* Extra column on wide screens */}
        <PosterColumn posters={col1} fallbacks={fb1} direction="down" />
      </div>

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#09090b]/60 via-[#09090b]/70 to-[#09090b]/85" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#09090b]/80 via-transparent to-[#09090b]/80" />

      {/* Fuchsia glow blob */}
      <div
        className="glow-blob-fuchsia"
        style={{ width: 500, height: 500, top: "20%", left: "20%", opacity: 0.5 }}
      />
      {/* Indigo glow blob */}
      <div
        className="glow-blob-indigo"
        style={{ width: 400, height: 400, bottom: "15%", right: "15%", opacity: 0.4 }}
      />
    </div>
  );
};

export default BackgroundAnimation;
