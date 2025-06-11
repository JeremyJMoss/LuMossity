//----------Dependencies----------//
import "@/app/globals.css";
//----------End Dependencies----------//

//----------Types----------//
type LayoutProps = {
  children: React.ReactNode
}
//----------End Types----------//

const Layout = ({children}: Readonly<LayoutProps>) => {
    return (
      <main className="bg-sunlight-soft w-full">
        <div className="max-w-xxl mx-auto text-center p-10">
            <h1 className="text-5xl font-bold text-moss-dark">Welcome to LuMossity</h1>
            <p className="mt-4 text-olive">
              Headless by Design, Rooted in Growth. 🌱
            </p>
        </div>
        {children}
      </main>
    );
}

//----------Exports----------//
export default Layout
//----------End Exports----------//