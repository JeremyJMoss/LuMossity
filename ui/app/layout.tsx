import "@/app/globals.css";
import { SidebarProvider } from "@/context/SidebarContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
