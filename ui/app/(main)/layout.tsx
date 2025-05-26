import "@/app/globals.css";
import "@/components/AdminSidebar";
import AdminSidebar from "@/components/AdminSidebar";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AdminSidebar/>
     {children}
    </>
  );
}
