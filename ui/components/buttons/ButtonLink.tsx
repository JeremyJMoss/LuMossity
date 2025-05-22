import Link from "next/link"

interface Props {
    href: string,
    buttonText: string,
    className: string
}

const ButtonLink = ({ href, buttonText, className } : Props) => {
    let classes = 'bg-sunlight-deep hover:bg-sunlight font-semibold px-6 py-2 rounded ';
    classes += className ? className : '';
  
    return (
        <Link 
            href={href}
            className={classes}>
        {buttonText}
        </Link>
    )
}

export default ButtonLink