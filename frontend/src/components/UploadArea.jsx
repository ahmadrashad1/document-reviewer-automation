import { useRef, useState } from 'react'
import './UploadArea.css'

const UploadArea = ({ file, onFileSelect, disabled }) => {
  const fileInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (disabled) return

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === 'application/pdf') {
      onFileSelect(droppedFile)
    } else {
      alert('Please upload a PDF file')
    }
  }

  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      onFileSelect(selectedFile)
    }
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="upload-section">
      <label className="upload-label">Document Upload</label>
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''} ${disabled ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInput}
          disabled={disabled}
          style={{ display: 'none' }}
        />
        
        {file ? (
          <div className="file-info">
            <div className="file-badge">PDF</div>
            <div className="file-details">
              <div className="file-name">{file.name}</div>
              <div className="file-size">{formatFileSize(file.size)}</div>
            </div>
            {!disabled && (
              <button
                className="remove-file-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onFileSelect(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                type="button"
                aria-label="Remove file"
              >
                <span aria-hidden="true">×</span>
              </button>
            )}
          </div>
        ) : (
          <div className="upload-placeholder">
            <p className="upload-text">
              <span className="upload-text-main">Choose a file</span> or drag and drop
            </p>
            <p className="upload-text-sub">PDF only, max 20MB</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UploadArea




