import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaClock, 
  FaHistory, 
  FaEnvelope,
  FaPlus,
  FaArrowUp,
  FaBug,
  FaTools,
  FaDatabase,
  FaBrain,
  FaRecycle,
  FaMagic,
  FaSpinner
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import EscalationForm from './EscalationForm';

// Helper function to format solution text
const formatSolutionText = (text) => {
  if (!text) return '';
  
  // First, handle the case where numbered steps are in a single line
  let processedText = text;
  
  // Split numbered items that are in one continuous line (like "1. Step one 2. Step two 3. Step three")
  // This regex finds patterns like ". 2." or ". 3." and adds a newline before the number
  processedText = processedText.replace(/(\.\s+)(\d+\.)/g, '$1\n$2');
  
  // Also handle cases where there's no period before the number (like "step 2. next step")
  processedText = processedText.replace(/([a-z]\s+)(\d+\.)/g, '$1\n$2');
  
  // Split text into lines first
  const lines = processedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const elements = [];
  
  lines.forEach((line, index) => {
    // Check if it's a numbered step (supports: "1. text", "Step 1: text", "1) text")
    const numberedMatch = line.match(/^(?:Step\s+)?(\d+)[\.\:\)]\s*(.+)/i);
    if (numberedMatch) {
      const stepNumber = numberedMatch[1];
      const stepText = numberedMatch[2];
      
      elements.push(
        <div key={`step-${index}`} className="formatted-step">
          <span className="step-number">{stepNumber}</span>
          <span className="step-text">{stepText}</span>
        </div>
      );
      return;
    }
    
    // Check if it's a bullet point
    const bulletMatch = line.match(/^[-*•]\s*(.+)/);
    if (bulletMatch) {
      elements.push(
        <div key={`bullet-${index}`} className="formatted-bullet">
          <span className="bullet-marker">•</span>
          <span className="bullet-text">{bulletMatch[1]}</span>
        </div>
      );
      return;
    }
    
    // Check if it's a header (ends with : and is short)
    if (line.endsWith(':') && line.length < 100) {
      elements.push(<h4 key={`h4-${index}`}>{line}</h4>);
      return;
    }
    
    // Regular text - make it a paragraph if it's substantial
    if (line.length > 10) {
      elements.push(<p key={`p-${index}`}>{line}</p>);
    } else if (line.length > 0) {
      elements.push(<span key={`span-${index}`}>{line}<br /></span>);
    }
  });
  
  return elements.length > 0 ? elements : <p>{text}</p>;
};

const ResponseContainer = styled(motion.div)`
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const TicketHeader = styled(motion.div)`
  background: rgba(0, 0, 0, 0.02);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #10b981, transparent);
  }
`;

const TicketInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InfoLabel = styled.span`
  font-size: 0.875rem;
  color: #9ca3af;
  font-weight: 500;
`;

const InfoValue = styled.span`
  font-size: 1rem;
  color: #1f2937;
  font-weight: 600;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 600;
  background: ${props => {
    switch (props.type) {
      case 'critical': return 'linear-gradient(135deg, #ef4444, #dc2626)';
      case 'high': return 'linear-gradient(135deg, #f59e0b, #d97706)';
      case 'medium': return 'linear-gradient(135deg, #3b82f6, #2563eb)';
      case 'low': return 'linear-gradient(135deg, #10b981, #059669)';
      default: return 'linear-gradient(135deg, #6b7280, #4b5563)';
    }
  }};
  box-shadow: 0 4px 15px ${props => {
    switch (props.type) {
      case 'critical': return 'rgba(239, 68, 68, 0.3)';
      case 'high': return 'rgba(245, 158, 11, 0.3)';
      case 'medium': return 'rgba(59, 130, 246, 0.3)';
      case 'low': return 'rgba(16, 185, 129, 0.3)';
      default: return 'rgba(107, 114, 128, 0.3)';
    }
  }};
`;

const TypeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.2);
`;

const SourceBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 600;
  
  ${props => {
    if (props.source === 'ai' || props.source === 'ai_regenerated') {
      return `
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.2));
        border: 1px solid rgba(139, 92, 246, 0.4);
        color: #c7d2fe;
      `;
    } else if (props.source === 'database') {
      return `
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(34, 197, 94, 0.2));
        border: 1px solid rgba(16, 185, 129, 0.4);
        color: #86efac;
      `;
    } else {
      return `
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.2));
        border: 1px solid rgba(245, 158, 11, 0.4);
        color: #fcd34d;
      `;
    }
  }}
`;

const SolutionSection = styled(motion.div)`
  background: rgba(0, 0, 0, 0.02);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #0ea5e9, transparent);
  }
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1f2937;
`;

const SolutionText = styled.div`
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  color: #374151;
  line-height: 1.8;
  font-size: 1rem;
  
  /* Format solution text nicely */
  p {
    margin-bottom: 1rem;
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  /* Style custom formatted steps */
  .formatted-step {
    display: flex !important;
    align-items: flex-start !important;
    margin-bottom: 1.25rem !important;
    
    &:last-child {
      margin-bottom: 0 !important;
    }
    
    .step-number {
      background: linear-gradient(135deg, #10b981, #059669) !important;
      color: white !important;
      border-radius: 50% !important;
      width: 2rem !important;
      height: 2rem !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-weight: 600 !important;
      font-size: 0.875rem !important;
      flex-shrink: 0 !important;
      margin-right: 1rem !important;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3) !important;
    }
    
    .step-text {
      flex: 1 !important;
      line-height: 1.6 !important;
      padding-top: 0.125rem !important;
    }
  }
  
  /* Style custom formatted bullets */
  .formatted-bullet {
    display: flex;
    align-items: flex-start;
    margin-bottom: 1rem;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .bullet-marker {
      color: #0ea5e9;
      font-weight: bold;
      font-size: 1.2rem;
      margin-right: 1rem;
      flex-shrink: 0;
      line-height: 1.6;
    }
    
    .bullet-text {
      flex: 1;
      line-height: 1.6;
    }
  }
  
  /* Style numbered lists (fallback) */
  ol {
    margin: 1.5rem 0;
    padding-left: 0;
    list-style: none;
    counter-reset: step-counter;
    
    li {
      margin-bottom: 1rem;
      padding-left: 3rem;
      position: relative;
      display: flex;
      align-items: flex-start;
      
      &:before {
        content: counter(step-counter) ".";
        counter-increment: step-counter;
        position: absolute;
        left: 0;
        top: 0;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border-radius: 50%;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.875rem;
        flex-shrink: 0;
      }
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
  
  /* Style bullet lists (fallback) */
  ul {
    margin: 1.5rem 0;
    padding-left: 2rem;
    
    li {
      margin-bottom: 0.75rem;
      padding-left: 0.75rem;
      position: relative;
      list-style: none;
      
      &:before {
        content: "•";
        position: absolute;
        left: -1.5rem;
        top: 0;
        color: #0ea5e9;
        font-weight: bold;
        font-size: 1.2rem;
      }
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
  
  /* Style headings in solution */
  h1, h2, h3, h4, h5, h6 {
    color: #ffffff;
    margin: 1.5rem 0 1rem 0;
    font-weight: 600;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 0.5rem;
    
    &:first-child {
      margin-top: 0;
    }
  }
  
  /* Style code blocks */
  code {
    background: rgba(0, 0, 0, 0.3);
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    color: #fbbf24;
  }
  
  /* Style emphasis */
  strong, b {
    color: #ffffff;
    font-weight: 600;
  }
  
  em, i {
    color: #c7d2fe;
    font-style: italic;
  }
  
  /* Style spans and breaks */
  span {
    display: block;
    margin-bottom: 0.5rem;
  }
  
  /* Style paragraphs for better readability */
  & > div {
    margin-bottom: 1rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const SimilarTicketsSection = styled(motion.div)`
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #3b82f6, transparent);
  }
`;

const TicketCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const TicketCardHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const SimilarityScore = styled.span`
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
`;

const ActionButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 48px;
  
  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #0ea5e9, #3b82f6);
    color: white;
    
    &:hover {
      box-shadow: 0 10px 30px rgba(14, 165, 233, 0.4);
      transform: translateY(-2px);
    }
  ` : props.variant === 'success' ? `
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    
    &:hover {
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
      transform: translateY(-2px);
    }
  ` : props.variant === 'danger' ? `
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    
    &:hover {
      box-shadow: 0 10px 30px rgba(239, 68, 68, 0.4);
      transform: translateY(-2px);
    }
  ` : `
    background: rgba(0, 0, 0, 0.1);
    color: #374151;
    border: 1px solid rgba(0, 0, 0, 0.2);
    
    &:hover {
      background: rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }
  `}
  
  &:active {
    transform: translateY(0);
  }
`;

const getIssueIcon = (issueType) => {
  switch (issueType) {
    case 'hardware': return <FaTools />;
    case 'software': return <FaBug />;
    case 'network': return <FaArrowUp />;
    case 'access': return <FaEnvelope />;
    default: return <FaExclamationTriangle />;
  }
};

function TicketResponse({ response, onNewTicket }) {
  const [showEscalation, setShowEscalation] = useState(false);
  const [escalationLoading, setEscalationLoading] = useState(false);
  const [regeneratingAI, setRegeneratingAI] = useState(false);
  const [currentResponse, setCurrentResponse] = useState(response);

  const handleRegenerateAI = async () => {
    setRegeneratingAI(true);
    try {
      const result = await axios.post('/api/tickets/regenerate', {
        ticket_id: currentResponse.ticket_id,
        original_issue: currentResponse.issue_description,
        user_name: currentResponse.user_name,
        department: currentResponse.department,
        reason: "User requested fresh AI solution"
      });
      
      setCurrentResponse(result.data);
      toast.success('New AI solution generated successfully!');
    } catch (error) {
      console.error('Regeneration error:', error);
      toast.error('Failed to generate new AI solution. Please try again.');
    } finally {
      setRegeneratingAI(false);
    }
  };

  const handleMarkResolved = async () => {
    try {
      await axios.post('/api/tickets/resolve', {
        ticket_id: currentResponse.ticket_id,
        user_name: currentResponse.user_name,
        department: currentResponse.department,
        solution_used: currentResponse.ai_generated_solution,
        response_source: currentResponse.response_source
      });
      
      toast.success('Thank you! Ticket marked as resolved successfully.');
    } catch (error) {
      console.error('Error marking ticket as resolved:', error);
      toast.error('Failed to mark ticket as resolved. Please try again.');
    }
  };

  const handleEscalation = async (escalationData) => {
    setEscalationLoading(true);
    try {
      await axios.post('/api/tickets/escalate', {
        ticket_id: currentResponse.ticket_id,
        user_name: currentResponse.user_name,
        department: currentResponse.department,
        original_issue: currentResponse.issue_description,
        attempted_solution: currentResponse.ai_generated_solution,
        additional_details: escalationData.additional_details
      });
      
      toast.success('Ticket escalated successfully! You will be contacted soon.');
      setShowEscalation(false);
    } catch (error) {
      console.error('Error escalating ticket:', error);
      toast.error('Failed to escalate ticket. Please try again.');
    } finally {
      setEscalationLoading(false);
    }
  };

  return (
    <ResponseContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <TicketHeader
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <TicketInfo>
          <InfoItem>
            <InfoLabel>Ticket ID</InfoLabel>
            <InfoValue>{currentResponse.ticket_id}</InfoValue>
          </InfoItem>
          
          <InfoItem>
            <InfoLabel>User</InfoLabel>
            <InfoValue>{currentResponse.user_name}</InfoValue>
          </InfoItem>
          
          <InfoItem>
            <InfoLabel>Department</InfoLabel>
            <InfoValue>{currentResponse.department.toUpperCase()}</InfoValue>
          </InfoItem>
          
          <InfoItem>
            <InfoLabel>Processing Time</InfoLabel>
            <InfoValue>{currentResponse.processing_time_ms}ms</InfoValue>
          </InfoItem>
        </TicketInfo>
        
        <TicketInfo>
          <InfoItem>
            <InfoLabel>Issue Type</InfoLabel>
            <TypeBadge>
              {getIssueIcon(currentResponse.issue_type)}
              {currentResponse.issue_type.charAt(0).toUpperCase() + currentResponse.issue_type.slice(1)}
            </TypeBadge>
          </InfoItem>
          
          <InfoItem>
            <InfoLabel>Urgency Level</InfoLabel>
            <StatusBadge type={currentResponse.urgency}>
              {currentResponse.urgency === 'critical' && <FaExclamationTriangle />}
              {currentResponse.urgency === 'high' && <FaExclamationTriangle />}
              {currentResponse.urgency === 'medium' && <FaClock />}
              {currentResponse.urgency === 'low' && <FaCheckCircle />}
              {currentResponse.urgency.charAt(0).toUpperCase() + currentResponse.urgency.slice(1)}
            </StatusBadge>
          </InfoItem>
          
          <InfoItem>
            <InfoLabel>Confidence Score</InfoLabel>
            <InfoValue>{Math.round(currentResponse.confidence_score * 100)}%</InfoValue>
          </InfoItem>
          
          <InfoItem>
            <InfoLabel>Response Source</InfoLabel>
            <SourceBadge source={currentResponse.response_source}>
              {(currentResponse.response_source === 'ai' || currentResponse.response_source === 'ai_regenerated') && <FaBrain />}
              {currentResponse.response_source === 'database' && <FaDatabase />}
              {currentResponse.response_source === 'fallback' && <FaRecycle />}
              {currentResponse.response_source === 'ai' && 'AI Generated'}
              {currentResponse.response_source === 'ai_regenerated' && 'AI Regenerated'}
              {currentResponse.response_source === 'database' && 'From Database'}
              {currentResponse.response_source === 'fallback' && 'Fallback'}
            </SourceBadge>
          </InfoItem>
          
          <InfoItem>
            <InfoLabel>Escalation Contact</InfoLabel>
            <InfoValue>{currentResponse.escalation_contact}</InfoValue>
          </InfoItem>
        </TicketInfo>
      </TicketHeader>

      <SolutionSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <SectionTitle>
          {(currentResponse.response_source === 'ai' || currentResponse.response_source === 'ai_regenerated') && <FaBrain />}
          {currentResponse.response_source === 'database' && <FaDatabase />}
          {currentResponse.response_source === 'fallback' && <FaRecycle />}
          {currentResponse.response_source === 'ai' && 'AI-Generated Solution'}
          {currentResponse.response_source === 'ai_regenerated' && 'Fresh AI-Generated Solution'}
          {currentResponse.response_source === 'database' && 'Solution from Database'}
          {currentResponse.response_source === 'fallback' && 'Fallback Solution'}
        </SectionTitle>
        <SolutionText>
          {formatSolutionText(currentResponse.ai_generated_solution)}
        </SolutionText>
        
        {/* Add regenerate button for database solutions */}
        {currentResponse.response_source === 'database' && (
          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <ActionButton
              onClick={handleRegenerateAI}
              disabled={regeneratingAI}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {regeneratingAI ? <FaSpinner /> : <FaMagic />}
              {regeneratingAI ? 'Generating...' : 'Generate Fresh AI Solution'}
            </ActionButton>
          </div>
        )}
      </SolutionSection>

      {currentResponse.similar_tickets && currentResponse.similar_tickets.length > 0 && (
        <SimilarTicketsSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <SectionTitle>
            <FaHistory />
            Similar Resolved Tickets
          </SectionTitle>
          
          {currentResponse.similar_tickets.map((ticket, index) => (
            <TicketCard
              key={ticket.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <TicketCardHeader>
                <div>
                  <strong>Ticket {ticket.id}</strong>
                  <p style={{ margin: '0.5rem 0', color: '#9ca3af' }}>
                    {ticket.description}
                  </p>
                </div>
                <SimilarityScore>
                  {Math.round(ticket.similarity_score * 100)}% match
                </SimilarityScore>
              </TicketCardHeader>
              
              <div style={{ color: '#e5e7eb', lineHeight: 1.6 }}>
                <strong>Resolution:</strong><br />
                <SolutionText style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  padding: '0.75rem 0 0 0',
                  marginTop: '0.75rem'
                }}>
                  {formatSolutionText(ticket.resolution)}
                </SolutionText>
              </div>
            </TicketCard>
          ))}
        </SimilarTicketsSection>
      )}

      <ActionButtons>
        <ActionButton
          variant="primary"
          onClick={onNewTicket}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FaPlus />
          Submit New Ticket
        </ActionButton>
        
        <ActionButton
          variant="success"
          onClick={handleMarkResolved}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FaCheckCircle />
          Issue Resolved
        </ActionButton>
        
        <ActionButton
          variant="danger"
          onClick={() => setShowEscalation(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FaArrowUp />
          Issue Not Resolved
        </ActionButton>
      </ActionButtons>

      <AnimatePresence>
        {showEscalation && (
          <EscalationForm
            onSubmit={handleEscalation}
            onCancel={() => setShowEscalation(false)}
            loading={escalationLoading}
          />
        )}
      </AnimatePresence>
    </ResponseContainer>
  );
}

export default TicketResponse;
