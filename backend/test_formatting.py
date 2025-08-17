#!/usr/bin/env python3
"""
Test script to verify solution formatting works correctly
"""

sample_solutions = [
    """1. Check your internet connection stability
2. Restart the VPN client application
3. Try connecting to a different VPN server
4. Update your VPN client to the latest version
5. Contact IT support if the issue persists""",
    
    """Step 1: Check printer power and connections
Step 2: Verify printer is set as default in Windows
Step 3: Clear print queue of any stuck jobs
Step 4: Update or reinstall printer drivers
Step 5: Test print from a different application""",
    
    "1. First do this thing 2. Then do this other thing 3. Finally complete the task",
    
    """To resolve this issue:
1. Open the application settings
2. Navigate to the network configuration
3. Reset the connection parameters
4. Save the changes and restart the application
Additional notes: This should resolve most connectivity issues."""
]

# Simulate the JavaScript regex operations in Python to see what the formatting should produce
import re

def simulate_format_solution_text(text):
    """Simulate the JavaScript formatSolutionText function"""
    print(f"\\nOriginal text: {repr(text)}")
    
    # First, handle the case where numbered steps are in a single line
    formatted_text = text
    
    # Split numbered items that are in one continuous line
    formatted_text = re.sub(r'(\\d+\\.\\s+[^.]*?)(\\s+\\d+\\.)', r'\\1\\n\\2', formatted_text)
    print(f"After first regex: {repr(formatted_text)}")
    
    # Also handle periods followed by numbers
    formatted_text = re.sub(r'(\\.\\s+)(\\d+\\.\\s+)', r'\\1\\n\\2', formatted_text)
    print(f"After second regex: {repr(formatted_text)}")
    
    # Split by sentences for better paragraph handling
    formatted_text = re.sub(r'(\\.\\s+)([A-Z][a-z])', r'\\1\\n\\2', formatted_text)
    print(f"After third regex: {repr(formatted_text)}")
    
    # Split text into lines and paragraphs
    lines = [line.strip() for line in formatted_text.split('\\n') if line.strip()]
    print(f"Lines to process: {lines}")
    
    elements = []
    
    for i, line in enumerate(lines):
        trimmed_line = line.strip()
        
        # Check if it's a numbered step
        numbered_match = re.match(r'^(\\d+)\\.\\s*(.+)', trimmed_line)
        if numbered_match:
            step_number = numbered_match.group(1)
            step_text = numbered_match.group(2)
            print(f"Creating formatted step: {step_number} - {step_text}")
            elements.append(f"<formatted-step>{step_number}: {step_text}</formatted-step>")
            continue
        
        # Check if it's a bullet point
        bullet_match = re.match(r'^[-*•]\\s*(.+)', trimmed_line)
        if bullet_match:
            elements.append(f"<formatted-bullet>• {bullet_match.group(1)}</formatted-bullet>")
            continue
        
        # Check if it's a header
        if trimmed_line.endswith(':') and len(trimmed_line) < 100:
            elements.append(f"<h4>{trimmed_line}</h4>")
            continue
        
        # Regular text
        if len(trimmed_line) > 10:
            elements.append(f"<p>{trimmed_line}</p>")
        elif len(trimmed_line) > 0:
            elements.append(f"<span>{trimmed_line}</span>")
    
    print(f"Final elements: {elements}")
    return elements

if __name__ == "__main__":
    for i, solution in enumerate(sample_solutions):
        print(f"\\n{'='*50}")
        print(f"Testing solution {i+1}:")
        simulate_format_solution_text(solution)
