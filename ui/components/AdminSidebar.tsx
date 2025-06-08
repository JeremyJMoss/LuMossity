"use client";
//----------Dependencies----------//
import Image from "next/image";
import Logo from "@/public/lumossity_logo.png";
import { Anvil, Boxes, Cog } from "lucide-react";
import StudioSubmenu from "./submenus/StudioSubmenu";
import ManagerSubmenu from "./submenus/ManagerSubmenu";
import MenuLink from "./menu/MenuLink";
import SubMenuLink from "./menu/SubMenuLink";
import { useSidebar } from "@/state_management/SidebarContext";
import { useCallback } from "react";
//----------End Dependencies----------//

//----------Constants----------//
const submenuMap: Record<string, React.ReactNode> = {
  "manager": <ManagerSubmenu />,
  "studio": <StudioSubmenu />
};

const sidebarLinks = [
  {
    label: "Entity Manager",
    menuItem: "entity-manager",
    href: null,
    icon: Boxes,
    hasSubmenu: true,
    submenu: "manager" 
  },
  {
    label: "Entity Studio",
    menuItem: "entity-studio",
    href: null,
    icon: Anvil,
    hasSubmenu: true,
    submenu: "studio"
  },
  {
    label: "Settings",
    menuItem: "settings",
    href: "/settings",
    icon: Cog,
    hasSubmenu: false,
    submenu: null
  },
];

const imageSize = 60;
//----------End Constants----------//

function AdminSidebar() {
  //----------State----------//
  const {setActiveSubmenu, activeSubmenu, setSelectedMenuItem} = useSidebar();
  //----------End State----------//

  //----------Handlers----------//
  const handleBtnClick = useCallback((e: React.MouseEvent, submenu: string | null, menuItem : string) => {
    e.preventDefault();
    setSelectedMenuItem(menuItem);
    setActiveSubmenu(submenu);
  }, [setSelectedMenuItem, setActiveSubmenu]);
  //----------End Handlers----------//

  return (
    <>
      <aside aria-label="Main Menu" className={`bg-neutral-clay flex flex-col items-center gap-6 px-3 py-5`}>
          <MenuLink 
            href="/"
            menuItem=""
          >
            <Image 
              src={Logo} 
              width={imageSize} 
              height={imageSize} 
              alt="LuMossity Logo"
            />
          </MenuLink>
          <div className="flex flex-col h-full">
              <div className="flex flex-col gap-3">
                <h2 className="text-md font-semibold">Control Panel</h2>
                <div className="flex flex-col text-sm gap-3">
                  {sidebarLinks.map(({ label, href, ...rest }) => {
                    if (!rest.hasSubmenu && !href) return null;
                    return rest.hasSubmenu ? (
                      <SubMenuLink
                        key={rest.menuItem}
                        label={label}
                        onClick={(e) => handleBtnClick(e, rest.submenu, rest.menuItem)}
                        className="flex gap-2 items-center whitespace-nowrap p-1"
                        icon={rest.icon}
                        menuItem={rest.menuItem}
                      />
                    ) : (
                      <MenuLink
                        href={href!}
                        key={rest.menuItem}
                        className="flex gap-2 items-center whitespace-nowrap p-1"
                        menuItem={rest.menuItem}
                      >
                        <rest.icon strokeWidth={2} />
                        <span>{label}</span>
                      </MenuLink>
                    );
                  })}
                </div>
              </div>
          </div>
      </aside>
      {activeSubmenu &&
        <aside aria-label="Submenu" className="bg-neutral-beige border-solid border-x border-gray-300 flex flex-col items-center py-5 px-5">
          {submenuMap[activeSubmenu]}
        </aside>
      }
    </>
  )
}

export default AdminSidebar;