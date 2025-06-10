//----------Types----------//
type LoadingSpinnerProps = {
    width: string,
    height: string
}
//----------End Types----------//

function LoadingSpinner( {width, height}: LoadingSpinnerProps) {
  return (
    <div className="spinner-container">
      <div className="spinner" style={{width, height}}/>
    </div>
  );
}

//----------Exports----------//
export default LoadingSpinner
//----------End Exports----------//