import { useState, useEffect } from 'react'
import './ProcessSteps.css'

const STEPS = [
  { id: 'upload', label: 'Uploading document', short: 'Upload' },
  { id: 'chunk', label: 'Chunking & embedding', short: 'Embed' },
  { id: 'search', label: 'Searching document', short: 'Search' },
  { id: 'generate', label: 'Generating answer', short: 'Generate' },
]

const ProcessSteps = ({ isActive, isComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!isActive) {
      setCurrentIndex(0)
      return
    }
    if (isComplete) {
      setCurrentIndex(STEPS.length)
      return
    }
    const interval = setInterval(() => {
      setCurrentIndex((i) => Math.min(i + 1, STEPS.length - 1))
    }, 2200)
    return () => clearInterval(interval)
  }, [isActive, isComplete])

  const displayIndex = isComplete ? STEPS.length : currentIndex

  return (
    <div className="process-steps" role="status" aria-live="polite">
      <p className="process-steps-heading">RAG pipeline</p>
      <ol className="process-steps-list">
        {STEPS.map((step, i) => {
          const done = i < displayIndex
          const active = i === displayIndex && isActive && !isComplete
          return (
            <li
              key={step.id}
              className={`process-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}
            >
              <span className="process-step-indicator">
                {done ? (
                  <span className="process-step-check" aria-hidden>✓</span>
                ) : (
                  <span className="process-step-dot" />
                )}
              </span>
              <span className="process-step-label">{step.label}</span>
              {active && (
                <span className="process-step-pulse" aria-hidden>
                  <span className="process-step-pulse-inner" />
                </span>
              )}
            </li>
          )
        })}
      </ol>
      {isComplete && (
        <p className="process-steps-done">Done — displaying answer</p>
      )}
    </div>
  )
}

export default ProcessSteps
