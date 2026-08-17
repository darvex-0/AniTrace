import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Loader2, BookOpen, SlidersHorizontal, X } from "lucide-react";
import {
  collection, query, where, orderBy, getDocs,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { MediaCard } from "@/components/MediaCard";
import { MediaDialog } from "@/components/MediaDialog";
import { ProgressDialog } from "@/components/ProgressDialog";
import { FranchiseDialog } from "@/components/FranchiseDialog";
import { UserNav } from "@/components/UserNav";
import { MEDIA_STATUSES, type MediaItem, type MediaType } from "@/lib/types";

const STATUS_CONFIG = {
  All: { color: "hsl(240 5% 55%)", activeColor: "hsl(0 0% 90%)" },
  Watching: { color: "hsl(199 89% 60%)", activeColor: "hsl(199 89% 75%)" },
  "On-Hold": { color: "hsl(38 92% 55%)", activeColor: "hsl(38 92% 70%)" },
  Completed: { color: "hsl(142 72% 45%)", activeColor: "hsl(142 72% 60%)" },
  "Plan to Watch": { color: "hsl(240 5% 55%)", activeColor: "hsl(240 5% 75%)" },
};

// Helper to compute progress percentage for sorting
const getProgressPercent = (item: MediaItem) => {
  if (item.type === "Movie") {
    return item.status === "Completed" ? 100 : 0;
  }
  if (!item.total_eps) return 0;
  return Math.min(100, Math.max(0, (item.current_ep / item.total_eps) * 100));
};

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Watching");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [prefillItem, setPrefillItem] = useState<Partial<MediaItem> | null>(null);
  const [franchiseTarget, setFranchiseTarget] = useState<MediaItem | null>(null);
  const [progressTarget, setProgressTarget] = useState<MediaItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  
  // Advanced filters & sorting states
  const [typeFilter, setTypeFilter] = useState<MediaType | "All">("All");
  const [sortBy, setSortBy] = useState<"updated_at" | "title" | "rating" | "progress" | "created_at">("updated_at");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    document.title = "My List — AniTrace";
  }, [user]);

  const loadItems = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "media"),
        where("user_id", "==", user.uid),
        orderBy("updated_at", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => {
        const raw = d.data();
        
        // Robust type normalization: Maps lowercase database values ("tv", "movie")
        // and empty strings safely to capitalized MediaType enums.
        let normalizedType: MediaType = "Series";
        if (raw.type) {
          const t = String(raw.type).trim().toLowerCase();
          if (t === "anime") {
            normalizedType = "Anime";
          } else if (t === "movie") {
            normalizedType = "Movie";
          } else if (t === "tv" || t === "series") {
            normalizedType = "Series";
          }
        }

        return {
          ...raw,
          id: d.id,
          type: normalizedType,
          created_at: raw.created_at?.toDate?.()?.toISOString() || raw.created_at || new Date().toISOString(),
          updated_at: raw.updated_at?.toDate?.()?.toISOString() || raw.updated_at || new Date().toISOString(),
          last_watched: raw.last_watched?.toDate?.()?.toISOString() || raw.last_watched || null,
        };
      }) as MediaItem[];
      setItems(data);
    } catch (error) {
      console.error("Error loading library:", error);
      toast.error("Failed to load library");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const counts = useMemo(() => {
    // Dynamic counts: only count items matching the active type filter & search query.
    const matchingTypeSearch = items.filter((i) => {
      const matchesType = typeFilter === "All" || i.type === typeFilter;
      const matchesSearch =
        !search.trim() ||
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        (i.source_name?.toLowerCase().includes(search.toLowerCase()));
      return matchesType && matchesSearch;
    });

    const c: Record<string, number> = { All: matchingTypeSearch.length };
    MEDIA_STATUSES.forEach((s) => (c[s] = 0));
    matchingTypeSearch.forEach((i) => (c[i.status] = (c[i.status] ?? 0) + 1));
    return c;
  }, [items, typeFilter, search]);

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { All: items.length, Anime: 0, Series: 0, Movie: 0 };
    items.forEach((i) => {
      if (c[i.type] !== undefined) {
        c[i.type]++;
      }
    });
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    // 1. Filter items
    const result = items.filter((i) => {
      const matchesStatus = statusFilter === "All" || i.status === statusFilter;
      const matchesType = typeFilter === "All" || i.type === typeFilter;
      const matchesSearch =
        !search.trim() ||
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        (i.source_name?.toLowerCase().includes(search.toLowerCase()));
      return matchesStatus && matchesType && matchesSearch;
    });

    // 2. Sort items
    return result.sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "rating") {
        const ratingA = a.rating ?? 0;
        const ratingB = b.rating ?? 0;
        return ratingB - ratingA;
      }
      if (sortBy === "progress") {
        return getProgressPercent(b) - getProgressPercent(a);
      }
      if (sortBy === "created_at") {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      }
      // default: updated_at (descending)
      const dateA = new Date(a.updated_at).getTime();
      const dateB = new Date(b.updated_at).getTime();
      return dateB - dateA;
    });
  }, [items, statusFilter, typeFilter, search, sortBy]);

  const handleSave = async (data: Partial<MediaItem>) => {
    if (!user) return;
    try {
      if (editing) {
        const mediaRef = doc(db, "media", editing.id);
        await updateDoc(mediaRef, { ...data, updated_at: serverTimestamp() });
        toast.success("Updated successfully");
      } else {
        await addDoc(collection(db, "media"), {
          ...data,
          user_id: user.uid,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
          current_ep: data.current_ep || 0,
          current_season: data.current_season || 1,
          status: data.status || "Watching",
        });
        toast.success("Added to your library 🎌");
      }
      setEditing(null);
      setDialogOpen(false);
      loadItems();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleIncrement = async (item: MediaItem) => {
    const last_watched = new Date().toISOString();
    let nextEp = item.current_ep + 1;
    let nextSeason = item.current_season ?? 1;
    let rolledOver = false;
    let isComplete = false;

    if (item.total_eps && nextEp > item.total_eps) {
      if (!item.total_seasons || nextSeason < item.total_seasons) {
        nextSeason++;
        nextEp = 1;
        rolledOver = true;
      } else {
        nextEp = item.total_eps;
        isComplete = true;
      }
    } else if (item.total_eps && nextEp === item.total_eps) {
      if (item.total_seasons && nextSeason >= item.total_seasons) {
        isComplete = true;
      }
    }

    const update = {
      current_ep: nextEp,
      current_season: nextSeason,
      last_watched,
      updated_at: serverTimestamp(),
      ...(isComplete ? { status: "Completed" as const } : {}),
    };

    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, ...update as any, status: isComplete ? "Completed" : i.status } : i
      )
    );

    try {
      const mediaRef = doc(db, "media", item.id);
      await updateDoc(mediaRef, update);
      if (isComplete) toast.success(`Finished ${item.title}! 🎉`);
      else if (rolledOver) toast.success(`Rolled over to Season ${nextSeason} · Ep 1`);
    } catch {
      toast.error("Failed to update");
      loadItems();
    }
  };

  const handleSaveProgress = async (
    id: string,
    data: { current_season: number; current_ep: number; notes: string | null }
  ) => {
    const target = items.find((i) => i.id === id);
    const isComplete = !!(target?.total_eps && data.current_ep >= target.total_eps);
    const last_watched = new Date().toISOString();

    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, ...data, last_watched, status: isComplete ? "Completed" : i.status } : i
      )
    );

    try {
      const mediaRef = doc(db, "media", id);
      await updateDoc(mediaRef, {
        ...data,
        last_watched,
        updated_at: serverTimestamp(),
        ...(isComplete ? { status: "Completed" } : {}),
      });
      toast.success("Progress updated");
    } catch {
      toast.error("Failed to update progress");
      loadItems();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "media", deleteTarget.id));
      toast.success("Removed from library");
      setDeleteTarget(null);
      loadItems();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background glow blobs */}
      <div className="glow-blob-fuchsia" style={{ width: 500, height: 500, top: -100, right: -50, opacity: 0.07 }} />
      <div className="glow-blob-indigo" style={{ width: 400, height: 400, bottom: 200, left: -80, opacity: 0.06 }} />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/40 glass-panel-heavy">
        <div className="px-6 lg:px-8 flex items-center justify-between py-4">
          {/* Mobile logo */}
          <div className="lg:hidden">
            <span className="text-xl font-black gradient-text">My List</span>
          </div>
          {/* Desktop title */}
          <div className="hidden lg:flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">My Library</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
              {items.length} titles
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setEditing(null); setDialogOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-105 glow-fuchsia"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Title</span>
            </button>
            {user && <UserNav user={user} signOut={signOut} />}
          </div>
        </div>
      </header>

      <div className="px-6 lg:px-8 py-6">
        {/* Advanced Controls: Search, Sort and Type Segmented Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          {/* Search bar & Sort Dropdown for Mobile (flex layout) */}
          <div className="flex flex-1 items-center gap-3 w-full lg:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search library..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-muted/20 border border-border/40 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 hover:bg-muted/40 rounded-full transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sort Select */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-muted/20 border border-border/40 pl-4 pr-9 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer transition-all hover:bg-muted/30"
                style={{ minWidth: "120px" }}
              >
                <option value="updated_at" className="bg-zinc-950 text-zinc-200">Last Updated</option>
                <option value="title" className="bg-zinc-950 text-zinc-200">Title (A-Z)</option>
                <option value="rating" className="bg-zinc-950 text-zinc-200">Rating</option>
                <option value="progress" className="bg-zinc-950 text-zinc-200">Progress %</option>
                <option value="created_at" className="bg-zinc-950 text-zinc-200">Date Added</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400">
                <SlidersHorizontal className="h-3 w-3" />
              </div>
            </div>
          </div>

          {/* Type Segmentation Tabs (Pill Control) */}
          <div className="flex items-center p-1 rounded-xl bg-muted/20 border border-border/30 w-fit self-start lg:self-auto overflow-hidden">
            {(["All", "Anime", "Series", "Movie"] as const).map((type) => {
              const isActive = typeFilter === type;
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`relative px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? "text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  style={{
                    background: isActive ? "var(--gradient-primary)" : "transparent",
                  }}
                >
                  {type === "Movie" ? "Movies" : type === "Series" ? "TV Series" : type}
                  <span className={`ml-1.5 text-[9px] px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-white/20 text-white" : "bg-muted/40 text-zinc-500 font-medium"
                  }`}>
                    {typeCounts[type] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {(["All", ...MEDIA_STATUSES] as const).map((s) => {
            const isActive = statusFilter === s;
            const cfg = STATUS_CONFIG[s as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.All;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200"
                style={{
                  background: isActive ? `${cfg.color}20` : "transparent",
                  borderColor: isActive ? `${cfg.color}50` : "hsl(240 6% 18%)",
                  color: isActive ? cfg.activeColor : "hsl(240 5% 55%)",
                  boxShadow: isActive ? `0 0 12px ${cfg.color}20` : "none",
                }}
              >
                {s}
                <span
                  className="rounded-full px-1.5 text-[10px] font-bold"
                  style={{
                    background: isActive ? `${cfg.color}30` : "hsl(240 6% 14%)",
                    color: isActive ? cfg.activeColor : "hsl(240 5% 50%)",
                  }}
                >
                  {counts[s] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 rounded-2xl bg-muted/20 animate-pulse border border-border/20" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="p-5 rounded-2xl mb-4 border border-border/30"
              style={{ background: "hsl(240 10% 7%)" }}
            >
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">
              {items.length === 0 ? "Your library is empty" : "No titles match this filter"}
            </h3>
            <p className="text-muted-foreground text-sm mb-5">
              {items.length === 0
                ? "Start tracking anime, series and movies you love."
                : "Try adjusting your search or filter."}
            </p>
            {items.length === 0 && (
              <button
                onClick={() => { setEditing(null); setDialogOpen(true); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white glow-fuchsia"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Plus className="h-4 w-4" />
                Add your first title
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-4">
              Showing {filtered.length} of {items.length} titles
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  allItems={items}
                  onIncrement={handleIncrement}
                  onEdit={(i) => { setEditing(i); setPrefillItem(null); setDialogOpen(true); }}
                  onEditProgress={(i) => setProgressTarget(i)}
                  onDelete={(i) => setDeleteTarget(i)}
                  onOpenFranchise={(i) => setFranchiseTarget(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Dialogs */}
      <MediaDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) {
            setEditing(null);
            setPrefillItem(null);
          }
        }}
        item={editing}
        initialValues={prefillItem}
        allItems={items}
        onSave={handleSave}
      />
      <FranchiseDialog
        open={!!franchiseTarget}
        onOpenChange={(o) => !o && setFranchiseTarget(null)}
        parentItem={franchiseTarget}
        libraryItems={items}
        onAddFranchiseItem={(prefill) => {
          setEditing(null);
          setPrefillItem(prefill);
          setDialogOpen(true);
        }}
      />
      <ProgressDialog
        open={!!progressTarget}
        onOpenChange={(o) => !o && setProgressTarget(null)}
        item={progressTarget}
        onSave={handleSaveProgress}
      />
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="glass-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove "{deleteTarget?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
