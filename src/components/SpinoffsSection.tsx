import { useState } from "react";
import { ChevronDown, Film, Tv2, Sparkles, ExternalLink, Check, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MediaItem, Spinoff } from "@/lib/types";

const typeIcon = (t: string) => {
  if (t === "Anime") return <Sparkles className="h-3 w-3" />;
  if (t === "Movie") return <Film className="h-3 w-3" />;
  return <Tv2 className="h-3 w-3" />;
};

interface Props {
  spinoffs: Spinoff[];
  linked: MediaItem[];
  onOpenLinked?: (item: MediaItem) => void;
}

export const SpinoffsSection = ({ spinoffs, linked, onOpenLinked }: Props) => {
  const [open, setOpen] = useState(false);
  const total = spinoffs.length + linked.length;
  if (total === 0) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-muted/40 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Spin-offs & Movies</span>
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{total}</Badge>
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="px-3 pb-3 pt-1 space-y-1.5">
          {linked.map((it) => (
            <li key={`l-${it.id}`}>
              <button
                type="button"
                onClick={() => onOpenLinked?.(it)}
                className="w-full flex items-center gap-2 text-left rounded-md px-2 py-1.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-colors"
              >
                <Link2 className="h-3 w-3 text-primary shrink-0" />
                <Badge variant="outline" className="gap-1 text-[10px] h-5 px-1.5">
                  {typeIcon(it.type)}{it.type}
                </Badge>
                <span className="text-xs font-medium truncate flex-1">{it.title}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{it.status}</span>
              </button>
            </li>
          ))}
          {spinoffs.map((s, idx) => (
            <li
              key={`s-${idx}`}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 bg-background/50 border border-border/50"
            >
              <Badge variant="outline" className="gap-1 text-[10px] h-5 px-1.5">
                {typeIcon(s.type)}{s.type}
              </Badge>
              <span className={cn("text-xs flex-1 truncate", s.watched && "line-through text-muted-foreground")}>
                {s.title}
              </span>
              {s.watched && <Check className="h-3 w-3 text-success shrink-0" />}
              {s.link && (
                <a
                  href={s.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
