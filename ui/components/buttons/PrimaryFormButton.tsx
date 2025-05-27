type PrimaryFormButtonProps = {
    children: React.ReactNode;
    isSubmitting: boolean;
    className?: string;
}

const PrimaryFormButton = ({children, isSubmitting, className = ''} : PrimaryFormButtonProps) => {

    let classes = "bg-moss font-semibold rounded text-white" + (className ? ' ' + className : '');

  return (
    <>
        { isSubmitting && 
            <button disabled className={`${classes} transition duration-200 opacity-50 flex justify-center cursor-not-allowed`}>
                <span className="flex items-center justify-center">
                    <span className="loader-dual-ring w-6 h-6" />
                </span>
            </button>
        }
        { !isSubmitting && 
            <button className={`${classes} transition-colors`} type="submit">{children}</button>
        }
    </>
  )
}

export default PrimaryFormButton