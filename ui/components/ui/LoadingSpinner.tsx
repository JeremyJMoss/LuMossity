type LoadingSpinnerProps = {
    width: string,
    height: string
}

export default function LoadingSpinner( {width, height}: LoadingSpinnerProps) {
    return (
      <div className="spinner-container">
        <div className="spinner" style={{width, height}}/>
      </div>
    );
  }