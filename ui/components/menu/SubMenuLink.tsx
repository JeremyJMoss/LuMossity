import type { LucideIcon } from "lucide-react"
import { useSidebar } from "@/state_management/SidebarContext"

type SubMenuLinkProps = {
    label: string;
    onClick: (e: React.MouseEvent) => any;
    icon: LucideIcon;
    className?: string;
    menuItem: string;
}

const SubMenuLink = ({label, onClick, className = '', icon: Icon, menuItem}: SubMenuLinkProps) => {
    const {selectedMenuItem} = useSidebar();

    const classNames = menuItem === selectedMenuItem ? className + ' ' + 'bg-moss-light rounded' : className;

    return (
        <button onClick={onClick} className={classNames}>
            <Icon strokeWidth={2}/>
            <span>{label}</span>
        </button>
    )
}

export default SubMenuLink