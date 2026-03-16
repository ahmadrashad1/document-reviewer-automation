#!/usr/bin/env python3
"""
Create the 'documents' collection in Chroma (one-time setup).
Requires Chroma server running on localhost:8000.
Run from project root: python scripts/setup_chroma.py
"""
import sys

def main():
    try:
        import chromadb
    except ImportError:
        print("chromadb not installed. Run: pip install chromadb")
        sys.exit(1)

    try:
        client = chromadb.HttpClient(host="localhost", port=8000)
    except Exception as e:
        print(f"Cannot connect to Chroma at localhost:8000: {e}")
        print("Start Chroma first: .\\scripts\\start-chroma.ps1")
        sys.exit(1)

    print("Chroma collection setup")
    print("-" * 40)

    collections = client.list_collections()
    names = [c.name for c in collections]
    if "documents" in names:
        print("Collection 'documents' already exists.")
        return 0

    client.create_collection(name="documents", metadata={"description": "Document RAG collection"})
    print("Collection 'documents' created.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
