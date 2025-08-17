from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime

class IssueType(str, Enum):
    HARDWARE = "hardware"
    SOFTWARE = "software"
    NETWORK = "network"
    ACCESS = "access"
    OTHER = "other"

class UrgencyLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Department(str, Enum):
    IT = "it"
    HR = "hr"
    FINANCE = "finance"
    MARKETING = "marketing"
    OPERATIONS = "operations"
    SUPPORT = "support"
    OTHER = "other"

class TicketRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="User's full name")
    department: Department = Field(..., description="User's department")
    issue_description: str = Field(..., min_length=10, max_length=2000, description="Detailed description of the issue")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "John Doe",
                "department": "it",
                "issue_description": "My laptop screen keeps flickering and sometimes goes completely black. This started happening after the latest Windows update."
            }
        }

class SimilarTicket(BaseModel):
    id: str
    description: str
    resolution: str
    issue_type: IssueType
    urgency: UrgencyLevel
    similarity_score: float
    resolved_date: datetime

class TicketResponse(BaseModel):
    ticket_id: str
    user_name: str
    department: Department
    issue_description: str
    issue_type: IssueType
    urgency: UrgencyLevel
    ai_generated_solution: str
    similar_tickets: List[SimilarTicket]
    escalation_contact: Optional[str] = None
    processing_time_ms: int
    confidence_score: float
    response_source: str = Field(default="ai", description="Source of the response: 'ai', 'database', or 'fallback'")
    source_ticket_id: Optional[str] = Field(default=None, description="ID of the source ticket if response is from database")
    
    class Config:
        json_schema_extra = {
            "example": {
                "ticket_id": "TKT-2025-001",
                "user_name": "John Doe",
                "department": "it",
                "issue_description": "Laptop screen flickering issue",
                "issue_type": "hardware",
                "urgency": "medium",
                "ai_generated_solution": "This appears to be a display driver issue...",
                "similar_tickets": [],
                "escalation_contact": "it-support@company.com",
                "processing_time_ms": 1500,
                "confidence_score": 0.85,
                "response_source": "ai",
                "source_ticket_id": None
            }
        }

class EscalationRequest(BaseModel):
    ticket_id: str
    user_name: str
    department: Department
    original_issue: str
    attempted_solution: str
    additional_details: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "ticket_id": "TKT-2025-001",
                "user_name": "John Doe",
                "department": "it",
                "original_issue": "Laptop screen flickering",
                "attempted_solution": "Updated display drivers",
                "additional_details": "Issue persists after trying the suggested solution"
            }
        }

class RegenerateRequest(BaseModel):
    ticket_id: str
    original_issue: str
    user_name: str
    department: Department
    reason: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "ticket_id": "TKT-2025-001",
                "original_issue": "VPN is crashing everytime i open it",
                "user_name": "John Doe",
                "department": "it",
                "reason": "The database solution doesn't match my specific issue"
            }
        }

class ResolveRequest(BaseModel):
    ticket_id: str
    user_name: str
    department: Department
    solution_used: str
    response_source: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "ticket_id": "TKT-2025-001",
                "user_name": "John Doe",
                "department": "it",
                "solution_used": "Updated display drivers and restarted computer",
                "response_source": "ai"
            }
        }

class EscalationResponse(BaseModel):
    escalation_id: str
    assigned_to: str
    contact_email: str
    priority: UrgencyLevel
    estimated_response_time: str
    next_steps: str

class TicketMetadata(BaseModel):
    """Metadata for storing tickets in ChromaDB"""
    ticket_id: str
    user_name: str
    department: str
    issue_type: str
    urgency: str
    resolution: str
    resolved_date: str
    resolver: str
