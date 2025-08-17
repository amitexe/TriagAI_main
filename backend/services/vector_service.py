import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import os
import asyncio
from typing import List, Dict, Any, Optional
from loguru import logger
import uuid
from datetime import datetime
import json

from models.ticket_models import TicketMetadata, SimilarTicket, IssueType, UrgencyLevel

class VectorService:
    """Service for managing vector embeddings and similarity search using ChromaDB"""
    
    def __init__(self):
        self.persist_directory = os.getenv("CHROMA_PERSIST_DIR", "./data/chroma_db")
        self.collection_name = "helpdesk_tickets"
        self.embedding_model_name = "all-MiniLM-L6-v2"  # Free, lightweight, and effective
        
        # Initialize embedding model
        try:
            self.embedding_model = SentenceTransformer(self.embedding_model_name)
            logger.info(f"Loaded embedding model: {self.embedding_model_name}")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise
        
        self.client = None
        self.collection = None
    
    async def initialize(self):
        """Initialize ChromaDB client and collection"""
        try:
            # Create persist directory if it doesn't exist
            os.makedirs(self.persist_directory, exist_ok=True)
            
            # Initialize ChromaDB client with persistence
            self.client = chromadb.PersistentClient(
                path=self.persist_directory,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            # Get or create collection
            try:
                self.collection = self.client.get_collection(name=self.collection_name)
                logger.info(f"Connected to existing collection: {self.collection_name}")
            except:
                self.collection = self.client.create_collection(
                    name=self.collection_name,
                    metadata={"description": "Helpdesk tickets with resolutions"}
                )
                logger.info(f"Created new collection: {self.collection_name}")
                
                # Add some sample data
                await self._add_sample_data()
            
            logger.info("Vector service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize vector service: {e}")
            raise
    
    async def _add_sample_data(self):
        """Add sample resolved tickets for demonstration"""
        sample_tickets = [
            {
                "id": "sample_001",
                "description": "Laptop screen flickering and display issues after Windows update",
                "resolution": "Updated display drivers from manufacturer website. Issue resolved after driver update and system restart. Recommended checking Windows Update for optional driver updates.",
                "metadata": {
                    "ticket_id": "TKT-2024-001",
                    "user_name": "Sample User",
                    "department": "it",
                    "issue_type": "hardware",
                    "urgency": "medium",
                    "resolution": "Updated display drivers",
                    "resolved_date": "2024-12-01",
                    "resolver": "IT Support Team"
                }
            },
            {
                "id": "sample_002", 
                "description": "Cannot access shared network drive, getting permission denied error",
                "resolution": "Reset user permissions on network share. Added user to appropriate security group. Verified connectivity and access restored. User can now access all required folders.",
                "metadata": {
                    "ticket_id": "TKT-2024-002",
                    "user_name": "Sample User 2",
                    "department": "finance",
                    "issue_type": "access",
                    "urgency": "high",
                    "resolution": "Reset network permissions",
                    "resolved_date": "2024-12-02",
                    "resolver": "Network Admin"
                }
            },
            {
                "id": "sample_003",
                "description": "Email application crashes when trying to open attachments",
                "resolution": "Cleared Outlook cache and repaired Office installation. Updated to latest version. Issue resolved after cache cleanup and application repair.",
                "metadata": {
                    "ticket_id": "TKT-2024-003",
                    "user_name": "Sample User 3",
                    "department": "hr",
                    "issue_type": "software",
                    "urgency": "medium",
                    "resolution": "Repaired Office installation",
                    "resolved_date": "2024-12-03",
                    "resolver": "Software Support"
                }
            },
            {
                "id": "sample_004",
                "description": "Internet connection very slow, websites taking long time to load",
                "resolution": "Diagnosed network congestion issue. Reset network adapter and updated drivers. Configured QoS settings and optimized DNS. Connection speed improved significantly.",
                "metadata": {
                    "ticket_id": "TKT-2024-004",
                    "user_name": "Sample User 4",
                    "department": "marketing",
                    "issue_type": "network",
                    "urgency": "medium",
                    "resolution": "Network optimization and driver update",
                    "resolved_date": "2024-12-04",
                    "resolver": "Network Team"
                }
            },
            {
                "id": "sample_005",
                "description": "Printer not responding, jobs stuck in queue, cannot print documents",
                "resolution": "Cleared print queue and reinstalled printer drivers. Reset printer to factory settings and reconfigured network connection. Printer now functioning normally.",
                "metadata": {
                    "ticket_id": "TKT-2024-005", 
                    "user_name": "Sample User 5",
                    "department": "operations",
                    "issue_type": "hardware",
                    "urgency": "low",
                    "resolution": "Printer driver reinstall and reset",
                    "resolved_date": "2024-12-05",
                    "resolver": "Hardware Support"
                }
            }
        ]
        
        try:
            for ticket in sample_tickets:
                embedding = self.embedding_model.encode(ticket["description"]).tolist()
                
                self.collection.add(
                    ids=[ticket["id"]],
                    embeddings=[embedding],
                    documents=[ticket["description"]],
                    metadatas=[{
                        **ticket["metadata"],
                        "resolution": ticket["resolution"]
                    }]
                )
            
            logger.info(f"Added {len(sample_tickets)} sample tickets to collection")
            
        except Exception as e:
            logger.error(f"Failed to add sample data: {e}")
    
    async def add_resolved_ticket(self, ticket_metadata: TicketMetadata, description: str, resolution: str) -> str:
        """Add a resolved ticket to the vector database"""
        try:
            # Generate embedding for the issue description
            embedding = self.embedding_model.encode(description).tolist()
            
            # Create unique ID
            ticket_id = f"ticket_{uuid.uuid4().hex[:8]}"
            
            # Add to collection
            self.collection.add(
                ids=[ticket_id],
                embeddings=[embedding],
                documents=[description],
                metadatas=[{
                    "ticket_id": ticket_metadata.ticket_id,
                    "user_name": ticket_metadata.user_name,
                    "department": ticket_metadata.department,
                    "issue_type": ticket_metadata.issue_type,
                    "urgency": ticket_metadata.urgency,
                    "resolution": resolution,
                    "resolved_date": ticket_metadata.resolved_date,
                    "resolver": ticket_metadata.resolver
                }]
            )
            
            logger.info(f"Added resolved ticket {ticket_metadata.ticket_id} to vector database")
            return ticket_id
            
        except Exception as e:
            logger.error(f"Failed to add resolved ticket: {e}")
            raise
    
    async def search_similar(self, query: str, limit: int = 5, min_similarity: float = 0.3) -> List[SimilarTicket]:
        """Search for similar tickets based on description"""
        try:
            logger.info(f"Searching for similar tickets with query: '{query[:50]}...'")
            
            # Generate embedding for query
            query_embedding = self.embedding_model.encode(query).tolist()
            
            # Search in collection
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=limit,
                include=["documents", "metadatas", "distances"]
            )
            
            similar_tickets = []
            
            if results["documents"] and results["documents"][0]:
                for i, (doc, metadata, distance) in enumerate(zip(
                    results["documents"][0],
                    results["metadatas"][0],
                    results["distances"][0]
                )):
                    # Convert distance to similarity score (ChromaDB uses L2 distance)
                    # L2 distance ranges from 0 (identical) to 2 (completely different)
                    # Convert to similarity: 1 - (distance / 2)
                    similarity_score = max(0, 1 - (distance / 2))
                    
                    logger.debug(f"Found ticket {metadata.get('ticket_id', f'unknown_{i}')} with distance {distance:.4f}, similarity {similarity_score:.4f}")
                    
                    if similarity_score >= min_similarity:
                        try:
                            similar_ticket = SimilarTicket(
                                id=metadata.get("ticket_id", f"unknown_{i}"),
                                description=doc,
                                resolution=metadata.get("resolution", "Resolution not available"),
                                issue_type=IssueType(metadata.get("issue_type", "other")),
                                urgency=UrgencyLevel(metadata.get("urgency", "low")),
                                similarity_score=round(similarity_score, 3),
                                resolved_date=datetime.fromisoformat(
                                    metadata.get("resolved_date", "2024-01-01")
                                )
                            )
                            similar_tickets.append(similar_ticket)
                        except Exception as e:
                            logger.warning(f"Failed to parse similar ticket {i}: {e}")
                            continue
            
            # Sort by similarity score descending
            similar_tickets.sort(key=lambda x: x.similarity_score, reverse=True)
            
            logger.info(f"Found {len(similar_tickets)} similar tickets above threshold {min_similarity}")
            if similar_tickets:
                logger.info(f"Best match: {similar_tickets[0].id} with similarity {similar_tickets[0].similarity_score:.3f}")
            
            return similar_tickets
            
        except Exception as e:
            logger.error(f"Failed to search similar tickets: {e}")
            return []
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if vector service is healthy"""
        try:
            if not self.client or not self.collection:
                return {"status": "unhealthy", "error": "Not initialized"}
            
            # Try to query the collection
            results = self.collection.query(
                query_texts=["test query"],
                n_results=1
            )
            
            count = self.collection.count()
            
            return {
                "status": "healthy",
                "collection_name": self.collection_name,
                "document_count": count,
                "embedding_model": self.embedding_model_name
            }
            
        except Exception as e:
            logger.error(f"Vector service health check failed: {e}")
            return {"status": "unhealthy", "error": str(e)}
    
    async def store_resolved_ticket(self, resolved_data: Dict[str, Any]):
        """Store a resolved ticket for admin tracking"""
        try:
            if not self.client:
                await self.initialize()
            
            # Create a separate collection for resolved tickets
            resolved_collection_name = "resolved_tickets"
            try:
                resolved_collection = self.client.get_collection(name=resolved_collection_name)
            except Exception:
                resolved_collection = self.client.create_collection(
                    name=resolved_collection_name,
                    metadata={"hnsw:space": "cosine"}
                )
            
            # Create document for the resolved ticket
            document_id = f"resolved_{resolved_data['ticket_id']}_{uuid.uuid4().hex[:6]}"
            
            # Store the resolved ticket
            resolved_collection.add(
                documents=[f"Resolved ticket: {resolved_data.get('solution_used', 'No solution')}"],
                metadatas=[resolved_data],
                ids=[document_id]
            )
            
            logger.info(f"Stored resolved ticket: {resolved_data['ticket_id']}")
            
        except Exception as e:
            logger.error(f"Failed to store resolved ticket: {e}")
            raise
    
    async def get_resolved_tickets(self) -> List[Dict[str, Any]]:
        """Get all resolved tickets for admin dashboard"""
        try:
            if not self.client:
                await self.initialize()
            
            # Access resolved tickets collection
            resolved_collection_name = "resolved_tickets"
            try:
                resolved_collection = self.client.get_collection(name=resolved_collection_name)
                
                # Get all resolved tickets
                results = resolved_collection.get()
                
                resolved_tickets = []
                if results and results['metadatas']:
                    for metadata in results['metadatas']:
                        resolved_tickets.append(metadata)
                
                logger.info(f"Retrieved {len(resolved_tickets)} resolved tickets")
                return resolved_tickets
                
            except Exception:
                logger.info("No resolved tickets collection found")
                return []
            
        except Exception as e:
            logger.error(f"Failed to get resolved tickets: {e}")
            return []
    
    async def get_escalated_tickets(self) -> List[Dict[str, Any]]:
        """Get all escalated tickets for admin dashboard"""
        try:
            if not self.client:
                await self.initialize()
            
            # Access escalated tickets collection
            escalated_collection_name = "escalated_tickets"
            try:
                escalated_collection = self.client.get_collection(name=escalated_collection_name)
                
                # Get all escalated tickets
                results = escalated_collection.get()
                
                escalated_tickets = []
                if results and results['metadatas']:
                    for metadata in results['metadatas']:
                        escalated_tickets.append(metadata)
                
                logger.info(f"Retrieved {len(escalated_tickets)} escalated tickets")
                return escalated_tickets
                
            except Exception:
                logger.info("No escalated tickets collection found")
                return []
            
        except Exception as e:
            logger.error(f"Failed to get escalated tickets: {e}")
            return []
    
    async def store_escalated_ticket(self, escalated_data: Dict[str, Any]):
        """Store an escalated ticket for admin tracking"""
        try:
            if not self.client:
                await self.initialize()
            
            # Create a separate collection for escalated tickets
            escalated_collection_name = "escalated_tickets"
            try:
                escalated_collection = self.client.get_collection(name=escalated_collection_name)
            except Exception:
                escalated_collection = self.client.create_collection(
                    name=escalated_collection_name,
                    metadata={"hnsw:space": "cosine"}
                )
            
            # Create document for the escalated ticket
            document_id = f"escalated_{escalated_data['ticket_id']}_{uuid.uuid4().hex[:6]}"
            
            # Store the escalated ticket
            escalated_collection.add(
                documents=[f"Escalated ticket: {escalated_data.get('original_issue', 'No description')}"],
                metadatas=[escalated_data],
                ids=[document_id]
            )
            
            logger.info(f"Stored escalated ticket: {escalated_data['ticket_id']}")
            
        except Exception as e:
            logger.error(f"Failed to store escalated ticket: {e}")
            raise
