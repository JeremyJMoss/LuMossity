"use client";
import Image from "next/image";
import Logo from "@/public/lumossity_logo.png";
import Link from "next/link";
import { Anvil, Boxes, Cog } from "lucide-react";
import { useState } from "react";
import StudioSubmenu from "./submenus/studioSubmenu";
import ManagerSubmenu from "./submenus/ManagerSubmenu";

const sidebarLinks = [
  {
    label: "Entity Manager",
    href: null,
    icon: Boxes,
    hasSubmenu: true,
    renderSubmenu: () => <ManagerSubmenu/> 
  },
  {
    label: "Entity Studio",
    href: null,
    icon: Anvil,
    hasSubmenu: true,
    renderSubmenu: () => <StudioSubmenu/>
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Cog,
    hasSubmenu: false,
    renderSubmenu: null
  },
];

function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [renderActiveMenu, setRenderActiveMenu] = useState<(() => React.ReactNode) | null>(null);

  const imageSize = isCollapsed ? 40 : 60;
  const sidebarBackground = isCollapsed ? 'bg-neutral-clay' : 'bg-neutral-beige';

  const handleBtnClick = (e: React.MouseEvent, submenuRenderFunc: (() => React.ReactNode) | null) => {
    e.preventDefault();
    setIsCollapsed(prev => !prev);
    setRenderActiveMenu(submenuRenderFunc);
  };

  return (
    <>
      <aside className={`${sidebarBackground} flex flex-col items-center gap-6 px-3 py-5`}>
          <Link href="/">
            <Image src={Logo} width={imageSize} height={imageSize} alt="LuMossity Logo"/>
          </Link>
          <div className="flex flex-col h-full">
              <div className="flex flex-col gap-3">
                {!isCollapsed && <h2 className="text-md font-semibold">Control Panel</h2>}
                <div className="flex flex-col text-sm gap-3">
                  {sidebarLinks.map(({label, href, icon: Icon, hasSubmenu, renderSubmenu}) => {
                    return (
                      !hasSubmenu && href ?
                      <Link href={href} key={label} className="flex gap-2 items-center whitespace-nowrap">
                        <Icon strokeWidth={2}/>
                        {!isCollapsed && <span>{label}</span>}
                      </Link> :
                      <button key={label} onClick={e => handleBtnClick(e, renderSubmenu)} className="flex gap-2 items-center whitespace-nowrap">
                        <Icon strokeWidth={2}/>
                        {!isCollapsed && <span>{label}</span>}
                      </button>
                  )
                  })}
                </div>
              </div>
          </div>
      </aside>
      {renderActiveMenu && 
        <aside className="border-solid border-x border-gray-300 flex flex-col items-center py-5">
          {renderActiveMenu()}
        </aside>
      }
    </>
  )
}

export default AdminSidebar;