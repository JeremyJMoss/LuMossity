import "@/app/globals.css";
import AdminSidebarCollapsed from "@/components/AdminSidebarCollapsed";


export default function EntityLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AdminSidebarCollapsed/>
        {children}
    </>
  );
}
