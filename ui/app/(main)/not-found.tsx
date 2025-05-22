import ButtonLink from "@/components/buttons/ButtonLink"
 
export default function NotFound() {
  return (
    <div className='max-w-xl mx-auto flex flex-col items-center p-6 gap-4'>
      <h1 className='text-4xl text-moss-dark font-bold'>Not Found</h1>
      <p className="text-xl text-moss">Could not find requested resource</p>
      <ButtonLink 
        href="/"
        buttonText="Return Home"
        className="mt-4"/>
    </div>
  )
}