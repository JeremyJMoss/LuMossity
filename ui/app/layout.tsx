import "@/app/globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
        <body className="antialiased flex min-h-screen">
            {children}
        </body>
    </html>
  );
}
