import { useState } from "react";
import { Plus, ExternalLink, Pencil, Trash2, Clock, Film, Tv2, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { MediaItem } from "@/lib/types";
import { SpinoffsSection } from "./SpinoffsSection";

interface Props {
  item: MediaItem;
  allItems?: MediaItem[];
  onIncrement: (item: MediaItem) => void;
  onEdit: (item: MediaItem) => void;
  onEditProgress: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
}

const typeIcon = (t: string) => {
  if (t === "Anime") return <Sparkles className="h-3 w-3" />;
  if (t === "Movie") return <Film className="h-3 w-3" />;
  return <Tv2 className="h-3 w-3" />;
};

const statusColor = (s: string) => {
  switch (s) {
    case "Watching": return "bg-info/20 text-info border-info/30";
    case "Completed": return "bg-success/20 text-success border-success/30";
    case "On-Hold": return "bg-warning/20 text-warning border-warning/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
};

export const MediaCard = ({ item, allItems = [], onIncrement, onEdit, onEditProgress, onDelete }: Props) => {
  const [bumping, setBumping] = useState(false);
  const progress = item.total_eps && item.total_eps > 0
    ? Math.min(100, (item.current_ep / item.total_eps) * 100)
    : 0;
  const linkedItems = (item.linked_spinoff_ids ?? [])
    .map((id) => allItems.find((x) => x.id === id))
    .filter(Boolean) as MediaItem[];
  const spinoffs = (item.spinoffs ?? []) as NonNullable<MediaItem["spinoffs"]>;

  const handleBump = async () => {
    if (bumping) return; // guard against rapid re-entry
    setBumping(true);
    try {
      await onIncrement(item);
    } finally {
      setTimeout(() => setBumping(false), 300);
    }
  };

  return (
    <Card
      className="p-5 border-border transition-all hover:border-primary/40 group"
      style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="outline" className="gap-1 text-xs">
              {typeIcon(item.type)}
              {item.type}
            </Badge>
            <Badge variant="outline" className={`text-xs ${statusColor(item.status)}`}>
              {item.status}
            </Badge>
          </div>
          <h3 className="font-semibold text-lg leading-tight truncate" title={item.title}>
            {item.title}
          </h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(item)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(item)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onEditProgress(item)}
            title="Edit season & episode"
            className="flex items-baseline gap-2 rounded-md px-1.5 -mx-1.5 py-0.5 hover:bg-muted/40 transition-colors text-left"
          >
            {item.type !== "Movie" && (
              <span className="text-sm font-medium text-muted-foreground">
                S{item.current_season}
                {item.total_seasons ? <span className="opacity-60">/{item.total_seasons}</span> : null}
                <span className="mx-1.5 opacity-40">·</span>
                <span className="text-xs uppercase tracking-wide">Ep</span>
              </span>
            )}
            <span className={`text-2xl font-bold tabular-nums transition-transform ${bumping ? "scale-125 text-primary" : ""}`}>
              {item.current_ep}
            </span>
            {item.total_eps ? (
              <span className="text-sm text-muted-foreground">/ {item.total_eps}</span>
            ) : (
              <span className="text-sm text-muted-foreground">eps</span>
            )}
            <Pencil className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-50" />
          </button>
          {item.status !== "Completed" && (
            <Button size="sm" onClick={handleBump} className="gap-1 h-8">
              <Plus className="h-3.5 w-3.5" />
              Episode
            </Button>
          )}
        </div>

        {item.total_eps ? <Progress value={progress} className="h-1.5" /> : null}

        {item.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2 italic border-l-2 border-border pl-2">
            {item.notes}
          </p>
        )}

        <SpinoffsSection spinoffs={spinoffs} linked={linkedItems} onOpenLinked={onEdit} />


        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1 min-w-0">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {item.last_watched
                ? formatDistanceToNow(new Date(item.last_watched), { addSuffix: true })
                : "Not started"}
            </span>
          </div>
          {item.source_link && (
            <a
              href={item.source_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-md px-2.5 py-1 text-xs font-medium transition-colors shrink-0"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Resume</span>
              {item.type !== "Movie" && (
                <span className="opacity-70">
                  S{item.current_season} · Ep {item.current_ep}
                </span>
              )}
            </a>
          )}
        </div>
      </div>
    </Card>
  );
};
