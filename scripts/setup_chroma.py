#!/usr/bin/env python3
"""
Setup Chroma Collection - One-time setup
Creates the 'documents' collection if it doesn't exist
"""
import sys
import chromadb

def setup_chroma_collection():
    try:
        # Connect to Chroma
        client = chromadb.HttpClient(host='localhost', port=8000)
        
        print("=" * 50)
        print("Chroma Collection Setup")
        print("=" * 50)
        print()
        
        # Check existing collections
        print("Step 1: Checking existing collections...")
        collections = client.list_collections()
        collection_names = [c.name for c in collections]
        print(f"Found {len(collection_names)} collection(s): {collection_names}")
        
        # Check if 'documents' collection exists
        if 'documents' in collection_names:
            print()
            print("✅ Collection 'documents' already exists!")
            for col in collections:
                if col.name == 'documents':
                    print(f"   Collection ID: {col.id}")
                    print(f"   Metadata: {col.metadata}")
            return True
        
        # Create collection if it doesn't exist
        print()
        print("Step 2: Creating 'documents' collection...")
        collection = client.create_collection(
            name="documents",
            metadata={"description": "Document analysis collection"}
        )
        
        print("✅ Collection 'documents' created successfully!")
        print(f"   Collection ID: {collection.id}")
        print()
        
        # Verify creation
        print("Step 3: Verifying collection...")
        collections = client.list_collections()
        collection_names = [c.name for c in collections]
        if 'documents' in collection_names:
            print("✅ Verification successful!")
            return True
        else:
            print("❌ Verification failed - collection not found")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print()
        print("Troubleshooting:")
        print("1. Make sure Chroma is running on localhost:8000")
        print("2. Check if ChromaDB is installed: pip install chromadb")
        return False

if __name__ == "__main__":
    success = setup_chroma_collection()
    sys.exit(0 if success else 1)




