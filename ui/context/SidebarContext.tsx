"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

type SidebarContextType = {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  activeSubmenu: string | null;
  setActiveSubmenu: (value: string | null) => void;
  selectedMenuItem: string | null;
  setSelectedMenuItem: (value: string | null) => void;
  selectedSubMenuItem: string | null;
  setSelectedSubMenuItem: (value: string | null) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsedState] = useState(false);
  const [activeSubmenu, setActiveSubmenuState] = useState<string | null>(null);
  const [selectedItem, setSelectedItemState] = useState<string | null>(null);
  const [selectedSubItem, setSelectedSubItemState] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    const storedCollapsed = localStorage.getItem("sidebarCollapsed");
    const storedSubmenu = localStorage.getItem("activeSubmenu");
    const storedItem = localStorage.getItem("selectedItem");
    const storedSubItem = localStorage.getItem("selectedSubItem");

    if (storedCollapsed !== null) setIsCollapsedState(storedCollapsed === "true");
    if (storedSubmenu) setActiveSubmenuState(storedSubmenu);
    if (storedItem) setSelectedItemState(storedItem);
    if (storedSubItem) setSelectedItemState(storedSubItem);
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem("activeSubmenu", activeSubmenu ?? "");
  }, [activeSubmenu]);

  useEffect(() => {
    localStorage.setItem("selectedItem", selectedItem ?? "");
  }, [selectedItem]);

  useEffect(() => {
    localStorage.setItem("selectedSubItem", selectedSubItem ?? "");
  }, [selectedSubItem]);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed: setIsCollapsedState,
        activeSubmenu,
        setActiveSubmenu: setActiveSubmenuState,
        selectedMenuItem: selectedItem,
        setSelectedMenuItem: setSelectedItemState,
        selectedSubMenuItem: selectedSubItem,
        setSelectedSubMenuItem: setSelectedSubItemState
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

// Hook to use sidebar context
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
};
