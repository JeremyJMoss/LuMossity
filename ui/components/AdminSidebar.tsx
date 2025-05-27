"use client";
import Image from "next/image";
import Logo from "@/public/lumossity_logo.png";
import { Anvil, Boxes, Cog } from "lucide-react";
import StudioSubmenu from "./submenus/StudioSubmenu";
import ManagerSubmenu from "./submenus/ManagerSubmenu";
import MenuLink from "./menu/MenuLink";
import SubMenuLink from "./menu/SubMenuLink";
import { useSidebar } from "@/context/SidebarContext";

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

function AdminSidebar() {
  const {isCollapsed, setIsCollapsed, setActiveSubmenu, activeSubmenu, setSelectedMenuItem, selectedMenuItem} = useSidebar();

  const imageSize = isCollapsed ? 40 : 60;
  const sidebarBackground = isCollapsed ? 'bg-neutral-clay' : 'bg-neutral-beige';

  const handleBtnClick = (e: React.MouseEvent, submenu: string | null, menuItem : string) => {
    e.preventDefault();
    setSelectedMenuItem(menuItem);
    setIsCollapsed(true);
    setActiveSubmenu(submenu);
  };

  return (
    <>
      <aside className={`${sidebarBackground} flex flex-col items-center gap-6 px-3 py-5`}>
          <MenuLink 
            href="/"
            menuItem="">
            <Image src={Logo} width={imageSize} height={imageSize} alt="LuMossity Logo"/>
          </MenuLink>
          <div className="flex flex-col h-full">
              <div className="flex flex-col gap-3">
                {!isCollapsed && <h2 className="text-md font-semibold">Control Panel</h2>}
                <div className="flex flex-col text-sm gap-3">
                  {sidebarLinks.map(({label, href, menuItem, icon: Icon, hasSubmenu, submenu}) => {
                    return (
                      !hasSubmenu ? href &&
                      <MenuLink 
                        href={href} 
                        key={label} 
                        className="flex gap-2 items-center whitespace-nowrap"
                        menuItem={menuItem}>
                        <Icon strokeWidth={2}/>
                        {!isCollapsed && <span>{label}</span>}
                      </MenuLink> :
                      <SubMenuLink
                        label={label}
                        key={label}
                        onClick={e => handleBtnClick(e, submenu, menuItem)}
                        className="flex gap-2 items-center whitespace-nowrap"
                        icon={Icon}
                        menuItem={menuItem}/>
                  )
                  })}
                </div>
              </div>
          </div>
      </aside>
      {activeSubmenu &&
        <aside className="bg-neutral-beige border-solid border-x border-gray-300 flex flex-col items-center py-5 px-5">
          {submenuMap[activeSubmenu]}
        </aside>
      }
    </>
  )
}

export default AdminSidebar;