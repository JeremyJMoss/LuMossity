//----------Dependencies----------//
import "@/app/globals.css";
import { SidebarProvider } from "@/state_management/SidebarContext";
//----------End Dependencies----------//

//----------Types----------//
type LayoutProps =  {
  children: React.ReactNode
}
//----------End Types----------//

const Layout = ({children}: Readonly<LayoutProps>) => {
  return (
    <html lang="en">
        <body className="antialiased flex min-h-screen">
            <SidebarProvider>
              {children}
            </SidebarProvider>
        </body>
    </html>
  );
}

//----------Exports----------//
export default Layout
//----------End Exports----------//