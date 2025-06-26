import { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import TopNavBar from "./top-navbar";
import { useMobile } from "@/hooks/use-mobile";

type LayoutProps = {
  children: React.ReactNode;
};

export function Layout({ children }: LayoutProps) {
  const isMobile = useMobile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close sidebar when switching from mobile to desktop view
  useEffect(() => {
    if (!isMobile && isMobileOpen) {
      setIsMobileOpen(false);
    }
  }, [isMobile, isMobileOpen]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavBar setIsMobileOpen={setIsMobileOpen} />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
