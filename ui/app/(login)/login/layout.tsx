//----------Types----------//
type LayoutProps = {
  children: React.ReactNode
}
//----------End Types----------//

const InitLayout = ({children}: Readonly<LayoutProps>) => {
  return (
    <>
        <main className="bg-sunlight-soft w-full">
            {children}
        </main>
    </>
  )
}

//----------Exports----------//
export default InitLayout
//----------End Exports----------//