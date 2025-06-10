"use client";
//----------Dependencies----------//
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSidebar } from "@/state_management/SidebarContext";
import { useCallback } from "react";
//----------End Dependencies----------//

//----------Types----------//
type LinkProps = {
    children: React.ReactNode,
    href: string,
    className?: string,
    menuItem: string
}
//----------End Types----------//

const MenuLink = ({children, href, className = '', menuItem}: LinkProps) => {
    //----------State----------//
    const {setSelectedMenuItem, setActiveSubmenu, selectedMenuItem} = useSidebar();
    const router = useRouter();
    //----------End State----------//

    //----------Derived State----------//
    let classNames = className;

    if (menuItem !== '') {
        classNames += 
            menuItem === selectedMenuItem 
            ? ' bg-moss-light rounded' 
            : ' hover:bg-moss-light/25 rounded';
    }
    //----------End Derived State----------//

    //----------Handlers----------//
    const handleLinkClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setSelectedMenuItem(menuItem);
        setActiveSubmenu(null);
        router.push(href);
    }, [router, setSelectedMenuItem, setActiveSubmenu, href, menuItem]);
    //----------End Handlers----------//

    return (
        <Link href={href} className={classNames} onClick={handleLinkClick}>
            {children}
        </Link>
    )
}

//----------Exports----------//
export default MenuLink;
//----------End Exports----------//