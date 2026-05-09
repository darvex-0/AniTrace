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
      setLinkedIds(item?.linked_spinoff_ids ?? []);
      setSpinoffs((item?.spinoffs ?? []) as Spinoff[]);
      setLinkSearch("");
    }
  }, [open, item]);

  const linkCandidates = useMemo(
    () => allItems.filter((i) => i.id !== item?.id),
    [allItems, item?.id]
  );
  const filteredCandidates = useMemo(() => {
    const q = linkSearch.trim().toLowerCase();
    if (!q) return linkCandidates;
    return linkCandidates.filter((i) => i.title.toLowerCase().includes(q));
  }, [linkCandidates, linkSearch]);

  const toggleLinked = (id: string) => {
    setLinkedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  const addSpinoff = () => setSpinoffs((p) => [...p, { title: "", type: "Movie", link: "", watched: false }]);
  const updateSpinoff = (idx: number, patch: Partial<Spinoff>) =>
    setSpinoffs((p) => p.map((s, i) => i === idx ? { ...s, ...patch } : s));
  const removeSpinoff = (idx: number) => setSpinoffs((p) => p.filter((_, i) => i !== idx));

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
      const cleanSpinoffs = spinoffs
        .filter((s) => s.title.trim())
        .map((s) => ({
          title: s.title.trim(),
          type: s.type,
          link: s.link?.trim() || null,
          watched: !!s.watched,
        }));
      await onSave({
        ...(parsed.data as Partial<MediaItem>),
        linked_spinoff_ids: linkedIds,
        spinoffs: cleanSpinoffs,
      });
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

          <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <Label className="text-sm font-semibold">Spin-offs & Related Movies</Label>
            </div>

            {linkCandidates.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Link2 className="h-3 w-3" /> Link from your library
                  </span>
                  {linkedIds.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-5">{linkedIds.length} linked</Badge>
                  )}
                </div>
                <Input
                  placeholder="Search your library..."
                  value={linkSearch}
                  onChange={(e) => setLinkSearch(e.target.value)}
                  className="h-8 text-sm"
                />
                <ScrollArea className="h-32 rounded-md border border-border/50 bg-background/50">
                  <div className="p-1 space-y-0.5">
                    {filteredCandidates.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No matches</p>
                    ) : filteredCandidates.map((c) => {
                      const checked = linkedIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleLinked(c.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors",
                            checked ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/60"
                          )}
                        >
                          <Checkbox checked={checked} className="pointer-events-none" />
                          <Badge variant="outline" className="gap-1 text-[10px] h-5 px-1.5">
                            {typeIcon(c.type)}{c.type}
                          </Badge>
                          <span className="text-xs truncate flex-1">{c.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Custom entries</span>
                <Button type="button" size="sm" variant="outline" onClick={addSpinoff} className="h-7 gap-1 text-xs">
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
              {spinoffs.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No custom spin-offs yet.</p>
              ) : (
                <div className="space-y-2">
                  {spinoffs.map((s, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 bg-background/50 p-2 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={s.title}
                          onChange={(e) => updateSpinoff(idx, { title: e.target.value })}
                          placeholder="Spin-off title"
                          className="h-8 text-sm flex-1"
                        />
                        <Select value={s.type} onValueChange={(v) => updateSpinoff(idx, { type: v as MediaType })}>
                          <SelectTrigger className="h-8 w-28 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {MEDIA_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeSpinoff(idx)} className="h-8 w-8 text-destructive">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Input
                          value={s.link ?? ""}
                          onChange={(e) => updateSpinoff(idx, { link: e.target.value })}
                          placeholder="https://... (optional)"
                          className="h-8 text-sm flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => updateSpinoff(idx, { watched: !s.watched })}
                          className={cn(
                            "h-8 px-2 rounded-md border text-xs flex items-center gap-1 transition-colors shrink-0",
                            s.watched
                              ? "bg-success/15 border-success/40 text-success"
                              : "bg-background border-border text-muted-foreground hover:bg-muted"
                          )}
                        >
                          <Check className="h-3 w-3" />
                          Watched
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
