import { useState } from 'react'
import './QueryInput.css'

const QueryInput = ({ value, onChange, onAnalyze, disabled }) => {
  const [isFocused, setIsFocused] = useState(false)

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.shiftKey === false && !disabled) {
      e.preventDefault()
      onAnalyze()
    }
  }

  const exampleQueries = [
    "What is the main topic of this document?",
    "Summarize the key points",
    "What are the important dates mentioned?",
    "Explain the main concepts"
  ]

  return (
    <div className="query-section">
      <label className="query-label">Your Question</label>
      <div className="query-input-wrapper">
        <textarea
          className="query-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="e.g. What is the main topic? Summarize the key points."
          disabled={disabled}
          rows={4}
        />
        <div className="query-actions">
          <div className="query-hint">
            Press <kbd>Enter</kbd> to analyze, <kbd>Shift + Enter</kbd> for new line
          </div>
          <button
            className="analyze-button"
            onClick={onAnalyze}
            disabled={disabled || !value.trim()}
            type="button"
          >
            {disabled ? (
              <>
                <span className="button-spinner"></span>
                Analyzing...
              </>
            ) : (
              'Analyze'
            )}
          </button>
        </div>
      </div>
      
      {!value && !isFocused && (
        <div className="example-queries">
          <p className="example-label">Example questions:</p>
          <div className="example-list">
            {exampleQueries.map((example, index) => (
              <button
                key={index}
                className="example-query"
                onClick={() => onChange(example)}
                disabled={disabled}
                type="button"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default QueryInput




