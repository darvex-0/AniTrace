import { useState } from "react";
import { Plus, ExternalLink, Pencil, Trash2, Clock, Film, Tv2, Sparkles, CheckCircle2, Calendar, GitBranch } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { MediaItem } from "@/lib/types";
import { SpinoffsSection } from "./SpinoffsSection";

interface Props {
  item: MediaItem;
  allItems?: MediaItem[];
  onIncrement: (item: MediaItem) => void;
  onEdit: (item: MediaItem) => void;
  onEditProgress: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
  onOpenFranchise?: (item: MediaItem) => void;
}

const TypeIcon = ({ type }: { type: string }) => {
  if (type === "Anime") return <Sparkles className="h-3.5 w-3.5" />;
  if (type === "Movie") return <Film className="h-3.5 w-3.5" />;
  return <Tv2 className="h-3.5 w-3.5" />;
};

const typeGradient = (t: string) => {
  if (t === "Anime") return "from-fuchsia-950 to-purple-950";
  if (t === "Movie") return "from-rose-950 to-pink-950";
  return "from-indigo-950 to-blue-950";
};

const typeAccent = (t: string) => {
  if (t === "Anime") return "hsl(292 84% 61%)";
  if (t === "Movie") return "hsl(340 75% 55%)";
  return "hsl(243 75% 59%)";
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "Watching") return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
  );
  if (status === "Completed") return <CheckCircle2 className="h-3 w-3" />;
  if (status === "On-Hold") return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
  );
  return <Calendar className="h-3 w-3" />;
};

const statusCls = (s: string) => {
  switch (s) {
    case "Watching": return "status-watching";
    case "Completed": return "status-completed";
    case "On-Hold": return "status-on-hold";
    default: return "status-plan";
  }
};

export const MediaCard = ({
  item, allItems = [], onIncrement, onEdit, onEditProgress, onDelete, onOpenFranchise,
}: Props) => {
  const [bumping, setBumping] = useState(false);

  const progress =
    item.total_eps && item.total_eps > 0
      ? Math.min(100, (item.current_ep / item.total_eps) * 100)
      : 0;

  const linkedItems = (item.linked_spinoff_ids ?? [])
    .map((id) => allItems.find((x) => x.id === id))
    .filter(Boolean) as MediaItem[];
  const spinoffs = (item.spinoffs ?? []) as NonNullable<MediaItem["spinoffs"]>;

  const handleBump = async () => {
    if (bumping) return;
    setBumping(true);
    try {
      await onIncrement(item);
    } finally {
      setTimeout(() => setBumping(false), 300);
    }
  };

  const accent = typeAccent(item.type);
  const gradient = typeGradient(item.type);

  return (
    <div
      className="glass-card rounded-2xl overflow-hidden border border-border/40 hover:border-primary/25 transition-all duration-300 group hover:shadow-xl relative"
    >
      {/* Top accent stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 z-10"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />

      {/* Header / Poster area */}
      <div
        className={`relative h-32 bg-gradient-to-br ${gradient} flex items-center justify-between px-5 overflow-hidden`}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: `radial-gradient(circle at 85% 50%, ${accent}88, transparent 65%)` }}
        />

        <div className="relative z-10 flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white/90 border border-white/10"
              style={{ background: `${accent}30` }}
            >
              <TypeIcon type={item.type} />
              {item.type}
            </span>
            <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusCls(item.status)}`}>
              <StatusIcon status={item.status} />
              {item.status}
            </span>
          </div>
          <h3 className="font-bold text-base text-white leading-snug line-clamp-2" title={item.title}>
            {item.title}
          </h3>
        </div>

        {/* Episode counter / Movie Complete Status */}
        <button
          type="button"
          onClick={() => onEditProgress(item)}
          className="relative z-10 text-right hover:scale-105 transition-transform shrink-0"
          title="Edit progress"
        >
          {item.type !== "Movie" ? (
            <>
              <div className="text-[10px] text-white/50 mb-0.5">
                S{item.current_season}
                {item.total_seasons ? <span className="opacity-60">/{item.total_seasons}</span> : null}
                {" · "}Ep
              </div>
              <div
                className={`text-3xl font-black tabular-nums transition-all ${
                  bumping ? "scale-125 text-primary" : "text-white"
                }`}
              >
                {item.current_ep}
              </div>
              {item.total_eps && (
                <div className="text-[10px] text-white/40">/ {item.total_eps}</div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-end justify-center">
              <div className="text-[10px] text-white/50 mb-1">Movie Status</div>
              {item.status === "Completed" ? (
                <CheckCircle2 className="h-8 w-8 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]" />
              ) : (
                <svg className="h-8 w-8 text-white/40 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          )}
        </button>

        {/* Hover action buttons */}
        <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-20">
          {onOpenFranchise && (
            <button
              onClick={() => onOpenFranchise(item)}
              title="Explore Franchise & Connected Works"
              className="p-1.5 rounded-lg bg-primary/25 hover:bg-primary text-white border border-primary/40 transition-all backdrop-blur-sm shadow-sm"
            >
              <GitBranch className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white/70 hover:text-white border border-white/10 transition-all backdrop-blur-sm"
            title="Edit details"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/20 transition-all backdrop-blur-sm"
            title="Delete title"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {/* Progress bar */}
        {item.total_eps && item.total_eps > 0 ? (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span
                className="font-semibold"
                style={{ color: progress === 100 ? "hsl(142 72% 55%)" : accent }}
              >
                {Math.round(progress)}%
              </span>
            </div>
            <div className="relative h-1.5 rounded-full bg-muted/40 overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background:
                    progress === 100
                      ? "hsl(142 72% 45%)"
                      : `linear-gradient(90deg, ${accent}, ${accent}80)`,
                  boxShadow: progress > 0 ? `0 0 8px ${accent}55` : "none",
                }}
              />
            </div>
          </div>
        ) : null}

        {/* Notes */}
        {item.notes && (
          <p
            className="text-xs text-muted-foreground line-clamp-2 italic border-l-2 pl-2.5 py-0.5"
            style={{ borderColor: `${accent}50` }}
          >
            {item.notes}
          </p>
        )}

        {/* Spinoffs */}
        <SpinoffsSection
          spinoffs={spinoffs}
          linked={linkedItems}
          linkedRelations={item.linked_relations}
          onOpenLinked={onEdit}
          onAdd={() => onEdit(item)}
        />

        {/* Footer row */}
        <div className="flex items-center justify-between pt-2 border-t border-border/25">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {item.last_watched
                ? formatDistanceToNow(new Date(item.last_watched), { addSuffix: true })
                : "Not started"}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {item.source_link && (
              <a
                href={item.source_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border transition-all hover:opacity-80"
                style={{
                  background: `${accent}15`,
                  borderColor: `${accent}30`,
                  color: accent,
                }}
              >
                <ExternalLink className="h-3 w-3" />
                Resume
              </a>
            )}
            {item.status !== "Completed" && (
              <button
                onClick={handleBump}
                className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg text-white transition-all hover:opacity-90 hover:scale-105 active:scale-95"
                style={{ background: accent }}
              >
                {item.type === "Movie" ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Complete
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    Ep
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
