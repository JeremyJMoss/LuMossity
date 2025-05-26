export default function InitLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
  return (
    <>
        <main className="bg-sunlight-soft w-full">
            {children}
        </main>
    </>
  )
}