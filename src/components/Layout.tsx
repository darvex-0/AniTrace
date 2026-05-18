import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen" style={{ background: "hsl(240 10% 3.9%)" }}>
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 min-w-0 pb-20 lg:pb-0 overflow-x-hidden">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
};
