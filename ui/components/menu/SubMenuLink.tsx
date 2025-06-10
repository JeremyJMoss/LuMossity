"use client";
//----------Dependencies----------//
import type { LucideIcon } from "lucide-react"
import { useSidebar } from "@/state_management/SidebarContext"
//----------End Dependencies----------//

//----------Types----------//
type SubMenuLinkProps = {
    label: string;
    onClick: (e: React.MouseEvent) => any;
    icon: LucideIcon;
    className?: string;
    menuItem: string;
}
//----------End Types----------//

const SubMenuLink = ({label, onClick, className = '', icon: Icon, menuItem}: SubMenuLinkProps) => {
    //----------State----------//
    const {selectedMenuItem} = useSidebar();
    //----------End State----------//

    //----------Derived State----------//
    let classNames = className;
    classNames += 
        menuItem === selectedMenuItem 
        ? ' bg-moss-light rounded' 
        : ' hover:bg-moss-light/25 rounded';
    //----------End Derived State----------//

    return (
        <button onClick={onClick} className={classNames}>
            <Icon strokeWidth={2}/>
            <span>{label}</span>
        </button>
    )
}

//----------Exports----------//
export default SubMenuLink
//----------End Exports----------//