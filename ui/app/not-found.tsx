//----------Dependencies----------//
import ButtonLink from "@/components/buttons/ButtonLink"
//----------End Dependencies----------//

const NotFound = () => {
  return (
    <main className="bg-sunlight-soft w-full">
      <div className='max-w-xl mx-auto flex flex-col items-center p-6 gap-4 justify-center h-full'>
        <h1 className='text-4xl text-moss-dark font-bold'>404 Not Found</h1>
        <p className="text-xl text-moss">Could not find requested resource</p>
        <ButtonLink 
          href="/"
          buttonText="Return Home"
          className="mt-4"/>
      </div>
    </main>
  )
}

//----------Exports----------//
export default NotFound
//----------End Exportss----------//