type CTAButtonProps = {
    onClick: (e: React.MouseEvent) => any,
    children: React.ReactNode,
    className?: string,
    type?: 'primary' | 'secondary',
    isDisabled?: boolean
}

const CallToActionButton = ({onClick, className = '', children, type='primary', isDisabled = false}: CTAButtonProps) => {
    const baseClasses = 
      "transition-colors font-semibold rounded " + 
      (type === 'primary' ? 'text-white bg-moss hover:bg-moss-dark' : 'text-black bg-neutral-clay hover:bg-sunlight');
    
    const classes = className ? baseClasses + ' ' + className : baseClasses;

  return (
    <button onClick={onClick} className={classes} disabled={isDisabled}>
        {children}
    </button>
  )
}

export default CallToActionButton