import { useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, Compass, User as UserIcon, LogOut, Tv } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home, path: "/" },
  { id: "library", label: "My List", icon: BookOpen, path: "/library" },
  { id: "discover", label: "Discover", icon: Compass, path: "/discover" },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const initials = user?.displayName?.trim()
    ? user.displayName.trim().split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 glass-panel border-r border-border/50 z-20 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-border/40">
        <div
          className="p-2 rounded-xl glow-fuchsia shadow-lg"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Tv className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-xl font-black tracking-tight gradient-text">AniTrace</span>
          <p className="text-[10px] text-muted-foreground -mt-0.5">Your watch companion</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon, path }) => {
          const isActive = location.pathname === path ||
            (path === "/" && location.pathname === "/");
          return (
            <button
              key={id}
              onClick={() => navigate(path)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left group
                ${isActive
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent"
                }`}
            >
              <Icon
                className={`h-4.5 w-4.5 shrink-0 transition-all ${
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                }`}
                style={{ width: "18px", height: "18px" }}
              />
              {label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-sm" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Decorative glow */}
      <div
        className="glow-blob-fuchsia"
        style={{ width: 200, height: 200, bottom: 80, left: -50, opacity: 0.15 }}
      />

      {/* User section */}
      <div className="px-3 pb-4 border-t border-border/40 pt-3 space-y-1">
        <button
          onClick={() => navigate("/profile")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200"
        >
          <UserIcon className="h-4 w-4 shrink-0" />
          Profile
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
        {/* User info */}
        <div className="flex items-center gap-3 px-4 py-3 mt-1 rounded-xl bg-muted/20 border border-border/30">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "User"} />
            <AvatarFallback className="text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              {user?.displayName || "Anime Fan"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
