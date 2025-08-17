from loguru import logger
import sys
import os
from datetime import datetime

def setup_logging():
    """Configure logging for the application"""
    
    # Remove default logger
    logger.remove()
    
    # Get log level from environment
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    
    # Create logs directory if it doesn't exist
    os.makedirs("logs", exist_ok=True)
    
    # Console logging with colors
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=log_level,
        colorize=True
    )
    
    # File logging - general log
    logger.add(
        "logs/helpdesk_{time:YYYY-MM-DD}.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level=log_level,
        rotation="1 day",
        retention="30 days",
        compression="zip"
    )
    
    # File logging - error log
    logger.add(
        "logs/errors_{time:YYYY-MM-DD}.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level="ERROR",
        rotation="1 day",
        retention="90 days",
        compression="zip"
    )
    
    # File logging - structured JSON log for analysis
    logger.add(
        "logs/structured_{time:YYYY-MM-DD}.json",
        format=lambda record: f'{{"timestamp": "{record["time"]}", "level": "{record["level"].name}", "module": "{record["name"]}", "function": "{record["function"]}", "line": {record["line"]}, "message": "{record["message"]}"}}',
        level="INFO",
        rotation="1 day",
        retention="30 days"
    )
    
    logger.info("Logging configured successfully")
    logger.info(f"Log level set to: {log_level}")
    logger.info(f"Logs directory: {os.path.abspath('logs')}")
