import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Plus, X, Check, Sparkles, Film, Tv2, Link2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MEDIA_STATUSES, MEDIA_TYPES, type MediaItem, type MediaStatus, type MediaType, type Spinoff, type LinkedRelation } from "@/lib/types";
import { fetchAISuggestions, type AISuggestion } from "@/lib/gemini";
import { getTMDBDetails, searchTMDB } from "@/lib/tmdb";

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
  initialValues?: Partial<MediaItem> | null;
  allItems?: MediaItem[];
  onSave: (data: Partial<MediaItem>) => Promise<void>;
}

const typeIcon = (t: string) => {
  if (t === "Anime") return <Sparkles className="h-3 w-3" />;
  if (t === "Movie") return <Film className="h-3 w-3" />;
  return <Tv2 className="h-3 w-3" />;
};

export const MediaDialog = ({ open, onOpenChange, item, initialValues, allItems = [], onSave }: Props) => {
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
  const [linkedRelations, setLinkedRelations] = useState<LinkedRelation[]>([]);
  const [spinoffs, setSpinoffs] = useState<Spinoff[]>([]);
  const [linkSearch, setLinkSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // AI Suggestions States
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("gemini_api_key") || import.meta.env.VITE_GEMINI_API_KEY || "");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyInputValue, setKeyInputValue] = useState("");
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1);
  const [tmdbSeasons, setTmdbSeasons] = useState<any[]>([]);

  // Debounced API Suggestions Fetch
  useEffect(() => {
    if (!open) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const results = await fetchAISuggestions(trimmedTitle, type, geminiKey);
        setSuggestions(results);
        setShowSuggestions(true);
        setActiveSuggestionIdx(-1);
      } catch (err) {
        console.error("Suggestions fetch error:", err);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [title, type, open, geminiKey]);

  const handleSelectSuggestion = async (s: AISuggestion) => {
    setTitle(s.title);
    if (s.type) setType(s.type);
    if (s.total_eps !== undefined && s.total_eps !== null) setTotalEps(String(s.total_eps));
    if (s.total_seasons !== undefined && s.total_seasons !== null) setTotalSeasons(String(s.total_seasons));
    if (s.notes && !notes) setNotes(s.notes);
    setShowSuggestions(false);

    let tmdbId = s.tmdbId;
    let tmdbType = s.tmdbType;

    // Try to resolve AI suggestion with TMDB to get exact counts
    if (!tmdbId) {
      try {
        const searchRes = await searchTMDB(s.title);
        const match = searchRes.results.find((item) => {
          const isMovie = item.media_type === "movie" || (!!item.release_date && !item.first_air_date) || (!!item.title && !item.name);
          if (s.type === "Movie") {
            return isMovie;
          } else {
            return !isMovie;
          }
        });
        if (match) {
          const isMovie = match.media_type === "movie" || (!!match.release_date && !match.first_air_date) || (!!match.title && !match.name);
          tmdbId = match.id;
          tmdbType = isMovie ? "movie" : "tv";
        }
      } catch (err) {
        console.warn("Error searching TMDB to resolve AI suggestion:", err);
      }
    }

    if (tmdbId && tmdbType) {
      const toastId = toast.loading("Verifying detailed season/episode counts from TMDB...");
      try {
        const details = await getTMDBDetails(tmdbType, tmdbId);
        if (tmdbType === "tv") {
          let targetSeason = Number(currentSeason) || 1;
          const titleMatch = s.title.match(/(?:season|s)\s*(\d+)/i);
          if (titleMatch) {
            targetSeason = Number(titleMatch[1]);
            setCurrentSeason(String(targetSeason));
          }

          if (details.seasons && Array.isArray(details.seasons)) {
            setTmdbSeasons(details.seasons);
            const seasonInfo = details.seasons.find((sea: any) => sea.season_number === targetSeason);
            if (seasonInfo) {
              if (seasonInfo.episode_count !== undefined) setTotalEps(String(seasonInfo.episode_count));
            } else {
              if (details.number_of_episodes !== undefined) setTotalEps(String(details.number_of_episodes));
            }
          } else {
            setTmdbSeasons([]);
            if (details.number_of_episodes !== undefined) setTotalEps(String(details.number_of_episodes));
          }
          if (details.number_of_seasons !== undefined) setTotalSeasons(String(details.number_of_seasons));
        } else if (tmdbType === "movie") {
          setTmdbSeasons([]);
          setTotalEps("1");
          setTotalSeasons("1");
        }
        toast.dismiss(toastId);
        toast.success(`Applied verified TMDB info for "${s.title}" ✨`);
      } catch (err) {
        console.error("Failed to fetch TMDB details:", err);
        setTmdbSeasons([]);
        toast.dismiss(toastId);
        toast.success(`Applied suggestion: "${s.title}" ✨`);
      }
    } else {
      setTmdbSeasons([]);
      toast.success(`Applied AI suggestion: "${s.title}" ✨`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIdx((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIdx((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      if (activeSuggestionIdx >= 0 && activeSuggestionIdx < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[activeSuggestionIdx]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    if (open) {
      const source = item || initialValues;
      setTitle(source?.title ?? "");
      setType((source?.type as MediaType) ?? "Series");
      setStatus((source?.status as MediaStatus) ?? "Watching");
      setCurrentEp(String(source?.current_ep ?? 0));
      setTotalEps(source?.total_eps ? String(source.total_eps) : "");
      setCurrentSeason(String(source?.current_season ?? 1));
      setTotalSeasons(source?.total_seasons ? String(source.total_seasons) : "");
      setSourceName(source?.source_name ?? "");
      setSourceLink(source?.source_link ?? "");
      setNotes(source?.notes ?? "");
      setLinkedIds(source?.linked_spinoff_ids ?? []);
      setLinkedRelations(source?.linked_relations ?? []);
      setSpinoffs((source?.spinoffs ?? []) as Spinoff[]);
      setLinkSearch("");
      setGeminiKey(localStorage.getItem("gemini_api_key") || import.meta.env.VITE_GEMINI_API_KEY || "");
      setTmdbSeasons([]);
    }
  }, [open, item, initialValues]);

  // Dynamic update of episode count when currentSeason changes if we have TMDB seasons data
  useEffect(() => {
    if (tmdbSeasons.length > 0) {
      const targetSeason = Number(currentSeason) || 1;
      const seasonInfo = tmdbSeasons.find((sea: any) => sea.season_number === targetSeason);
      if (seasonInfo && seasonInfo.episode_count !== undefined) {
        setTotalEps(String(seasonInfo.episode_count));
      }
    }
  }, [currentSeason, tmdbSeasons]);

  const toggleLinked = (targetId: string) => {
    if (linkedIds.includes(targetId)) {
      setLinkedIds((prev) => prev.filter((id) => id !== targetId));
      setLinkedRelations((prev) => prev.filter((r) => r.id !== targetId));
    } else {
      setLinkedIds((prev) => [...prev, targetId]);
      setLinkedRelations((prev) => [...prev, { id: targetId, relation: "Related" }]);
    }
  };

  const updateRelation = (targetId: string, relation: "Prequel" | "Sequel" | "Spin-off" | "Related") => {
    setLinkedRelations((prev) => {
      const exists = prev.some((r) => r.id === targetId);
      if (exists) {
        return prev.map((r) => (r.id === targetId ? { ...r, relation } : r));
      }
      return [...prev, { id: targetId, relation }];
    });
  };

  const addSpinoff = () => {
    setSpinoffs((prev) => [...prev, { title: "", type: "Series", relation: "Related", link: "", watched: false }]);
  };

  const updateSpinoff = (index: number, patch: Partial<Spinoff>) => {
    setSpinoffs((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const removeSpinoff = (index: number) => {
    setSpinoffs((prev) => prev.filter((_, i) => i !== index));
  };

  const linkCandidates = useMemo(() => {
    return allItems.filter((i) => !item || i.id !== item.id);
  }, [allItems, item]);

  const filteredCandidates = useMemo(() => {
    if (!linkSearch.trim()) return linkCandidates;
    const q = linkSearch.toLowerCase();
    return linkCandidates.filter((c) => c.title.toLowerCase().includes(q));
  }, [linkCandidates, linkSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = schema.safeParse({
      title,
      type,
      status,
      current_ep: Number(currentEp) || 0,
      total_eps: totalEps === "" ? null : Number(totalEps),
      current_season: Number(currentSeason) || 1,
      total_seasons: totalSeasons === "" ? null : Number(totalSeasons),
      source_name: sourceName || null,
      source_link: sourceLink || null,
      notes: notes || null,
    });

    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Invalid input");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...parsed.data,
        linked_spinoff_ids: linkedIds,
        linked_relations: linkedRelations,
        spinoffs: spinoffs.filter((s) => s.title.trim().length > 0),
      });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Title" : "Add New Title"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 relative">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">Title *</Label>
              <button
                type="button"
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
              >
                <Sparkles className="h-3 w-3 text-primary" />
                {geminiKey ? "AI Auto-Suggest active" : "Using TMDB (Add Gemini Key)"}
              </button>
            </div>

            {showKeyInput && (
              <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-2 mb-2 text-xs">
                <p className="text-muted-foreground">
                  Paste your Google Gemini API key to unlock context-aware completions. (Saved locally in your browser)
                </p>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="AIzaSy..."
                    value={keyInputValue}
                    onChange={(e) => setKeyInputValue(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      if (keyInputValue.trim()) {
                        localStorage.setItem("gemini_api_key", keyInputValue.trim());
                        setGeminiKey(keyInputValue.trim());
                        setShowKeyInput(false);
                        toast.success("Gemini API key saved locally!");
                      } else {
                        localStorage.removeItem("gemini_api_key");
                        setGeminiKey("");
                        setShowKeyInput(false);
                        toast.info("Using TMDB fallback autocomplete");
                      }
                    }}
                  >
                    Save Key
                  </Button>
                </div>
              </div>
            )}

            <div className="relative">
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="e.g. Spider-Man: Brand New Day"
                required
                autoComplete="off"
              />
              {suggestionsLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground pointer-events-none">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                </div>
              )}
            </div>

            {/* AI Autocomplete Dropdown List */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-popover/95 backdrop-blur-md border border-border/80 rounded-xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
                <div className="p-1.5 max-h-60 overflow-y-auto">
                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between border-b border-border/40 mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary" /> Suggestions
                    </span>
                    <span>{geminiKey ? "Gemini AI" : "TMDB Data"}</span>
                  </div>
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestion(s)}
                      onMouseEnter={() => setActiveSuggestionIdx(idx)}
                      className={cn(
                        "w-full text-left px-2.5 py-2 rounded-lg text-xs flex flex-col gap-0.5 transition-colors",
                        activeSuggestionIdx === idx
                          ? "bg-primary/20 text-foreground font-medium"
                          : "hover:bg-muted/60 text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground truncate">{s.title}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {s.type && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1 font-normal bg-background/50">
                              {s.type}
                            </Badge>
                          )}
                          {s.total_eps ? (
                            <span className="text-[10px] opacity-75 font-mono">
                              {s.total_eps} eps
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {s.notes && (
                        <span className="text-[10px] text-muted-foreground truncate">{s.notes}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as MediaType)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEDIA_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as MediaStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEDIA_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {type !== "Movie" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentSeason">Current Season</Label>
                <Input
                  id="currentSeason"
                  type="number"
                  min="1"
                  value={currentSeason}
                  onChange={(e) => setCurrentSeason(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalSeasons">Total Seasons</Label>
                <Input
                  id="totalSeasons"
                  type="number"
                  min="1"
                  placeholder="Ongoing / Unknown"
                  value={totalSeasons}
                  onChange={(e) => setTotalSeasons(e.target.value)}
                />
              </div>
            </div>
          ) : null}

          {type !== "Movie" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentEp">Current Episode</Label>
                <Input
                  id="currentEp"
                  type="number"
                  min="0"
                  value={currentEp}
                  onChange={(e) => setCurrentEp(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalEps">Total Episodes</Label>
                <Input
                  id="totalEps"
                  type="number"
                  min="0"
                  placeholder="Ongoing / Unknown"
                  value={totalEps}
                  onChange={(e) => setTotalEps(e.target.value)}
                />
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sourceName">Source Name</Label>
              <Input
                id="sourceName"
                placeholder="e.g. Netflix, Crunchyroll"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceLink">Source Link</Label>
              <Input
                id="sourceLink"
                type="url"
                placeholder="https://..."
                value={sourceLink}
                onChange={(e) => setSourceLink(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Thoughts</Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Add your review, thoughts, or custom notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Connections & Timeline */}
          <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Link2 className="h-4 w-4 text-primary" />
                <span>Connections & Timeline</span>
              </div>
            </div>

            {linkCandidates.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Connect separate library items</span>
                <Input
                  value={linkSearch}
                  onChange={(e) => setLinkSearch(e.target.value)}
                  placeholder="Search your library..."
                  className="h-8 text-xs"
                />
                <ScrollArea className="h-28 rounded-md border border-border/50 bg-background/50 p-1">
                  <div className="space-y-1">
                    {filteredCandidates.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-2">No matching library titles found.</p>
                    ) : filteredCandidates.map((c) => {
                      const checked = linkedIds.includes(c.id);
                      const currentRelation = linkedRelations.find((r) => r.id === c.id)?.relation ?? "Related";
                      return (
                        <div
                          key={c.id}
                          className={cn(
                            "w-full flex items-center justify-between gap-2 px-2 py-1 rounded-md transition-colors",
                            checked ? "bg-primary/10" : "hover:bg-muted/45"
                          )}
                        >
                          <div
                            onClick={() => toggleLinked(c.id)}
                            className="flex items-center gap-2 text-left truncate flex-1 cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              readOnly
                              className="h-4 w-4 shrink-0 rounded border border-primary/45 bg-background accent-primary cursor-pointer"
                            />
                            <Badge variant="outline" className="gap-1 text-[10px] h-5 px-1.5 shrink-0 pointer-events-none">
                              {typeIcon(c.type)}{c.type}
                            </Badge>
                            <span className="text-xs truncate font-medium pointer-events-none">{c.title}</span>
                          </div>
                          {checked && (
                            <select
                              value={currentRelation}
                              onChange={(e) => updateRelation(c.id, e.target.value as any)}
                              className="h-7 w-24 text-[10px] px-2 py-0 shrink-0 border border-border/60 hover:border-primary/30 rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
                            >
                              <option value="Prequel">Prequel</option>
                              <option value="Sequel">Sequel</option>
                              <option value="Spin-off">Spin-off</option>
                              <option value="Related">Related</option>
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Custom entries (external links)</span>
                <Button type="button" size="sm" variant="outline" onClick={addSpinoff} className="h-7 gap-1 text-xs">
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
              {spinoffs.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No custom connections yet.</p>
              ) : (
                <div className="space-y-2">
                  {spinoffs.map((s, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 bg-background/50 p-2 space-y-2">
                      <div className="flex gap-2 items-center">
                        <Input
                          value={s.title}
                          onChange={(e) => updateSpinoff(idx, { title: e.target.value })}
                          placeholder="Connection title"
                          className="h-8 text-sm flex-1"
                        />
                        <select
                          value={s.relation ?? "Related"}
                          onChange={(e) => updateSpinoff(idx, { relation: e.target.value as any })}
                          className="h-8 w-24 text-xs shrink-0 border border-border/60 hover:border-primary/30 rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer px-2"
                        >
                          <option value="Prequel">Prequel</option>
                          <option value="Sequel">Sequel</option>
                          <option value="Spin-off">Spin-off</option>
                          <option value="Related">Related</option>
                        </select>
                        <select
                          value={s.type}
                          onChange={(e) => updateSpinoff(idx, { type: e.target.value as MediaType })}
                          className="h-8 w-24 text-xs shrink-0 border border-border/60 hover:border-primary/30 rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer px-2"
                        >
                          {MEDIA_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeSpinoff(idx)} className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/15">
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
