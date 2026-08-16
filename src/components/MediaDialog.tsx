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
import { fetchAISuggestions, fetchFranchiseTimeline, fetchTMDBRecommendations, type AISuggestion } from "@/lib/gemini";
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
  const [suggestedConnections, setSuggestedConnections] = useState<Spinoff[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);

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
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [title, type, geminiKey, open]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#title-container")) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelectSuggestion = async (s: AISuggestion) => {
    setTitle(s.title);
    if (s.type) setType(s.type);
    if (s.total_eps !== undefined) setTotalEps(s.total_eps !== null ? String(s.total_eps) : "");
    if (s.total_seasons !== undefined) setTotalSeasons(s.total_seasons !== null ? String(s.total_seasons) : "");
    if (s.notes) setNotes(s.notes);
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

    // Fetch franchise / similar connections in background
    setLoadingConnections(true);
    setSuggestedConnections([]);
    try {
      if (geminiKey) {
        const conns = await fetchFranchiseTimeline(s.title, geminiKey);
        setSuggestedConnections(conns.filter(c => !spinoffs.some(existing => existing.title.toLowerCase() === c.title.toLowerCase())));
      } else if (tmdbId && tmdbType) {
        const conns = await fetchTMDBRecommendations(tmdbType, tmdbId);
        setSuggestedConnections(conns.filter(c => !spinoffs.some(existing => existing.title.toLowerCase() === c.title.toLowerCase())));
      }
    } catch (err) {
      console.warn("Failed to load suggested connections:", err);
    } finally {
      setLoadingConnections(false);
    }

    if (tmdbId && tmdbType) {
      const toastId = toast.loading("Verifying detailed season/episode counts from TMDB...");
      try {
        const details = await getTMDBDetails(tmdbType, tmdbId);
        if (tmdbType === "tv") {
          // Parse target season number from title (e.g. "season 2" or "s2")
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

  const addSuggestedConnection = (conn: Spinoff) => {
    setSpinoffs((prev) => [...prev, conn]);
    setSuggestedConnections((prev) => prev.filter((c) => c.title !== conn.title));
    toast.success(`Connected "${conn.title}"! ✨`);
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
      setLinkedRelations(item?.linked_relations ?? []);
      setSpinoffs((item?.spinoffs ?? []) as Spinoff[]);
      setLinkSearch("");
      setGeminiKey(localStorage.getItem("gemini_api_key") || import.meta.env.VITE_GEMINI_API_KEY || "");
      setTmdbSeasons([]);
      setSuggestedConnections([]);
      setLoadingConnections(false);
    }
  }, [open, item]);

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
    if (linkedIds.includes(id)) {
      setLinkedIds((prev) => prev.filter((x) => x !== id));
      setLinkedRelations((prev) => prev.filter((x) => x.id !== id));
    } else {
      setLinkedIds((prev) => [...prev, id]);
      setLinkedRelations((prev) => [...prev, { id, relation: "Related" }]);
    }
  };

  const updateRelation = (id: string, relation: "Prequel" | "Sequel" | "Spin-off" | "Related") => {
    setLinkedRelations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, relation } : r))
    );
  };

  const addSpinoff = () => setSpinoffs((p) => [...p, { title: "", type: "Movie", relation: "Related", link: "", watched: false }]);
  const updateSpinoff = (idx: number, patch: Partial<Spinoff>) =>
    setSpinoffs((p) => p.map((s, i) => i === idx ? { ...s, ...patch } : s));
  const removeSpinoff = (idx: number) => setSpinoffs((p) => p.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isMovie = type === "Movie";
    const parsed = schema.safeParse({
      title,
      type,
      status,
      current_ep: isMovie ? (status === "Completed" ? 1 : 0) : (Number(currentEp) || 0),
      total_eps: isMovie ? 1 : (totalEps ? Number(totalEps) : null),
      current_season: isMovie ? 1 : (Number(currentSeason) || 1),
      total_seasons: isMovie ? 1 : (totalSeasons ? Number(totalSeasons) : null),
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
          relation: s.relation || "Related",
          link: s.link?.trim() || null,
          watched: !!s.watched,
        }));
      await onSave({
        ...(parsed.data as Partial<MediaItem>),
        linked_spinoff_ids: linkedIds,
        linked_relations: linkedRelations,
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
          <div id="title-container" className="space-y-2 relative">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (title.trim().length >= 2) setShowSuggestions(true);
              }}
              placeholder="e.g. Frieren: Beyond Journey's End"
              required
              autoComplete="off"
            />
            {showSuggestions && (suggestions.length > 0 || suggestionsLoading || !geminiKey) && (
              <div
                className="absolute z-50 w-full mt-1 rounded-xl border border-border/50 bg-background/95 backdrop-blur-md shadow-lg max-h-72 overflow-y-auto overflow-x-hidden flex flex-col glass-panel animate-in fade-in slide-in-from-top-1 duration-200"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="p-1.5 space-y-1 flex-1">
                  {suggestionsLoading && suggestions.length === 0 ? (
                    <div className="flex items-center justify-center py-4 gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span>Fetching AI suggestions...</span>
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="text-center py-3 text-xs text-muted-foreground">
                      No matching suggestions
                    </div>
                  ) : (
                    suggestions.map((s, idx) => {
                      const isSelected = activeSuggestionIdx === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelectSuggestion(s)}
                          onMouseEnter={() => setActiveSuggestionIdx(idx)}
                          className={cn(
                            "flex flex-col gap-1 px-3 py-2 rounded-lg cursor-pointer transition-all border border-transparent",
                            isSelected
                              ? "bg-primary/10 border-primary/20"
                              : "hover:bg-muted/40"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-foreground truncate">{s.title}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <Badge variant="outline" className="text-[9px] px-1 h-4 bg-muted/30">
                                {s.type}
                              </Badge>
                              {s.isAI && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] px-1 h-4 bg-fuchsia-500/20 text-fuchsia-300 border-none font-bold flex items-center gap-0.5 animate-pulse"
                                >
                                  <Sparkles className="h-2 w-2 fill-current" /> AI
                                </Badge>
                              )}
                            </div>
                          </div>
                          {s.notes && (
                            <span className="text-[10px] text-muted-foreground line-clamp-1 leading-normal">
                              {s.notes}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="border-t border-border/40 p-2 bg-muted/10 text-[10px]">
                  {showKeyInput ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="password"
                        placeholder="Paste Gemini API Key..."
                        value={keyInputValue}
                        onChange={(e) => setKeyInputValue(e.target.value)}
                        className="h-6 text-[10px] py-1 px-2 flex-1"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="h-6 px-2 text-[10px] bg-primary hover:bg-primary/90 text-white"
                        onClick={() => {
                          const val = keyInputValue.trim();
                          if (val) {
                            localStorage.setItem("gemini_api_key", val);
                            setGeminiKey(val);
                            setShowKeyInput(false);
                            setKeyInputValue("");
                            toast.success("Gemini API key saved! AI suggestions active. ✨");
                          }
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 px-1.5 text-[10px] text-muted-foreground"
                        onClick={() => setShowKeyInput(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-muted-foreground px-1">
                      <span className="flex items-center gap-1 font-medium">
                        {geminiKey ? (
                          <>
                            <Sparkles className="h-3 w-3 text-fuchsia-400 fill-fuchsia-400/20 animate-pulse" />
                            <span>Gemini AI active</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 text-muted-foreground" />
                            <span>TMDB fallback active (AI inactive)</span>
                          </>
                        )}
                      </span>
                      <button
                        type="button"
                        className="text-primary hover:underline font-semibold"
                        onClick={() => {
                          setKeyInputValue(geminiKey);
                          setShowKeyInput(true);
                        }}
                      >
                        {geminiKey ? "Change Key" : "Configure AI"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
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

          {type !== "Movie" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cur">Current episode</Label>
                <Input id="cur" type="number" min="0" value={currentEp} onChange={(e) => setCurrentEp(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tot">Total episodes (this season)</Label>
                <Input id="tot" type="number" min="0" value={totalEps} onChange={(e) => setTotalEps(e.target.value)} placeholder="Optional" />
              </div>
            </div>
          )}

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
              <Label className="text-sm font-semibold">Connections & Timeline</Label>
            </div>

            {linkCandidates.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Link2 className="h-3 w-3" /> Connect separate library items
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

            {/* Suggested Franchise Connections (AI or TMDB powered) */}
            {(loadingConnections || suggestedConnections.length > 0) && (
              <div className="space-y-2 border-t border-border/40 pt-3">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                  Suggested Franchise Connections
                </span>
                {loadingConnections ? (
                  <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    <span>Discovering connected titles...</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {suggestedConnections.map((conn, idx) => {
                      let relationColor = "bg-zinc-800 text-zinc-300 border border-zinc-700/50";
                      if (conn.relation === "Prequel") relationColor = "bg-blue-500/10 text-blue-300 border border-blue-500/20";
                      else if (conn.relation === "Sequel") relationColor = "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20";
                      else if (conn.relation === "Spin-off") relationColor = "bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20";

                      return (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg border border-border/50 bg-background/40 text-[11px] w-full hover:border-primary/20 transition-all"
                        >
                          <div className="flex items-center gap-1.5 truncate flex-1">
                            <span className="font-medium truncate text-foreground/90">{conn.title}</span>
                            <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-muted/40 shrink-0 font-normal">
                              {conn.type}
                            </Badge>
                            {conn.relation && (
                              <Badge className={cn("text-[8px] h-3.5 px-1 font-bold shrink-0 shadow-none border-none", relationColor)}>
                                {conn.relation}
                              </Badge>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => addSuggestedConnection(conn)}
                            className="flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold transition-all shrink-0 active:scale-95 text-[10px]"
                          >
                            <Plus className="h-2.5 w-2.5" /> Connect
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
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
