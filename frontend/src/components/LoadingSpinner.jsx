import './LoadingSpinner.css'

const LoadingSpinner = () => {
  return (
    <div className="spinner-container" aria-hidden="true">
      <div className="spinner">
        <div className="spinner-ring" />
      </div>
    </div>
  )
}

export default LoadingSpinner




