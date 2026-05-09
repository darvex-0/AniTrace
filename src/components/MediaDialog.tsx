import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Plus, X, Check, Sparkles, Film, Tv2, Link2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MEDIA_STATUSES, MEDIA_TYPES, type MediaItem, type MediaStatus, type MediaType, type Spinoff } from "@/lib/types";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  type: z.enum(["Anime", "Series", "Movie"]),
  status: z.enum(["Watching", "On-Hold", "Completed", "Plan to Watch"]),
  current_ep: z.number().int().min(0).max(99999),
  total_eps: z.number().int().min(0).max(99999).nullable(),
  current_season: z.number().int().min(1).max(999),
  total_seasons: z.number().int().min(1).max(999).nullable(),
  source_name: z.string().trim().max(100).nullable(),
  source_link: z.string().trim().url("Must be a valid URL").max(2000).nullable().or(z.literal("").transform(() => null)),
  notes: z.string().trim().max(2000).nullable(),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MediaItem | null;
  allItems?: MediaItem[];
  onSave: (data: Partial<MediaItem>) => Promise<void>;
}

const typeIcon = (t: string) => {
  if (t === "Anime") return <Sparkles className="h-3 w-3" />;
  if (t === "Movie") return <Film className="h-3 w-3" />;
  return <Tv2 className="h-3 w-3" />;
};

export const MediaDialog = ({ open, onOpenChange, item, allItems = [], onSave }: Props) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<MediaType>("Series");
  const [status, setStatus] = useState<MediaStatus>("Watching");
  const [currentEp, setCurrentEp] = useState("0");
  const [totalEps, setTotalEps] = useState("");
  const [currentSeason, setCurrentSeason] = useState("1");
  const [totalSeasons, setTotalSeasons] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceLink, setSourceLink] = useState("");
  const [notes, setNotes] = useState("");
  const [linkedIds, setLinkedIds] = useState<string[]>([]);
  const [spinoffs, setSpinoffs] = useState<Spinoff[]>([]);
  const [linkSearch, setLinkSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(item?.title ?? "");
      setType((item?.type as MediaType) ?? "Series");
      setStatus((item?.status as MediaStatus) ?? "Watching");
      setCurrentEp(String(item?.current_ep ?? 0));
      setTotalEps(item?.total_eps ? String(item.total_eps) : "");
      setCurrentSeason(String(item?.current_season ?? 1));
      setTotalSeasons(item?.total_seasons ? String(item.total_seasons) : "");
      setSourceName(item?.source_name ?? "");
      setSourceLink(item?.source_link ?? "");
      setNotes(item?.notes ?? "");
    }
  }, [open, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      title,
      type,
      status,
      current_ep: Number(currentEp) || 0,
      total_eps: totalEps ? Number(totalEps) : null,
      current_season: Number(currentSeason) || 1,
      total_seasons: totalSeasons ? Number(totalSeasons) : null,
      source_name: sourceName || null,
      source_link: sourceLink || null,
      notes: notes || null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSaving(true);
    try {
      await onSave(parsed.data as Partial<MediaItem>);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit" : "Add"} Title</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Frieren: Beyond Journey's End" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as MediaType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MEDIA_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as MediaStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MEDIA_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {type !== "Movie" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cs">Current season</Label>
                <Input id="cs" type="number" min="1" value={currentSeason} onChange={(e) => setCurrentSeason(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ts">Total seasons</Label>
                <Input id="ts" type="number" min="1" value={totalSeasons} onChange={(e) => setTotalSeasons(e.target.value)} placeholder="Optional" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cur">Current episode</Label>
              <Input id="cur" type="number" min="0" value={currentEp} onChange={(e) => setCurrentEp(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tot">Total episodes {type !== "Movie" ? "(this season)" : ""}</Label>
              <Input id="tot" type="number" min="0" value={totalEps} onChange={(e) => setTotalEps(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="src">Watch source</Label>
            <Input id="src" value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="Crunchyroll, Netflix, VLC..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Direct link</Label>
            <Input id="link" type="url" value={sourceLink} onChange={(e) => setSourceLink(e.target.value)} placeholder="https://..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Plot points, characters to remember, theories..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
