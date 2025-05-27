type CTAButtonProps = {
    onClick: (e: React.MouseEvent) => any,
    children: React.ReactNode,
    className?: string
}

const CallToActionButton = ({onClick, className = '', children}: CTAButtonProps) => {
    const baseClasses = "bg-moss text-white hover:bg-moss-dark transition-colors font-semibold rounded";
    const classes = className ? baseClasses + ' ' + className : baseClasses;

  return (
    <button onClick={onClick} className={classes}>
        {children}
    </button>
  )
}

export default CallToActionButton