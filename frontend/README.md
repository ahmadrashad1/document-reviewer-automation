# AI Document Analyzer - Frontend

A modern React frontend for the AI Document Analysis system.

## Features

- 📄 PDF document upload with drag & drop
- 🔍 Query input with example questions
- ⚡ Real-time analysis results
- 🎨 Modern, responsive UI
- ⚠️ Error handling and loading states

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Configuration

The frontend is configured to connect to the backend API at `http://localhost:5000` by default. This can be changed in `src/App.jsx`:

```javascript
const API_BASE_URL = 'http://localhost:5000'
```

## Usage

1. Upload a PDF document (drag & drop or click to browse)
2. Enter your question about the document
3. Click "Analyze Document" or press Enter
4. View the AI-powered analysis results
5. Click "New Analysis" to start over

## Architecture

- **Frontend (React)** → **Backend (Express)** → **n8n Workflow** → **AI Analysis** → **Results**

The frontend communicates with the Express backend API, which processes the document and forwards it to the n8n workflow for AI-powered analysis using Ollama, ChromaDB, and Llama 3.1.




