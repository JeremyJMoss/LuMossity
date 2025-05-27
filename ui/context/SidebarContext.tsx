"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type SidebarContextType = {
  activeSubmenu: string | null;
  setActiveSubmenu: (value: string | null) => void;
  selectedMenuItem: string | null;
  setSelectedMenuItem: (value: string | null) => void;
  selectedSubMenuItem: string | null;
  setSelectedSubMenuItem: (value: string | null) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string | null>(null);
  const [selectedSubMenuItem, setSelectedSubMenuItem] = useState<string | null>(null);

  const pathname = usePathname();

  // Update sidebar state based on pathname
  useEffect(() => {
    if (pathname.includes('/entity-manager')) {
      setActiveSubmenu('manager');
      setSelectedMenuItem('entity-manager');
    } else if (pathname.includes('/entity-studio')) {
      setActiveSubmenu('studio');
      setSelectedMenuItem('entity-studio');
    } else if (pathname.includes('/settings')) {
      setActiveSubmenu(null);
      setSelectedMenuItem('settings');
    } else {
      setActiveSubmenu(null);
      setSelectedMenuItem(null);
    }
  }, [pathname]);

  // Persist state to localStorage (optional)
  useEffect(() => {
    localStorage.setItem("activeSubmenu", activeSubmenu ?? "");
    localStorage.setItem("selectedMenuItem", selectedMenuItem ?? "");
    localStorage.setItem("selectedSubMenuItem", selectedSubMenuItem ?? "");
  }, [activeSubmenu, selectedMenuItem, selectedSubMenuItem]);

  return (
    <SidebarContext.Provider
      value={{
        activeSubmenu,
        setActiveSubmenu,
        selectedMenuItem,
        setSelectedMenuItem,
        selectedSubMenuItem,
        setSelectedSubMenuItem
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};
