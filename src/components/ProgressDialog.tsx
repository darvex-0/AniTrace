import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { MediaItem } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MediaItem | null;
  onSave: (id: string, data: { current_season: number; current_ep: number }) => Promise<void>;
}

export const ProgressDialog = ({ open, onOpenChange, item, onSave }: Props) => {
  const [season, setSeason] = useState("1");
  const [episode, setEpisode] = useState("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && item) {
      setSeason(String(item.current_season ?? 1));
      setEpisode(String(item.current_ep ?? 0));
    }
  }, [open, item]);

  if (!item) return null;
  const isMovie = item.type === "Movie";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = Math.max(1, parseInt(season) || 1);
    const ep = Math.max(0, parseInt(episode) || 0);
    if (item.total_eps && ep > item.total_eps) {
      toast.error(`Episode can't exceed ${item.total_eps}`);
      return;
    }
    setSaving(true);
    try {
      await onSave(item.id, { current_season: s, current_ep: ep });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit progress</DialogTitle>
          <DialogDescription className="truncate">{item.title}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isMovie && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pd-s">Season</Label>
                <Input
                  id="pd-s"
                  type="number"
                  min="1"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pd-e">
                  Episode {item.total_eps ? <span className="text-muted-foreground">/ {item.total_eps}</span> : null}
                </Label>
                <Input
                  id="pd-e"
                  type="number"
                  min="0"
                  value={episode}
                  onChange={(e) => setEpisode(e.target.value)}
                />
              </div>
            </div>
          )}
          {isMovie && (
            <div className="space-y-2">
              <Label htmlFor="pd-e">Progress</Label>
              <Input
                id="pd-e"
                type="number"
                min="0"
                value={episode}
                onChange={(e) => setEpisode(e.target.value)}
                autoFocus
              />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
