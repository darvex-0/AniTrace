import { useState } from "react";
import { ChevronDown, Film, Tv2, Sparkles, ExternalLink, Check, Link2, Plus, ArrowRight, GitBranch, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MediaItem, Spinoff, LinkedRelation } from "@/lib/types";

const typeIcon = (t: string) => {
  if (t === "Anime") return <Sparkles className="h-3 w-3" />;
  if (t === "Movie") return <Film className="h-3 w-3" />;
  return <Tv2 className="h-3 w-3" />;
};

interface Props {
  spinoffs: Spinoff[];
  linked: MediaItem[];
  linkedRelations?: LinkedRelation[] | null;
  onOpenLinked?: (item: MediaItem) => void;
  onAdd?: () => void;
}

export const SpinoffsSection = ({ spinoffs, linked, linkedRelations = [], onOpenLinked, onAdd }: Props) => {
  const [open, setOpen] = useState(false);
  const total = spinoffs.length + linked.length;

  if (total === 0) {
    if (!onAdd) return null;
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 bg-muted/10 px-3 py-1.5 text-xs text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors"
      >
        <Plus className="h-3 w-3" />
        Connect spin-off, prequel or sequel
      </button>
    );
  }

  // Grouping items based on relationship
  const getRelation = (it: MediaItem) => {
    return linkedRelations?.find(r => r.id === it.id)?.relation ?? "Related";
  };

  const prequels = [
    ...linked.filter(it => getRelation(it) === "Prequel").map(it => ({ isLinked: true, item: it })),
    ...spinoffs.filter(s => s.relation === "Prequel").map(s => ({ isLinked: false, spinoff: s }))
  ];

  const sequels = [
    ...linked.filter(it => getRelation(it) === "Sequel").map(it => ({ isLinked: true, item: it })),
    ...spinoffs.filter(s => s.relation === "Sequel").map(s => ({ isLinked: false, spinoff: s }))
  ];

  const spinoffsList = [
    ...linked.filter(it => getRelation(it) === "Spin-off").map(it => ({ isLinked: true, item: it })),
    ...spinoffs.filter(s => s.relation === "Spin-off").map(s => ({ isLinked: false, spinoff: s }))
  ];

  const relatedList = [
    ...linked.filter(it => getRelation(it) === "Related").map(it => ({ isLinked: true, item: it })),
    ...spinoffs.filter(s => !s.relation || s.relation === "Related").map(s => ({ isLinked: false, spinoff: s }))
  ];

  const categories = [
    {
      title: "Prequels",
      items: prequels,
      colorClass: "border-amber-500/30 bg-amber-500/5 text-amber-400",
      accentBorder: "border-l-amber-500",
      icon: <History className="h-3.5 w-3.5 text-amber-400" />
    },
    {
      title: "Sequels",
      items: sequels,
      colorClass: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
      accentBorder: "border-l-emerald-500",
      icon: <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
    },
    {
      title: "Spin-offs",
      items: spinoffsList,
      colorClass: "border-fuchsia-500/30 bg-fuchsia-500/5 text-fuchsia-400",
      accentBorder: "border-l-fuchsia-500",
      icon: <GitBranch className="h-3.5 w-3.5 text-fuchsia-400" />
    },
    {
      title: "Related & Connected",
      items: relatedList,
      colorClass: "border-slate-500/30 bg-slate-500/5 text-slate-400",
      accentBorder: "border-l-slate-500",
      icon: <Link2 className="h-3.5 w-3.5 text-slate-400" />
    }
  ].filter(c => c.items.length > 0);

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 overflow-hidden">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold hover:bg-muted/40 transition-colors"
      >
        <span className="flex items-center gap-2">
          <GitBranch className="h-3.5 w-3.5 text-primary" />
          <span>Connected Franchise</span>
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px] bg-primary/20 text-primary border-primary/25">{total}</Badge>
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-3">
          {categories.map((cat, catIdx) => (
            <div key={catIdx} className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/80 px-1">
                {cat.icon}
                <span>{cat.title}</span>
              </div>
              <ul className={cn("space-y-1 pl-2 border-l-2 ml-2.5", cat.accentBorder)}>
                {cat.items.map((it, idx) => {
                  if (it.isLinked && it.item) {
                    const item = it.item;
                    const prog = item.total_eps && item.total_eps > 0
                      ? `${Math.round((item.current_ep / item.total_eps) * 100)}%`
                      : item.status;
                    return (
                      <li key={`l-${item.id}`}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onOpenLinked?.(item); }}
                          className="w-full flex items-center gap-2 text-left rounded-md px-2 py-1 bg-background/40 hover:bg-primary/10 border border-border/30 transition-all hover:scale-[1.01]"
                        >
                          <Link2 className="h-2.5 w-2.5 text-primary shrink-0 opacity-60" />
                          <Badge variant="outline" className="gap-1 text-[9px] h-4.5 px-1 shrink-0 bg-background/50">
                            {typeIcon(item.type)}{item.type}
                          </Badge>
                          <span className="text-[11px] font-medium truncate flex-1">{item.title}</span>
                          <span className="text-[9px] text-muted-foreground shrink-0 bg-muted/40 px-1 py-0.5 rounded">{prog}</span>
                        </button>
                      </li>
                    );
                  } else if (it.spinoff) {
                    const s = it.spinoff;
                    return (
                      <li
                        key={`s-${idx}`}
                        className="flex items-center gap-2 rounded-md px-2 py-1 bg-background/40 border border-border/30"
                      >
                        <Badge variant="outline" className="gap-1 text-[9px] h-4.5 px-1 shrink-0 bg-background/50">
                          {typeIcon(s.type)}{s.type}
                        </Badge>
                        <span className={cn("text-[11px] flex-1 truncate", s.watched && "line-through text-muted-foreground")}>
                          {s.title}
                        </span>
                        {s.watched && <Check className="h-2.5 w-2.5 text-success shrink-0" />}
                        {s.link && (
                          <a
                            href={s.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </li>
                    );
                  }
                  return null;
                })}
              </ul>
            </div>
          ))}
          {onAdd && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
              className="w-full flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[10px] text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors border border-dashed border-border/50"
            >
              <Plus className="h-3 w-3" /> Connect another
            </button>
          )}
        </div>
      )}
    </div>
  );
};
