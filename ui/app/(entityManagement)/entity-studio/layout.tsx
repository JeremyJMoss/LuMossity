import "@/app/globals.css";
import AdminTopbar from "@/components/AdminTopbar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <main className="bg-sunlight-soft w-full">
        <AdminTopbar/>
        {children}
      </main>
    </>
  );
}
