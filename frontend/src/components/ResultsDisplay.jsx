import './ResultsDisplay.css'

const ResultsDisplay = ({ results, query, fileName, onReset }) => {
  const formatResults = (data) => {
    if (data && typeof data === 'object' && data.error) {
      return `Error: ${data.error}`
    }

    if (typeof data === 'string') {
      return data
    }
    
    if (typeof data === 'object') {
      // Handle different response formats
      if (data.answer) {
        return data.answer
      }
      if (data.response) {
        return data.response
      }
      if (data.result) {
        return data.result
      }
      if (data.text) {
        return data.text
      }
      // If it's an object, try to stringify it nicely
      return JSON.stringify(data, null, 2)
    }
    
    return String(data)
  }

  const formattedResults = formatResults(results)

  return (
    <div className="results-section">
      <div className="results-header">
        <div className="results-title-section">
          <h2 className="results-title">Analysis Results</h2>
          <div className="results-meta">
            <span className="meta-item">
              <span className="meta-label">Document:</span>
              <span className="meta-value">{fileName}</span>
            </span>
            <span className="meta-item">
              <span className="meta-label">Query:</span>
              <span className="meta-value">{query}</span>
            </span>
          </div>
        </div>
        <button className="reset-button" onClick={onReset} type="button">
          <span className="reset-icon">↻</span>
          New Analysis
        </button>
      </div>

      <div className="results-content">
        <div className="results-text">
          {formattedResults.split('\n').map((line, index) => (
            <p key={index} className="results-paragraph">
              {line || '\u00A0'}
            </p>
          ))}
        </div>
      </div>

      <div className="results-footer">
        <div className="results-info">
          <span className="info-icon">ℹ️</span>
          <span>This analysis was powered by AI using semantic search and LLM reasoning</span>
        </div>
      </div>
    </div>
  )
}

export default ResultsDisplay




