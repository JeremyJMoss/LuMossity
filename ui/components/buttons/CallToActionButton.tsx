type CTAButtonProps = {
    onClick: (e: React.MouseEvent) => any,
    children: React.ReactNode,
    className?: string
}

const CallToActionButton = ({onClick, className = '', children}: CTAButtonProps) => {
    const baseClasses = "bg-sunlight-deep hover:bg-sunlight font-semibold rounded";
    const classes = className ? baseClasses + ' ' + className : baseClasses;

  return (
    <button onClick={onClick} className={classes}>
        {children}
    </button>
  )
}

export default CallToActionButton