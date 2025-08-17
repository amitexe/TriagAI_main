from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from loguru import logger
import traceback
from datetime import datetime

def setup_error_handlers(app: FastAPI):
    """Setup global error handlers for the FastAPI app"""
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        """Handle HTTP exceptions"""
        logger.warning(f"HTTP {exc.status_code}: {exc.detail} - {request.url}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.detail,
                "status_code": exc.status_code,
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url)
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle all other exceptions"""
        error_id = f"ERR-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        
        logger.error(f"Unhandled exception {error_id}: {str(exc)}")
        logger.debug(f"Exception traceback {error_id}: {traceback.format_exc()}")
        
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "error_id": error_id,
                "message": "An unexpected error occurred. Please contact support.",
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url)
            }
        )
    
    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        """Handle value errors (usually validation issues)"""
        logger.warning(f"Value error: {str(exc)} - {request.url}")
        return JSONResponse(
            status_code=400,
            content={
                "error": "Invalid input",
                "message": str(exc),
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url)
            }
        )
    
    logger.info("Error handlers configured")
