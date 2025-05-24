import { cookies } from "next/headers";
import Image from "next/image";
import Logo from "@/public/lumossity_logo.png";
import Link from "next/link";
import { INTERNAL_API_URL } from "@/constants/constants";

interface Entity {
  fields: [Object],
  entity: Object
}

type Entities = Entity[];

async function fetchEntities(): Promise<Entities | null> {
  const res = await fetch(`${INTERNAL_API_URL}/entities/all`, {
    cache: 'no-store',
    credentials: 'include'
  });

  if (!res.ok) return null;
  const body = await res.json();

  return body.entities;
}

async function AdminSidebar() {
  const entities = await fetchEntities();

  return (
    <aside className="bg-neutral-beige flex flex-col items-center gap-3 px-5 min-w-50">
        <Image src={Logo} width={120} height={120} alt="LuMossity Logo"/>
        <div className="flex flex-col h-full">
            {/* Render the entities */}
            {entities && entities.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="text-md font-semi-bold">Entity Types</h2>
                <div>
                  {Object.keys(entities).map((key) => (
                    <button key={key}>{key}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <h2 className="text-md font-semibold">Control Panel</h2>
              <div className="flex flex-col text-sm gap-3">
                <Link href="/entity-management">Entity Management</Link>
                <Link href="/settings">Settings</Link>
              </div>
            </div>
        </div>
    </aside>
  )
}

export default AdminSidebar;