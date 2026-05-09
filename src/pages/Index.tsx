import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Tv, LogOut, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { MediaCard } from "@/components/MediaCard";
import { MediaDialog } from "@/components/MediaDialog";
import { ProgressDialog } from "@/components/ProgressDialog";
import { MEDIA_STATUSES, type MediaItem } from "@/lib/types";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Watching");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [progressTarget, setProgressTarget] = useState<MediaItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    document.title = "WatchLog — Track your shows, anime & movies";
  }, [user]);

  const loadItems = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("media")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error("Failed to load library");
    } else {
      setItems((data ?? []) as unknown as MediaItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: items.length };
    MEDIA_STATUSES.forEach((s) => (c[s] = 0));
    items.forEach((i) => (c[i.status] = (c[i.status] ?? 0) + 1));
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchesStatus = statusFilter === "All" || i.status === statusFilter;
      const matchesSearch = !search.trim() ||
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        (i.source_name?.toLowerCase().includes(search.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [items, statusFilter, search]);

  const handleSave = async (data: Partial<MediaItem>) => {
    if (!user) return;
    if (editing) {
      const { error } = await supabase
        .from("media")
        .update(data as any)
        .eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Updated");
    } else {
      const { error } = await supabase
        .from("media")
        .insert({ ...data, user_id: user.id, title: data.title! } as any);
      if (error) { toast.error(error.message); return; }
      toast.success("Added to your library");
    }
    setEditing(null);
    loadItems();
  };

  const handleIncrement = async (item: MediaItem) => {
    const last_watched = new Date().toISOString();
    let nextEp = item.current_ep + 1;
    let nextSeason = item.current_season ?? 1;
    let rolledOver = false;
    let isComplete = false;

    if (item.total_eps && nextEp > item.total_eps) {
      // Finished the current season — roll over to next season if there is one
      if (!item.total_seasons || nextSeason < item.total_seasons) {
        nextSeason = nextSeason + 1;
        nextEp = 1;
        rolledOver = true;
      } else {
        // Final season finished
        nextEp = item.total_eps;
        isComplete = true;
      }
    } else if (item.total_eps && nextEp === item.total_eps) {
      // Reached the last episode of a season — only "Completed" if it's the last season
      if (item.total_seasons && nextSeason >= item.total_seasons) {
        isComplete = true;
      }
    }

    const update = {
      current_ep: nextEp,
      current_season: nextSeason,
      last_watched,
      ...(isComplete ? { status: "Completed" as const } : {}),
    };

    // Optimistic
    setItems((prev) => prev.map((i) =>
      i.id === item.id ? { ...i, ...update, status: isComplete ? "Completed" : i.status } : i
    ));

    const { error } = await supabase.from("media").update(update).eq("id", item.id);
    if (error) {
      toast.error("Failed to update");
      loadItems();
    } else if (isComplete) {
      toast.success(`Finished ${item.title}! 🎉`);
    } else if (rolledOver) {
      toast.success(`Rolled over to Season ${nextSeason} · Ep 1`);
    }
  };

  const handleSaveProgress = async (
    id: string,
    data: { current_season: number; current_ep: number; notes: string | null }
  ) => {
    const target = items.find((i) => i.id === id);
    const isComplete = !!(target?.total_eps && data.current_ep >= target.total_eps);
    const last_watched = new Date().toISOString();
    setItems((prev) => prev.map((i) =>
      i.id === id
        ? { ...i, ...data, last_watched, status: isComplete ? "Completed" : i.status }
        : i
    ));
    const { error } = await supabase
      .from("media")
      .update({ ...data, last_watched, ...(isComplete ? { status: "Completed" } : {}) })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update progress");
      loadItems();
    } else {
      toast.success("Progress updated");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("media").delete().eq("id", deleteTarget.id);
    if (error) toast.error(error.message);
    else toast.success("Removed");
    setDeleteTarget(null);
    loadItems();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <header className="border-b border-border backdrop-blur-sm bg-background/80 sticky top-0 z-10">
        <div className="container max-w-6xl flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: "var(--gradient-primary)" }}>
              <Tv className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">WatchLog</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" /> Add
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl py-8">
        <div className="mb-6 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your library..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="All">All ({counts.All})</TabsTrigger>
              {MEDIA_STATUSES.map((s) => (
                <TabsTrigger key={s} value={s}>
                  {s} ({counts[s] ?? 0})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-xl">
            <Tv className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">
              {items.length === 0 ? "Your library is empty." : "No titles match this filter."}
            </p>
            {items.length === 0 && (
              <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
                <Plus className="h-4 w-4" /> Add your first title
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                allItems={items}
                onIncrement={handleIncrement}
                onEdit={(i) => { setEditing(i); setDialogOpen(true); }}
                onEditProgress={(i) => setProgressTarget(i)}
                onDelete={(i) => setDeleteTarget(i)}
              />
            ))}
          </div>
        )}
      </main>

      <MediaDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
        item={editing}
        onSave={handleSave}
      />

      <ProgressDialog
        open={!!progressTarget}
        onOpenChange={(o) => !o && setProgressTarget(null)}
        item={progressTarget}
        onSave={handleSaveProgress}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove "{deleteTarget?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
