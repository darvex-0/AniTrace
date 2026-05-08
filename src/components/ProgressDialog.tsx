import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, StickyNote } from "lucide-react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { MediaItem } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MediaItem | null;
  onSave: (
    id: string,
    data: { current_season: number; current_ep: number; notes: string | null }
  ) => Promise<void>;
}

export const ProgressDialog = ({ open, onOpenChange, item, onSave }: Props) => {
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [epError, setEpError] = useState<string | null>(null);

  useEffect(() => {
    if (open && item) {
      setSeason(item.current_season ?? 1);
      setEpisode(item.current_ep ?? 0);
      setNotes(item.notes ?? "");
      setEpError(null);
    }
  }, [open, item]);

  const totalEpsForSeason = item?.total_eps ?? null;
  const maxSeason = item?.total_seasons && item.total_seasons > 0 ? item.total_seasons : undefined;

  const validateEpisode = (ep: number, s: number): string | null => {
    if (totalEpsForSeason && ep > totalEpsForSeason) {
      return `Season ${s} only has ${totalEpsForSeason} episode${totalEpsForSeason > 1 ? "s" : ""}. You can't set episode ${ep}.`;
    }
    return null;
  };

  const schema = useMemo(() => {
    if (!item) return null;
    const maxSeasonNum = item.total_seasons && item.total_seasons > 0 ? item.total_seasons : 999;
    const maxEp = item.total_eps && item.total_eps > 0 ? item.total_eps : 99999;
    return z.object({
      current_season: z
        .number()
        .int()
        .min(1, "Season must be at least 1")
        .max(maxSeasonNum, item.total_seasons ? `Season can't exceed ${maxSeasonNum}` : "Season too large"),
      current_ep: z
        .number()
        .int()
        .min(0, "Episode can't be negative")
        .max(maxEp, item.total_eps ? `Episode can't exceed ${maxEp} for this season` : "Episode too large"),
      notes: z.string().trim().max(2000, "Notes must be under 2000 characters").nullable(),
    });
  }, [item]);

  if (!item || !schema) return null;
  const isMovie = item.type === "Movie";

  const bumpSeason = (delta: number) => {
    setSeason((s) => {
      const next = s + delta;
      if (next < 1) return 1;
      if (maxSeason && next > maxSeason) {
        toast.error(`This title only has ${maxSeason} season${maxSeason > 1 ? "s" : ""}`);
        return s;
      }
      if (delta > 0) setEpisode(0);
      setEpError(null);
      return next;
    });
  };

  const handleEpisodeChange = (val: number) => {
    setEpisode(val);
    setEpError(validateEpisode(val, season));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const epValidation = validateEpisode(episode, season);
    if (epValidation) {
      setEpError(epValidation);
      toast.error(epValidation);
      return;
    }

    const parsed = schema.safeParse({
      current_season: season,
      current_ep: episode,
      notes: notes.trim() ? notes.trim() : null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSaving(true);
    try {
      await onSave(item.id, parsed.data as { current_season: number; current_ep: number; notes: string | null });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit progress</DialogTitle>
          <DialogDescription className="truncate">{item.title}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isMovie && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pd-s">
                  Season{" "}
                  {maxSeason && (
                    <span className="text-muted-foreground font-normal">/ {maxSeason}</span>
                  )}
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 shrink-0"
                    onClick={() => bumpSeason(-1)}
                    disabled={season <= 1}
                    aria-label="Previous season"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <Input
                    id="pd-s"
                    type="number"
                    min={1}
                    max={maxSeason}
                    value={season}
                    onChange={(e) => setSeason(Math.max(1, parseInt(e.target.value) || 1))}
                    className="text-center tabular-nums"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 shrink-0"
                    onClick={() => bumpSeason(1)}
                    disabled={!!maxSeason && season >= maxSeason}
                    aria-label="Next season"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pd-e">
                  Episode{" "}
                  {item.total_eps ? (
                    <span className="text-muted-foreground font-normal">/ {item.total_eps}</span>
                  ) : null}
                </Label>
                <Input
                  id="pd-e"
                  type="number"
                  min={0}
                  max={item.total_eps ?? undefined}
                  value={episode}
                  onChange={(e) => handleEpisodeChange(Math.max(0, parseInt(e.target.value) || 0))}
                  aria-invalid={!!epError}
                  aria-describedby={epError ? "pd-e-error" : undefined}
                  className={epError ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {epError && (
                  <p id="pd-e-error" className="text-xs text-destructive font-medium">
                    {epError}
                  </p>
                )}
              </div>
            </div>
          )}
          {isMovie && (
            <div className="space-y-2">
              <Label htmlFor="pd-e">Progress</Label>
              <Input
                id="pd-e"
                type="number"
                min={0}
                value={episode}
                onChange={(e) => setEpisode(Math.max(0, parseInt(e.target.value) || 0))}
                autoFocus
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="pd-n" className="flex items-center gap-1.5">
              <StickyNote className="h-3.5 w-3.5" />
              Notes
            </Label>
            <Textarea
              id="pd-n"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Important scene, missed episode, plot twist to remember..."
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">{notes.length}/2000</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
