"use client";
//----------Dependencies----------//
import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
//----------End Dependencies----------//

//----------Types----------//
type SidebarContextType = {
  activeSubmenu: string | null;
  setActiveSubmenu: (value: string | null) => void;
  selectedMenuItem: string | null;
  setSelectedMenuItem: (value: string | null) => void;
  selectedSubMenuItem: string | null;
  setSelectedSubMenuItem: (value: string | null) => void;
};
//----------End Types----------//

// Create Context
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  //----------State----------//
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string | null>(null);
  const [selectedSubMenuItem, setSelectedSubMenuItem] = useState<string | null>(null);
  const pathname = usePathname();
  //----------End State----------//

  //----------Effects----------//
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
  //----------End Effects----------//

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


const useSidebar = () => {
  //----------State----------//
  const context = useContext(SidebarContext);
  //----------End State----------//

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }

  return context;
};

//----------Exports----------//
export {
  useSidebar, 
  SidebarProvider
};
//----------End Exports----------//

