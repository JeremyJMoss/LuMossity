import Image from "next/image";
import Logo from "@/public/lumossity_logo.png";
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
    <aside className="bg-neutral-beige flex flex-col gap-5 px-5">
        <Image src={Logo} width={100} height={100} alt="LuMossity Logo"/>
        <div className="flex flex-col justify-between h-full">
          <div className="flex flex-col gap-3">
            {/* Render the entities */}
            {entities && entities.length > 0 ? (
              Object.keys(entities).map((key) => (
                <button key={key}>{key}</button>
              ))
            ) : (
              <p>No entities found.</p>
            )}
            <button>Courses</button>
            <button>Enrolments</button>
          </div>
        </div>
    </aside>
  )
}

export default AdminSidebar;