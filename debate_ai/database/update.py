from .connection import DebateDatabase

class DataMaintenance(DebateDatabase):
    def update_fact_check(self, chunk_id, verdict):
        # Update fact check status for a chunk
        result = self.metadata.update_one(
            {"chunk_id": chunk_id},
            {"$set": {"fact_checked": verdict}}
        )
        if result.modified_count > 0:
            print(f"Updated fact check for {chunk_id} to {verdict}")
        else:
            print(f"Chunk {chunk_id} not found")
    
    def delete_transcript(self, source_name):
        # Delete all data for a specific source
        chunks_to_delete = list(self.metadata.find(
            {"source": source_name}, 
            {"chunk_id": 1}
        ))
        
        chunk_ids = [chunk["chunk_id"] for chunk in chunks_to_delete]
        
        self.transcripts.delete_many({"chunk_id": {"$in": chunk_ids}})
        self.embeddings.delete_many({"chunk_id": {"$in": chunk_ids}})
        self.metadata.delete_many({"chunk_id": {"$in": chunk_ids}})
        
        print(f"Deleted {len(chunk_ids)} chunks from source: {source_name}")