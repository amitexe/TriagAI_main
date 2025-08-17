<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Helpdesk Assistant Project Instructions

This is a real-time helpdesk assistant project using:
- FastAPI for the backend API
- LangChain for modular AI chains
- ChromaDB for vector storage and similarity search
- OpenAI GPT-4.1-nano for AI responses
- React with dark theme for the frontend

## Code Style Guidelines

- Use type hints for all Python functions
- Implement comprehensive error handling and logging
- Follow modular architecture patterns
- Use Pydantic models for data validation
- Implement fallback mechanisms for external services
- Use descriptive variable and function names
- Add docstrings to all classes and functions

## Architecture Patterns

- Separate concerns: services, models, utilities
- Use dependency injection for database and AI services
- Implement retry mechanisms for external API calls
- Use structured logging with correlation IDs
- Follow RESTful API design principles
