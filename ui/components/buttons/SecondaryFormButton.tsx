const SecondaryFormButton: React.FC<{buttonText: string, isSubmitting: boolean}> = ({ buttonText, isSubmitting }) => {

    return (
        <>
            { isSubmitting && 
                <button disabled className="mt-6 bg-sunlight-deep font-semibold px-6 py-2 w-50 rounded text-white transition duration-200 opacity-50 flex justify-center cursor-not-allowed">
                    <span className="flex items-center justify-center">
                        <span className="loader-dual-ring w-6 h-6" />
                    </span>
                </button>
            }
            { !isSubmitting && 
                <button className="mt-6 bg-sunlight-deep hover:bg-sunlight font-semibold px-6 py-2 rounded w-100" type="submit">{buttonText}</button>
            }
        </>
    )
}

export default SecondaryFormButton