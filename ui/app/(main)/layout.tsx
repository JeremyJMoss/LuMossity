//----------Dependencies----------//
import "@/app/globals.css";
import "@/components/AdminSidebar";
import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";
//----------End Dependencies----------//

//----------Types----------//
type LayoutProps = {
  children: React.ReactNode
}
//----------End Types----------//

const Layout = ({children}: Readonly<LayoutProps>) => {
  return (
    <>
      <AdminSidebar/>
      <main className="bg-sunlight-soft w-full">
        <AdminTopbar/>
        {children}
      </main>
    </>
  );
}

//----------Exports----------//
export default Layout
//----------End Exports----------//

