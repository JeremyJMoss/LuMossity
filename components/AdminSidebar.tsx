import Image from "next/image";
import Logo from "@/public/lumossity_logo.png";

function AdminSidebar() {
  return (
    <aside className="bg-neutral-beige flex flex-col gap-5">
        <Image src={Logo} width={100} height={100} alt="LuMossity Logo"/>
        <div className="flex flex-col gap-3">
            <button>Courses</button>
            <button>Enrolments</button>
        </div>
    </aside>
  )
}

export default AdminSidebar;