import Image from "next/image";
import Logo from "@/public/lumossity_logo.png";
import { INTERNAL_API_URL } from "@/constants/constants";

interface Entities {
  
}

async function fetchEntities(entity: string): Promise<Entities | null> {
  const res = await fetch(`${INTERNAL_API_URL}/entities/${entity}`, {
    cache: 'no-store',
  });

  if (!res.ok) return null;
  return res.json();
}

async function AdminSidebar() {
  return (
    <aside className="bg-neutral-beige flex flex-col gap-5 px-5">
        <Image src={Logo} width={100} height={100} alt="LuMossity Logo"/>
        <div className="flex flex-col justify-between h-full">
          <div className="flex flex-col gap-3">
            <button>Courses</button>
            <button>Enrolments</button>
          </div>
        </div>
    </aside>
  )
}

export default AdminSidebar;