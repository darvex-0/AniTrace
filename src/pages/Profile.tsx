import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Save, User as UserIcon, Camera, ShieldCheck, Sparkles } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [submitting, setSubmitting] = useState(false);

  // Gemini API Key state
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
  const [savingKey, setSavingKey] = useState(false);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey(true);
    try {
      const trimmed = geminiKey.trim();
      if (trimmed) {
        localStorage.setItem("gemini_api_key", trimmed);
        toast.success("Gemini API key saved! AI suggestions enabled. ✨");
      } else {
        localStorage.removeItem("gemini_api_key");
        toast.success("Gemini API key cleared. Using TMDB fallback.");
      }
    } catch {
      toast.error("Failed to save API key");
    } finally {
      setSavingKey(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhotoURL(user.photoURL || "");
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateProfile(user, {
        displayName: displayName.trim(),
        photoURL: photoURL.trim() || null,
      });
      toast.success("Profile updated!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="min-h-screen relative">
      <div className="glow-blob-fuchsia" style={{ width: 400, height: 400, top: -100, right: -50, opacity: 0.07 }} />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/40 glass-panel-heavy">
        <div className="px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl glass-panel border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-xl font-bold">Profile</h1>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-8 space-y-6">
        {/* Avatar card */}
        <div className="glass-card rounded-2xl p-6 border border-border/40 flex items-center gap-5">
          <Avatar className="h-20 w-20 border-2 border-primary/30 shadow-lg">
            <AvatarImage src={photoURL || ""} alt={displayName} />
            <AvatarFallback
              className="text-2xl font-black"
              style={{ background: "var(--gradient-primary)", color: "white" }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">{displayName || "Anime Fan"}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs text-primary mt-1">Member since {new Date(user.metadata.creationTime || "").getFullYear()}</p>
          </div>
        </div>

        {/* Edit form */}
        <div className="glass-card rounded-2xl border border-border/40 overflow-hidden">
          <div className="px-6 py-4 border-b border-border/30">
            <h3 className="font-semibold text-sm">Edit Profile</h3>
          </div>
          <form onSubmit={handleUpdate} className="px-6 py-5 space-y-5">
            {/* Email (read-only) */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={user.email || ""}
                disabled
                className="w-full px-4 py-3 rounded-xl bg-muted/20 border border-border/40 text-sm text-muted-foreground cursor-not-allowed"
              />
              <p className="text-[10px] text-muted-foreground">Email cannot be changed.</p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Display Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/30 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                  required
                />
              </div>
            </div>

            {/* Avatar URL */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Avatar URL
              </label>
              <div className="relative">
                <Camera className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="url"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/30 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-border/40 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 glow-fuchsia"
                style={{ background: "var(--gradient-primary)" }}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* AI Settings card */}
        <div className="glass-card rounded-2xl border border-border/40 overflow-hidden">
          <div className="px-6 py-4 border-b border-border/30 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <h3 className="font-semibold text-sm">AI Autocomplete Settings</h3>
          </div>
          <form onSubmit={handleSaveKey} className="px-6 py-5 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Gemini API Key
              </label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
              />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Add your Gemini API Key to enable rich auto-suggestions that automatically estimate total seasons, episodes, and notes for you. If empty, the app falls back to basic TMDB searches.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={savingKey}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 glow-fuchsia"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Save className="h-3.5 w-3.5" />
                Save Key
              </button>
              {geminiKey && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("gemini_api_key");
                    setGeminiKey("");
                    toast.success("Gemini API key cleared.");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                >
                  Clear Key
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Security card */}
        <div className="glass-card rounded-2xl border border-destructive/15 overflow-hidden">
          <div className="px-6 py-4 border-b border-border/30 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-destructive" />
            <h3 className="font-semibold text-sm text-destructive">Account Security</h3>
          </div>
          <div className="px-6 py-5">
            <button className="w-full text-left px-4 py-3 rounded-xl text-sm text-destructive/80 hover:bg-destructive/10 hover:text-destructive border border-destructive/20 transition-all">
              Reset Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
