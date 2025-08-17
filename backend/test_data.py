#!/usr/bin/env python3
"""
Test script to add sample data to ChromaDB for testing formatting
"""

import asyncio
from datetime import datetime
from services.vector_service import VectorService
from models.ticket_models import TicketMetadata

async def add_sample_data():
    """Add sample tickets to test solution formatting"""
    
    vector_service = VectorService()
    await vector_service.initialize()
    
    # Sample tickets with numbered steps in solutions
    sample_tickets = [
        {
            "issue": "VPN connection keeps dropping",
            "solution": """1. Check your internet connection stability
2. Restart the VPN client application
3. Try connecting to a different VPN server
4. Update your VPN client to the latest version
5. Contact IT support if the issue persists"""
        },
        {
            "issue": "Email application crashes on startup",
            "solution": """1. Close all email applications completely
2. Clear the application cache and temporary files
3. Restart your computer
4. Launch the email application as administrator
5. If issue continues, reinstall the email client"""
        },
        {
            "issue": "Slow computer performance",
            "solution": """1. Close unnecessary programs and browser tabs
2. Run a full system antivirus scan
3. Clear temporary files and browser cache
4. Check available disk space (should be >10% free)
5. Restart your computer to clear memory
6. Consider upgrading RAM if performance is consistently slow"""
        },
        {
            "issue": "Printer not working",
            "solution": """Step 1: Check printer power and connections
Step 2: Verify printer is set as default in Windows
Step 3: Clear print queue of any stuck jobs
Step 4: Update or reinstall printer drivers
Step 5: Test print from a different application"""
        }
    ]
    
    for i, ticket in enumerate(sample_tickets):
        try:
            # Create ticket metadata
            metadata = TicketMetadata(
                ticket_id=f"TEST{i+1:03d}",
                user_name="Test User",
                department="IT Support",
                issue_type="Technical",
                urgency="Medium",
                resolution=ticket["solution"],
                resolved_date=datetime.now().isoformat(),
                resolver="Test Admin"
            )
            
            await vector_service.add_resolved_ticket(
                ticket_metadata=metadata,
                description=ticket["issue"],
                resolution=ticket["solution"]
            )
            print(f"Added ticket: {ticket['issue']}")
        except Exception as e:
            print(f"Error adding ticket: {e}")
    
    print("Sample data added successfully!")

if __name__ == "__main__":
    asyncio.run(add_sample_data())
