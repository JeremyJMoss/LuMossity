import "@/app/globals.css";

export default function InitLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <html lang="en">
        <body
          className="antialiased flex min-h-screen"
        >
          <main className="bg-sunlight-soft w-full">
            <div className="max-w-xxl mx-auto text-center p-10">
                <h1 className="text-5xl font-bold text-moss-dark">Welcome to LuMossity</h1>
                <p className="mt-4 text-olive">
                  Headless by Design, Rooted in Growth. 🌱
                </p>
            </div>
            {children}
          </main>
        </body>
      </html>
    );
  }