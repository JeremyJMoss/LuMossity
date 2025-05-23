import "@/app/globals.css";
import "@/components/AdminSidebar";
import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased flex min-h-screen">
        <AdminSidebar/>
        <main className="bg-sunlight-soft w-full">
          <AdminTopbar/>
          {children}
        </main>
      </body>
    </html>
  );
}
