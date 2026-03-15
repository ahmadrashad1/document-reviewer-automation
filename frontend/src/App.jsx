import { useState } from 'react'
import axios from 'axios'
import './App.css'
import UploadArea from './components/UploadArea'
import QueryInput from './components/QueryInput'
import ResultsDisplay from './components/ResultsDisplay'
import LoadingSpinner from './components/LoadingSpinner'

// Browser must reach backend on same host; use env at build time or fallback for dev
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

function App() {
  const [file, setFile] = useState(null)
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile)
    setError(null)
    setResults(null)
  }

  const handleQueryChange = (value) => {
    setQuery(value)
    setError(null)
  }

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a PDF document to analyze')
      return
    }

    if (!query.trim()) {
      setError('Please enter a question or query')
      return
    }

    setIsLoading(true)
    setError(null)
    setResults(null)

    try {
      const formData = new FormData()
      formData.append('document', file)
      formData.append('query', query)

      const response = await axios.post(`${API_BASE_URL}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes
      })

      if (response.data.success) {
        // workflow returned success flag
        setResults(response.data.data)
      } else if (response.data && response.data.data && response.data.data.error) {
        // if n8n returned structured error inside data
        setError(response.data.data.error)
      } else {
        setError(response.data.error || 'Analysis failed')
      }
    } catch (err) {
      if (err.response) {
        // backend responded with non-200 or error object
        const resp = err.response.data || {};
        if (resp.error) {
          setError(resp.error + (resp.details ? `: ${JSON.stringify(resp.details)}` : ''))
        } else {
          setError(resp || 'Analysis failed')
        }
      } else if (err.request) {
        setError('Unable to connect to the server. Please make sure the backend is running.')
      } else {
        setError(err.message || 'An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setQuery('')
    setResults(null)
    setError(null)
  }

  return (
    <div className="app">
      <div className="app-container">
        <header className="app-header">
          <h1 className="app-title">Document Reviewer</h1>
          <p className="app-subtitle">
            Upload a PDF and query specific sections. Analysis is grounded in the document text.
          </p>
        </header>

        <main className="app-main">
          {!results ? (
            <div className="input-section">
              <UploadArea
                file={file}
                onFileSelect={handleFileSelect}
                disabled={isLoading}
              />
              
              <QueryInput
                value={query}
                onChange={handleQueryChange}
                onAnalyze={handleAnalyze}
                disabled={isLoading || !file}
              />

              {error && (
                <div className="error-message" role="alert">
                  <span className="error-label">Error</span>
                  <span className="error-text">{error}</span>
                </div>
              )}

              {isLoading && (
                <div className="loading-container">
                  <LoadingSpinner />
                  <p className="loading-text">
                    Analyzing document. This may take a moment.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <ResultsDisplay
              results={results}
              query={query}
              fileName={file?.name}
              onReset={handleReset}
            />
          )}
        </main>

        <footer className="app-footer">
          <p>Document Reviewer · n8n workflow</p>
        </footer>
      </div>
    </div>
  )
}

export default App




