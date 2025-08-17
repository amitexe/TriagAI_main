import uuid
import time
from typing import Dict, Any, List
from datetime import datetime
from loguru import logger

from models.ticket_models import (
    TicketRequest, TicketResponse, EscalationRequest, EscalationResponse,
    SimilarTicket, IssueType, UrgencyLevel, Department, TicketMetadata, RegenerateRequest
)
from services.vector_service import VectorService
from services.ai_service import AIService

class TicketService:
    """Main service for processing helpdesk tickets"""
    
    def __init__(self, vector_service: VectorService, ai_service: AIService):
        self.vector_service = vector_service
        self.ai_service = ai_service
        
        # Escalation contacts by department and issue type
        self.escalation_contacts = {
            "hardware": {
                "it": "hardware-support@company.com",
                "default": "it-support@company.com"
            },
            "software": {
                "it": "software-support@company.com", 
                "default": "it-support@company.com"
            },
            "network": {
                "it": "network-admin@company.com",
                "default": "network-support@company.com"
            },
            "access": {
                "hr": "hr-access@company.com",
                "finance": "finance-access@company.com",
                "default": "security-admin@company.com"
            },
            "other": {
                "default": "general-support@company.com"
            }
        }
    
    async def process_ticket(self, ticket_request: TicketRequest) -> TicketResponse:
        """Process a new ticket submission"""
        start_time = time.time()
        ticket_id = f"TKT-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        
        try:
            logger.info(f"Processing ticket {ticket_id} for user {ticket_request.name}")
            
            # Step 1: Search for similar tickets using embeddings
            similar_tickets = await self._find_similar_tickets(ticket_request.issue_description)
            logger.info(f"Found {len(similar_tickets)} similar tickets")
            if similar_tickets:
                logger.info(f"Best similarity score: {similar_tickets[0].similarity_score:.3f}")
            
            # Step 2: Determine if we should use database solution or generate new AI solution
            response_source = "database"
            high_similarity_threshold = 0.8  # Increased threshold for better accuracy
            very_high_similarity_threshold = 0.9  # For very high confidence matches
            
            # Enhanced similarity check with keyword matching
            use_database_solution = False
            best_match = None
            
            if similar_tickets:
                best_match = similar_tickets[0]
                
                # If similarity is very high (90%+), trust it regardless of keyword matching
                if best_match.similarity_score >= very_high_similarity_threshold:
                    use_database_solution = True
                    logger.info(f"Very high-confidence match found (similarity: {best_match.similarity_score:.3f}), using database solution")
                # For medium-high similarity (80-90%), require keyword matching
                elif (best_match.similarity_score >= high_similarity_threshold and 
                      self._check_keyword_similarity(ticket_request.issue_description, best_match.description)):
                    use_database_solution = True
                    logger.info(f"High-confidence match found (similarity: {best_match.similarity_score:.3f}, keywords match), using database solution")
                else:
                    logger.info(f"Match found but not confident enough (similarity: {best_match.similarity_score:.3f}, threshold: {high_similarity_threshold}), generating AI solution")
            
            if not use_database_solution:
                logger.info(f"No high-confidence matches found (best: {similar_tickets[0].similarity_score if similar_tickets else 'none'}), generating AI solution")
                response_source = "ai"
                ai_analysis = await self.ai_service.analyze_ticket(
                    ticket_request.name,
                    ticket_request.department.value,
                    ticket_request.issue_description
                )
                # Add the newly generated solution to the database for future use
                await self._store_new_solution(ticket_id, ticket_request, ai_analysis)
            else:
                ai_analysis = {
                    "issue_type": best_match.issue_type.value,
                    "urgency": best_match.urgency.value,
                    "solution": best_match.resolution,
                    "confidence_score": best_match.similarity_score,
                    "reasoning": f"Retrieved from similar resolved ticket (similarity: {best_match.similarity_score:.3f})",
                    "processing_time_ms": int((time.time() - start_time) * 1000),
                    "source_ticket_id": best_match.id
                }
            
            # Step 3: Determine escalation contact
            escalation_contact = self._get_escalation_contact(
                ai_analysis["issue_type"],
                ticket_request.department.value
            )
            
            # Step 4: Calculate processing time
            processing_time = int((time.time() - start_time) * 1000)
            
            # Step 5: Create response with source tracking
            response = TicketResponse(
                ticket_id=ticket_id,
                user_name=ticket_request.name,
                department=ticket_request.department,
                issue_description=ticket_request.issue_description,
                issue_type=IssueType(ai_analysis["issue_type"]),
                urgency=UrgencyLevel(ai_analysis["urgency"]),
                ai_generated_solution=ai_analysis["solution"],
                similar_tickets=similar_tickets[:3],  # Return top 3 similar tickets
                escalation_contact=escalation_contact,
                processing_time_ms=processing_time,
                confidence_score=ai_analysis["confidence_score"],
                response_source=response_source,  # Track if response is from AI or database
                source_ticket_id=ai_analysis.get("source_ticket_id")  # Reference to source ticket if from database
            )
            
            logger.info(f"Ticket {ticket_id} processed successfully in {processing_time}ms")
            return response
            
        except Exception as e:
            logger.error(f"Failed to process ticket {ticket_id}: {e}")
            # Return fallback response
            processing_time = int((time.time() - start_time) * 1000)
            return TicketResponse(
                ticket_id=ticket_id,
                user_name=ticket_request.name,
                department=ticket_request.department,
                issue_description=ticket_request.issue_description,
                issue_type=IssueType.OTHER,
                urgency=UrgencyLevel.MEDIUM,
                ai_generated_solution="We're experiencing technical difficulties. Please contact IT support directly for immediate assistance.",
                similar_tickets=[],
                escalation_contact="it-support@company.com",
                processing_time_ms=processing_time,
                confidence_score=0.1,
                response_source="fallback"
            )
    
    async def _store_new_solution(self, ticket_id: str, ticket_request: TicketRequest, ai_analysis: Dict[str, Any]) -> None:
        """Store newly generated AI solution in the vector database for future use"""
        try:
            ticket_metadata = TicketMetadata(
                ticket_id=ticket_id,
                user_name=ticket_request.name,
                department=ticket_request.department.value,
                issue_type=ai_analysis["issue_type"],
                urgency=ai_analysis["urgency"],
                resolution=ai_analysis["solution"],
                resolved_date=datetime.now().isoformat(),
                resolver="AI Assistant"
            )
            
            await self.vector_service.add_resolved_ticket(
                ticket_metadata=ticket_metadata,
                description=ticket_request.issue_description,
                resolution=ai_analysis["solution"]
            )
            
            logger.info(f"Stored new AI solution for ticket {ticket_id} in vector database")
            
        except Exception as e:
            logger.error(f"Failed to store new solution for ticket {ticket_id}: {e}")
            # Don't fail the entire request if storage fails
    
    def _check_keyword_similarity(self, query: str, reference: str) -> bool:
        """Check if two descriptions have similar keywords (improved semantic matching)"""
        import re
        from collections import Counter
        
        # Define technology/issue keywords that should match closely
        tech_keywords = {
            'vpn', 'email', 'internet', 'network', 'wifi', 'browser', 'application', 'app',
            'software', 'hardware', 'printer', 'laptop', 'computer', 'phone', 'smartphone',
            'password', 'login', 'access', 'permission', 'file', 'folder', 'drive', 'database',
            'server', 'system', 'windows', 'macos', 'linux', 'chrome', 'firefox', 'outlook',
            'teams', 'zoom', 'slack', 'office', 'excel', 'word', 'powerpoint', 'pdf'
        }
        
        action_keywords = {
            'crash', 'crashing', 'crashed', 'freeze', 'freezing', 'frozen', 'hang', 'hanging',
            'slow', 'fast', 'loading', 'opening', 'closing', 'starting', 'stopping', 'working',
            'not working', 'broken', 'error', 'issue', 'problem', 'trouble', 'failing', 'failed',
            'connecting', 'disconnecting', 'installing', 'uninstalling', 'updating', 'downloading'
        }
        
        def extract_keywords(text: str) -> set:
            # Clean and normalize text
            text = re.sub(r'[^\w\s]', ' ', text.lower())
            words = set(text.split())
            
            # Extract relevant keywords
            relevant_keywords = set()
            
            # Check for technology keywords
            for keyword in tech_keywords:
                if keyword in text:
                    relevant_keywords.add(keyword)
            
            # Check for action keywords
            for keyword in action_keywords:
                if keyword in text:
                    relevant_keywords.add(keyword)
            
            return relevant_keywords
        
        query_keywords = extract_keywords(query)
        reference_keywords = extract_keywords(reference)
        
        # Calculate keyword overlap
        if not query_keywords or not reference_keywords:
            return False
        
        intersection = query_keywords.intersection(reference_keywords)
        union = query_keywords.union(reference_keywords)
        
        # Require significant keyword overlap (Jaccard similarity)
        keyword_similarity = len(intersection) / len(union) if union else 0
        
        # Require at least 30% keyword overlap and at least 2 matching keywords
        return keyword_similarity >= 0.3 and len(intersection) >= 2
    
    async def _find_similar_tickets(self, issue_description: str) -> List[SimilarTicket]:
        """Find similar tickets using vector search"""
        try:
            similar_tickets = await self.vector_service.search_similar(
                query=issue_description,
                limit=5,
                min_similarity=0.3
            )
            
            logger.info(f"Found {len(similar_tickets)} similar tickets")
            return similar_tickets
            
        except Exception as e:
            logger.error(f"Failed to find similar tickets: {e}")
            return []
    
    def _get_escalation_contact(self, issue_type: str, department: str) -> str:
        """Get appropriate escalation contact based on issue type and department"""
        try:
            issue_contacts = self.escalation_contacts.get(issue_type, {})
            return issue_contacts.get(department, issue_contacts.get("default", "support@company.com"))
        except Exception as e:
            logger.error(f"Failed to determine escalation contact: {e}")
            return "support@company.com"
    
    async def escalate_ticket(self, escalation_request: EscalationRequest) -> EscalationResponse:
        """Escalate an unresolved ticket"""
        try:
            logger.info(f"Escalating ticket {escalation_request.ticket_id}")
            
            # Get AI-generated escalation information
            ticket_info = {
                "user_name": escalation_request.user_name,
                "department": escalation_request.department.value,
                "issue_description": escalation_request.original_issue
            }
            
            escalation_info = await self.ai_service.generate_escalation(
                ticket_info=ticket_info,
                attempted_solution=escalation_request.attempted_solution,
                additional_details=escalation_request.additional_details or ""
            )
            
            # Generate escalation ID
            escalation_id = f"ESC-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
            
            # Store escalated ticket data
            escalated_data = {
                "ticket_id": escalation_request.ticket_id,
                "escalation_id": escalation_id,
                "user_name": escalation_request.user_name,
                "department": escalation_request.department.value,
                "original_issue": escalation_request.original_issue,
                "attempted_solution": escalation_request.attempted_solution,
                "additional_details": escalation_request.additional_details or "",
                "assigned_to": escalation_info["assigned_to"],
                "contact_email": escalation_info["contact_email"],
                "priority": escalation_info["priority"],
                "escalated_at": datetime.now().isoformat(),
                "status": "escalated"
            }
            
            # Store in ChromaDB for admin tracking
            await self.vector_service.store_escalated_ticket(escalated_data)
            
            response = EscalationResponse(
                escalation_id=escalation_id,
                assigned_to=escalation_info["assigned_to"],
                contact_email=escalation_info["contact_email"],
                priority=UrgencyLevel(escalation_info["priority"]),
                estimated_response_time=escalation_info["estimated_response_time"],
                next_steps=escalation_info["next_steps"]
            )
            
            logger.info(f"Ticket escalated successfully: {escalation_id}")
            return response
            
        except Exception as e:
            logger.error(f"Failed to escalate ticket: {e}")
            # Return fallback escalation
            escalation_id = f"ESC-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
            return EscalationResponse(
                escalation_id=escalation_id,
                assigned_to="IT Support Manager",
                contact_email="it-support@company.com",
                priority=UrgencyLevel.HIGH,
                estimated_response_time="1 hour",
                next_steps="Your ticket has been escalated to our support team. You will be contacted within 1 hour."
            )
    
    async def add_resolved_ticket(self, ticket_metadata: TicketMetadata, description: str, resolution: str) -> bool:
        """Add a resolved ticket to the knowledge base"""
        try:
            await self.vector_service.add_resolved_ticket(ticket_metadata, description, resolution)
            logger.info(f"Added resolved ticket {ticket_metadata.ticket_id} to knowledge base")
            return True
        except Exception as e:
            logger.error(f"Failed to add resolved ticket: {e}")
            return False
    
    async def regenerate_ai_solution(self, regenerate_request: RegenerateRequest) -> TicketResponse:
        """Generate a fresh AI solution for an existing ticket"""
        start_time = time.time()
        
        try:
            logger.info(f"Regenerating AI solution for ticket {regenerate_request.ticket_id}")
            
            # Create a temporary ticket request for AI analysis
            temp_request = TicketRequest(
                name=regenerate_request.user_name,
                department=regenerate_request.department,
                issue_description=regenerate_request.original_issue
            )
            
            # Force AI generation (skip database lookup)
            ai_analysis = await self.ai_service.analyze_ticket(
                regenerate_request.user_name,
                regenerate_request.department.value,
                regenerate_request.original_issue
            )
            
            # Get similar tickets for reference (but don't use them for solution)
            similar_tickets = await self._find_similar_tickets(regenerate_request.original_issue)
            
            # Determine escalation contact
            escalation_contact = self._get_escalation_contact(
                ai_analysis["issue_type"],
                regenerate_request.department.value
            )
            
            # Calculate processing time
            processing_time = int((time.time() - start_time) * 1000)
            
            # Create response with AI source
            response = TicketResponse(
                ticket_id=regenerate_request.ticket_id,
                user_name=regenerate_request.user_name,
                department=regenerate_request.department,
                issue_description=regenerate_request.original_issue,
                issue_type=IssueType(ai_analysis["issue_type"]),
                urgency=UrgencyLevel(ai_analysis["urgency"]),
                ai_generated_solution=ai_analysis["solution"],
                similar_tickets=similar_tickets[:3],
                escalation_contact=escalation_contact,
                processing_time_ms=processing_time,
                confidence_score=ai_analysis["confidence_score"],
                response_source="ai_regenerated",  # Special source for regenerated solutions
                source_ticket_id=None
            )
            
            # Store the new solution for future use
            await self._store_new_solution(regenerate_request.ticket_id, temp_request, ai_analysis)
            
            logger.info(f"AI solution regenerated successfully for ticket {regenerate_request.ticket_id}")
            return response
            
        except Exception as e:
            logger.error(f"Failed to regenerate AI solution: {e}")
            # Return fallback response
            processing_time = int((time.time() - start_time) * 1000)
            return TicketResponse(
                ticket_id=regenerate_request.ticket_id,
                user_name=regenerate_request.user_name,
                department=regenerate_request.department,
                issue_description=regenerate_request.original_issue,
                issue_type=IssueType.OTHER,
                urgency=UrgencyLevel.MEDIUM,
                ai_generated_solution="We're experiencing technical difficulties generating a new solution. Please contact IT support directly.",
                similar_tickets=[],
                escalation_contact="it-support@company.com",
                processing_time_ms=processing_time,
                confidence_score=0.1,
                response_source="fallback"
            )
    
    async def mark_ticket_resolved(self, resolve_request) -> Dict[str, Any]:
        """Mark a ticket as resolved by the user"""
        try:
            logger.info(f"Marking ticket {resolve_request.ticket_id} as resolved")
            
            # Store the resolved ticket information
            resolved_data = {
                "ticket_id": resolve_request.ticket_id,
                "user_name": resolve_request.user_name,
                "department": resolve_request.department.value,
                "solution_used": resolve_request.solution_used,
                "response_source": resolve_request.response_source,
                "resolved_at": datetime.now().isoformat(),
                "status": "resolved"
            }
            
            # Store in ChromaDB for tracking
            await self.vector_service.store_resolved_ticket(resolved_data)
            
            logger.info(f"Ticket {resolve_request.ticket_id} marked as resolved successfully")
            return {
                "status": "success",
                "message": "Ticket marked as resolved successfully",
                "ticket_id": resolve_request.ticket_id
            }
            
        except Exception as e:
            logger.error(f"Failed to mark ticket as resolved: {e}")
            return {
                "status": "error",
                "message": f"Failed to mark ticket as resolved: {str(e)}",
                "ticket_id": resolve_request.ticket_id
            }
    
    async def get_all_tickets_for_admin(self) -> Dict[str, Any]:
        """Get all tickets for admin dashboard"""
        try:
            logger.info("Fetching all tickets for admin dashboard")
            
            # Get all resolved and escalated tickets
            resolved_tickets = await self.vector_service.get_resolved_tickets()
            escalated_tickets = await self.vector_service.get_escalated_tickets()
            
            # Combine and format tickets
            all_tickets = []
            
            # Add resolved tickets
            for ticket in resolved_tickets:
                all_tickets.append({
                    "id": ticket.get("ticket_id", "Unknown"),
                    "user_name": ticket.get("user_name", "Unknown"),
                    "department": ticket.get("department", "unknown"),
                    "issue_description": ticket.get("issue_description", "No description"),
                    "solution": ticket.get("solution_used", ticket.get("resolution", "No solution provided")),
                    "status": "resolved",
                    "created_at": ticket.get("resolved_at", ticket.get("created_at", datetime.now().isoformat())),
                    "escalation_details": None
                })
            
            # Add escalated tickets
            for ticket in escalated_tickets:
                all_tickets.append({
                    "id": ticket.get("ticket_id", "Unknown"),
                    "user_name": ticket.get("user_name", "Unknown"),
                    "department": ticket.get("department", "unknown"),
                    "issue_description": ticket.get("original_issue", ticket.get("issue_description", "No description")),
                    "solution": ticket.get("attempted_solution", "No solution attempted"),
                    "status": "escalated",
                    "created_at": ticket.get("escalated_at", ticket.get("created_at", datetime.now().isoformat())),
                    "escalation_details": ticket.get("additional_details", "No additional details")
                })
            
            # Sort by creation date (newest first)
            all_tickets.sort(key=lambda x: x["created_at"], reverse=True)
            
            # Calculate stats
            stats = {
                "total": len(all_tickets),
                "resolved": len(resolved_tickets),
                "escalated": len(escalated_tickets)
            }
            
            logger.info(f"Retrieved {len(all_tickets)} tickets for admin dashboard")
            return {
                "tickets": all_tickets,
                "stats": stats
            }
            
        except Exception as e:
            logger.error(f"Failed to fetch admin tickets: {e}")
            return {
                "tickets": [],
                "stats": {"total": 0, "resolved": 0, "escalated": 0},
                "error": str(e)
            }
