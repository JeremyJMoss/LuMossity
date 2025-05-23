import "@/app/globals.css";
import { AuthProvider } from "@/context/providers/AuthProvider";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased flex min-h-screen">
        <AuthProvider>
            {children}
        </AuthProvider>
      </body>
    </html>
  );
}