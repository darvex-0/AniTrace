import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Sparkles, Film, Tv2, GitBranch, Check, Layers } from "lucide-react";
import { fetchFranchiseTimeline, fetchTMDBFranchise, type FranchiseItem } from "@/lib/gemini";
import type { MediaItem, MediaType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentItem: MediaItem | null;
  libraryItems: MediaItem[];
  onAddFranchiseItem: (prefill: Partial<MediaItem>, parent: MediaItem) => void;
}

const typeIcon = (t: string) => {
  if (t === "Anime") return <Sparkles className="h-3 w-3" />;
  if (t === "Movie") return <Film className="h-3 w-3" />;
  return <Tv2 className="h-3 w-3" />;
};

export const FranchiseDialog = ({
  open,
  onOpenChange,
  parentItem,
  libraryItems,
  onAddFranchiseItem,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<FranchiseItem[]>([]);
  const [geminiKey] = useState(() => localStorage.getItem("gemini_api_key") || import.meta.env.VITE_GEMINI_API_KEY || "");

  useEffect(() => {
    if (!open || !parentItem) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let active = true;
    const loadFranchise = async () => {
      setLoading(true);
      setSuggestions([]);
      try {
        let results: FranchiseItem[] = [];
        if (geminiKey) {
          results = await fetchFranchiseTimeline(parentItem.title, geminiKey);
        }
        if (!results || results.length === 0) {
          results = await fetchTMDBFranchise(parentItem.title, 0);
        }

        if (!active) return;

        // Strict Filter:
        // 1. Must not be the parent item itself
        // 2. Must not already exist in the user's library collection
        const filtered = results.filter((item) => {
          const itemTitle = item.title.trim().toLowerCase();
          const parentTitle = parentItem.title.trim().toLowerCase();
          if (itemTitle === parentTitle) return false;

          // Check if already in collection
          const alreadyInLibrary = libraryItems.some(
            (lib) => lib.title.trim().toLowerCase() === itemTitle
          );
          return !alreadyInLibrary;
        });

        setSuggestions(filtered);
      } catch (err) {
        console.error("Failed to load franchise connections:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadFranchise();

    return () => {
      active = false;
    };
  }, [open, parentItem, geminiKey, libraryItems]);

  if (!parentItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-6 gap-4">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                Franchise & Connected Works
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Connected movies, spinoffs, and related titles for <span className="font-semibold text-foreground">"{parentItem.title}"</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground animate-pulse">
              Scanning franchise timeline & cinematic universe...
            </p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-3 rounded-2xl border border-dashed border-border/60 bg-muted/20">
            <Layers className="h-8 w-8 text-muted-foreground/60" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">No New Franchise Works Found</h4>
              <p className="text-xs text-muted-foreground max-w-sm">
                All connected movies, prequels, or spin-offs are either already in your collection or none were discovered.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto max-h-[60vh] pr-2 space-y-2.5">
            {suggestions.map((item, idx) => {
              let relationColor = "bg-zinc-800/80 text-zinc-300 border-zinc-700/50";
              if (item.relation === "Prequel") relationColor = "bg-blue-500/15 text-blue-400 border-blue-500/30";
              else if (item.relation === "Sequel") relationColor = "bg-indigo-500/15 text-indigo-400 border-indigo-500/30";
              else if (item.relation === "Spin-off") relationColor = "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30";

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-border/50 bg-background/60 hover:bg-muted/40 hover:border-primary/30 transition-all group"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-1 font-normal bg-background/80">
                        {typeIcon(item.type)}
                        {item.type}
                      </Badge>
                      {item.relation && (
                        <Badge className={cn("text-[10px] h-4 px-1.5 font-semibold border shadow-none", relationColor)}>
                          {item.relation}
                        </Badge>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      onAddFranchiseItem(
                        {
                          title: item.title,
                          type: item.type as MediaType,
                          status: "Plan to Watch",
                          current_ep: 0,
                          total_eps: item.total_eps ?? (item.type === "Movie" ? 1 : null),
                          current_season: 1,
                          total_seasons: item.total_seasons ?? (item.type === "Movie" ? 1 : null),
                          notes: item.notes ?? null,
                          linked_spinoff_ids: [parentItem.id],
                          linked_relations: [{ id: parentItem.id, relation: item.relation ?? "Related" }],
                        },
                        parentItem
                      );
                      onOpenChange(false);
                    }}
                    className="shrink-0 gap-1.5 h-8 px-3 text-xs font-semibold bg-primary/15 text-primary hover:bg-primary hover:text-white border border-primary/30 shadow-sm transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add to Library
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
