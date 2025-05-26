import Image from "next/image";
import Logo from "@/public/lumossity_logo.png";
import Link from "next/link";
import { Boxes, Cog, Blend } from "lucide-react";

function AdminSidebarCollapsed() {

  return (
    <aside className="bg-neutral-beige flex flex-col items-center gap-3 px-3">
        <Link href="/">
            <Image src={Logo} width={60} height={60} alt="LuMossity Logo"/>
        </Link>
        <div className="flex flex-col h-full">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col text-sm gap-3">
                <Link href="/entity-manager">
                    <Blend strokeWidth={2}/>
                </Link>
                <Link href="/entity-studio">
                    <Boxes strokeWidth={2}/>
                </Link>
                <Link href="/settings">
                    <Cog strokeWidth={2}/>
                 </Link>
              </div>
            </div>
        </div>
    </aside>
  )
}

export default AdminSidebarCollapsed;