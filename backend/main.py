from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from dotenv import load_dotenv
import os
from loguru import logger
import sys

from services.ticket_service import TicketService
from services.vector_service import VectorService
from services.ai_service import AIService
from models.ticket_models import TicketRequest, TicketResponse, EscalationRequest, RegenerateRequest, ResolveRequest
from utils.error_handler import setup_error_handlers
from utils.logger_config import setup_logging

# Load environment variables
load_dotenv()

# Setup logging
setup_logging()

# Initialize FastAPI app
app = FastAPI(
    title="Helpdesk Assistant API",
    description="Real-time helpdesk assistant with AI-powered ticket resolution",
    version="1.0.0"
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup error handlers
setup_error_handlers(app)

# Initialize services
vector_service = VectorService()
ai_service = AIService()
ticket_service = TicketService(vector_service, ai_service)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting Helpdesk Assistant API")
    try:
        await vector_service.initialize()
        logger.info("Vector service initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize vector service: {e}")
        raise

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Helpdesk Assistant API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        # Check vector service
        vector_status = await vector_service.health_check()
        
        # Check AI service
        ai_status = await ai_service.health_check()
        
        return {
            "status": "healthy",
            "services": {
                "vector_db": vector_status,
                "ai_service": ai_status
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "error": str(e)}
        )

@app.post("/api/tickets/submit", response_model=TicketResponse)
async def submit_ticket(ticket_request: TicketRequest):
    """Submit a new helpdesk ticket"""
    try:
        logger.info(f"Processing ticket submission for user: {ticket_request.name}")
        response = await ticket_service.process_ticket(ticket_request)
        logger.info(f"Ticket processed successfully. Type: {response.issue_type}, Urgency: {response.urgency}")
        return response
    except Exception as e:
        logger.error(f"Error processing ticket: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process ticket: {str(e)}")

@app.get("/api/tickets/search")
async def search_similar_tickets(query: str, limit: int = 5):
    """Search for similar tickets in the database"""
    try:
        logger.info(f"Searching for similar tickets with query: {query[:50]}...")
        results = await vector_service.search_similar(query, limit)
        return {"similar_tickets": results}
    except Exception as e:
        logger.error(f"Error searching tickets: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to search tickets: {str(e)}")

@app.post("/api/tickets/escalate")
async def escalate_ticket(escalation_request: EscalationRequest):
    """Escalate an unresolved ticket"""
    try:
        logger.info(f"Escalating ticket for user: {escalation_request.user_name}")
        result = await ticket_service.escalate_ticket(escalation_request)
        return result
    except Exception as e:
        logger.error(f"Error escalating ticket: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to escalate ticket: {str(e)}")

@app.post("/api/tickets/regenerate", response_model=TicketResponse)
async def regenerate_ai_solution(regenerate_request: RegenerateRequest):
    """Generate a fresh AI solution for an existing ticket"""
    try:
        logger.info(f"Regenerating AI solution for ticket: {regenerate_request.ticket_id}")
        response = await ticket_service.regenerate_ai_solution(regenerate_request)
        logger.info(f"AI solution regenerated successfully for ticket: {regenerate_request.ticket_id}")
        return response
    except Exception as e:
        logger.error(f"Error regenerating AI solution: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to regenerate AI solution: {str(e)}")

@app.post("/api/tickets/resolve")
async def mark_ticket_resolved(resolve_request: ResolveRequest):
    """Mark a ticket as resolved by the user"""
    try:
        logger.info(f"Marking ticket as resolved: {resolve_request.ticket_id}")
        result = await ticket_service.mark_ticket_resolved(resolve_request)
        return result
    except Exception as e:
        logger.error(f"Error marking ticket as resolved: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to mark ticket as resolved: {str(e)}")

@app.get("/api/admin/tickets")
async def get_admin_tickets():
    """Get all tickets for admin dashboard"""
    try:
        logger.info("Fetching all tickets for admin dashboard")
        result = await ticket_service.get_all_tickets_for_admin()
        return result
    except Exception as e:
        logger.error(f"Error fetching admin tickets: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch admin tickets: {str(e)}")

if __name__ == "__main__":
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))
    
    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True)
