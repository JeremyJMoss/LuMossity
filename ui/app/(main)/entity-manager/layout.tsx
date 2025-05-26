"use client";
import "@/app/globals.css";
import AdminTopbar from "@/components/AdminTopbar";
import EntitySidebar from "@/components/EntitySidebar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <EntitySidebar/>
      <main className="bg-sunlight-soft w-full">
        <AdminTopbar/>
        {children}
      </main>
    </>
  );
}
