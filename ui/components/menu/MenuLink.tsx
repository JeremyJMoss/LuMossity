"use client";

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSidebar } from "@/state_management/SidebarContext";

type LinkProps = {
    children: React.ReactNode,
    href: string,
    className?: string,
    menuItem: string
}

const MenuLink = ({children, href, className = '', menuItem}: LinkProps) => {
    const router = useRouter();
    const {setSelectedMenuItem, setActiveSubmenu, selectedMenuItem} = useSidebar();

    const handleClick = (e: React.MouseEvent, href: string, menuItem: string) => {
        e.preventDefault;
        setSelectedMenuItem(menuItem);
        setActiveSubmenu(null);
        router.push(href);
    }

    const classNames = menuItem !== '' && menuItem === selectedMenuItem ? className + ' ' + 'bg-moss-light' : className;

    return (
        <Link href={href} className={classNames} onClick={(e) => handleClick(e, href, menuItem)}>{children}</Link>
    )
}

export default MenuLink;