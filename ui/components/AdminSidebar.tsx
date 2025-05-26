import Image from "next/image";
import Logo from "@/public/lumossity_logo.png";
import Link from "next/link";
import { Blend, Boxes, Cog } from "lucide-react";

function AdminSidebar() {

  return (
    <aside className="bg-neutral-beige flex flex-col items-center gap-3 px-3 min-w-50">
        <Link href="/">
          <Image src={Logo} width={120} height={120} alt="LuMossity Logo"/>
        </Link>
        <div className="flex flex-col h-full">
            <div className="flex flex-col gap-3">
              <h2 className="text-md font-semibold">Control Panel</h2>
              <div className="flex flex-col text-sm gap-3">
                <Link href="/entity-manager" className="flex gap-2 items-center">
                  <Blend strokeWidth={2}/>
                  <span>Entity Manager</span>
                </Link>
                <Link href="/entity-studio" className="flex gap-2 items-center">
                  <Boxes strokeWidth={2}/>
                  <span>Entity Studio</span>
                </Link>
                <Link href="/settings" className="flex gap-2 items-center">
                  <Cog strokeWidth={2}/>
                  <span>Settings</span>
                 </Link>
              </div>
            </div>
        </div>
    </aside>
  )
}

export default AdminSidebar;