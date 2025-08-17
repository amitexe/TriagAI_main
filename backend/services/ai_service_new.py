import openai
from openai import OpenAI
import os
import asyncio
from typing import Dict, Any, Optional, Tuple
from loguru import logger
import time
import json

from models.ticket_models import IssueType, UrgencyLevel, Department

class AIService:
    """Service for AI-powered ticket analysis and solution generation using OpenAI"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            logger.error("OpenAI API key not found in environment variables")
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        # Initialize OpenAI client
        self.client = OpenAI(api_key=self.api_key)
        
        # Analysis prompt template
        self.analysis_prompt = """
You are an expert IT helpdesk analyst with extensive experience in troubleshooting technical issues across various departments and systems. 

TASK: Analyze the following helpdesk ticket and provide a the best possible walk through so that the person can easily understand and fix the issue themselves.

USER INFORMATION:
- Name: {user_name}
- Department: {department}
- Issue Description: {issue_description}

ANALYSIS REQUIREMENTS:
1. ISSUE TYPE CLASSIFICATION: Categorize the issue as one of: hardware, software, network, access, or other
2. URGENCY ASSESSMENT: Rate urgency as low, medium, high, or critical based on business impact
3. DETAILED SOLUTION: Provide a step-by-step solution that is:
   - Technically accurate and specific
   - Easy to follow for non-technical users
   - Includes preventive measures
   - Contains alternative approaches if the primary solution fails

RESPONSE FORMAT (JSON):
{{
    "issue_type": "hardware|software|network|access|other",
    "urgency": "low|medium|high|critical",
    "solution": "Detailed step-by-step solution with specific instructions",
    "confidence_score": 0.0-1.0,
    "reasoning": "Brief explanation of your assessment",
    "estimated_resolution_time": "Time estimate (e.g., '15 minutes', '2 hours')",
    "required_skills": "Technical skill level required (beginner/intermediate/advanced)",
    "escalation_criteria": "When to escalate this issue"
}}

IMPORTANT GUIDELINES:
- Be specific and actionable in your solutions
- Consider the user's department context when providing solutions
- If the issue description is vague, provide the most likely solution and mention what additional information would help
- Always include safety warnings for hardware-related issues
- For software issues, include version-specific instructions when possible
- For network issues, consider both local and infrastructure problems
- For access issues, balance security with usability

Provide your analysis in valid JSON format only, no additional text.
"""
        
        # Escalation prompt template
        self.escalation_prompt = """
You are a senior IT helpdesk manager responsible for ticket escalation decisions.

ESCALATION REQUEST:
Original Ticket: {ticket_info}
Attempted Solution: {attempted_solution}
Additional Details: {additional_details}

TASK: Determine the appropriate escalation path and provide detailed next steps.

RESPONSE FORMAT (JSON):
{{
    "assigned_to": "Specific team or role name",
    "contact_email": "Appropriate contact email",
    "priority": "low|medium|high|critical",
    "estimated_response_time": "Time estimate for response",
    "next_steps": "Detailed action plan for the escalated team",
    "escalation_reason": "Why this issue requires escalation",
    "required_expertise": "Specific skills or access needed"
}}

ESCALATION TEAMS:
- Hardware Team: Physical equipment, printers, monitors, laptops
- Software Team: Applications, licensing, installations
- Network Team: Connectivity, infrastructure, security
- Security Team: Access controls, permissions, authentication
- Vendor Support: Third-party software/hardware issues
- Management: Policy decisions, budget approvals

Provide your response in valid JSON format only.
"""
    
    async def analyze_ticket(self, user_name: str, department: str, issue_description: str) -> Dict[str, Any]:
        """Analyze a ticket and generate AI-powered insights"""
        start_time = time.time()
        
        try:
            logger.info(f"Starting AI analysis for ticket from {user_name}")
            
            # Format the prompt
            prompt = self.analysis_prompt.format(
                user_name=user_name,
                department=department,
                issue_description=issue_description
            )
            
            # Make OpenAI API call
            response = await asyncio.to_thread(
                self._make_openai_call,
                prompt
            )
            
            # Parse the JSON response
            try:
                analysis = json.loads(response.strip())
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse AI response as JSON: {e}")
                logger.debug(f"Raw AI response: {response}")
                # Fallback response
                analysis = {
                    "issue_type": "other",
                    "urgency": "medium",
                    "solution": f"Based on the description '{issue_description}', I recommend contacting your IT support team for assistance. This appears to be a technical issue that requires further investigation.",
                    "confidence_score": 0.5,
                    "reasoning": "Unable to parse detailed analysis",
                    "estimated_resolution_time": "30 minutes",
                    "required_skills": "intermediate",
                    "escalation_criteria": "If issue persists after 30 minutes"
                }
            
            processing_time = int((time.time() - start_time) * 1000)
            
            # Validate and normalize the response
            analysis = self._validate_analysis(analysis)
            analysis["processing_time_ms"] = processing_time
            
            logger.info(f"AI analysis completed in {processing_time}ms")
            return analysis
            
        except Exception as e:
            logger.error(f"Failed to analyze ticket: {e}")
            # Return fallback response
            return {
                "issue_type": "other",
                "urgency": "medium", 
                "solution": "We're experiencing technical difficulties with our AI analysis. Please contact IT support directly for assistance with your issue.",
                "confidence_score": 0.1,
                "reasoning": "AI service unavailable",
                "estimated_resolution_time": "Unknown",
                "required_skills": "N/A",
                "escalation_criteria": "Immediate",
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }
    
    def _make_openai_call(self, prompt: str) -> str:
        """Make a synchronous OpenAI API call"""
        try:
            response = self.client.chat.completions.create(
                model="gpt-4.1-nano",
                messages=[
                    {"role": "system", "content": "You are an expert IT helpdesk analyst. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=1000
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
            raise
    
    async def generate_escalation(self, ticket_info: Dict[str, Any], attempted_solution: str, additional_details: str = "") -> Dict[str, Any]:
        """Generate escalation information for unresolved tickets"""
        try:
            logger.info("Generating escalation information")
            
            # Format ticket info
            ticket_summary = f"User: {ticket_info.get('user_name', 'Unknown')}, Department: {ticket_info.get('department', 'Unknown')}, Issue: {ticket_info.get('issue_description', 'No description')}"
            
            # Format the escalation prompt
            prompt = self.escalation_prompt.format(
                ticket_info=ticket_summary,
                attempted_solution=attempted_solution,
                additional_details=additional_details or "No additional details provided"
            )
            
            # Make OpenAI API call
            response = await asyncio.to_thread(
                self._make_openai_call,
                prompt
            )
            
            # Parse JSON response
            try:
                escalation = json.loads(response.strip())
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse escalation response: {e}")
                # Fallback escalation
                escalation = {
                    "assigned_to": "IT Support Manager",
                    "contact_email": "it-support@company.com",
                    "priority": "medium",
                    "estimated_response_time": "2 hours",
                    "next_steps": "Senior technician will review the case and contact you directly",
                    "escalation_reason": "Initial solution was unsuccessful",
                    "required_expertise": "Advanced troubleshooting"
                }
            
            logger.info("Escalation information generated successfully")
            return escalation
            
        except Exception as e:
            logger.error(f"Failed to generate escalation: {e}")
            return {
                "assigned_to": "IT Support Manager",
                "contact_email": "it-support@company.com", 
                "priority": "high",
                "estimated_response_time": "1 hour",
                "next_steps": "Urgent review required - system error during escalation",
                "escalation_reason": "Technical error in escalation system",
                "required_expertise": "System administration"
            }
    
    def _validate_analysis(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and normalize AI analysis response"""
        # Validate issue_type
        valid_issue_types = [e.value for e in IssueType]
        if analysis.get("issue_type") not in valid_issue_types:
            analysis["issue_type"] = "other"
        
        # Validate urgency
        valid_urgencies = [e.value for e in UrgencyLevel]
        if analysis.get("urgency") not in valid_urgencies:
            analysis["urgency"] = "medium"
        
        # Ensure confidence_score is between 0 and 1
        confidence = analysis.get("confidence_score", 0.5)
        if not isinstance(confidence, (int, float)) or confidence < 0 or confidence > 1:
            analysis["confidence_score"] = 0.5
        
        # Ensure required fields exist
        required_fields = ["solution", "reasoning", "estimated_resolution_time", "required_skills", "escalation_criteria"]
        for field in required_fields:
            if field not in analysis or not analysis[field]:
                analysis[field] = "Information not available"
        
        return analysis
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if AI service is healthy"""
        try:
            # Test with a simple query
            test_response = await asyncio.to_thread(
                self._make_openai_call,
                "Respond with 'OK' if you can process this message."
            )
            
            if "OK" in test_response:
                return {
                    "status": "healthy",
                    "model": "gpt-3.5-turbo",
                    "response_time_ms": "< 1000"
                }
            else:
                return {
                    "status": "degraded",
                    "model": "gpt-3.5-turbo",
                    "issue": "Unexpected response"
                }
                
        except Exception as e:
            logger.error(f"AI service health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e)
            }
