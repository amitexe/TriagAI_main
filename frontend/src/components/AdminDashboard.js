import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaHistory, 
  FaArrowUp,
  FaSignOutAlt,
  FaTicketAlt,
  FaUser,
  FaClock,
  FaFilter,
  FaSearch
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-hot-toast';

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

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const DashboardTitle = styled.h1`
  color: #1f2937;
  font-size: 2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const LogoutButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 10px 30px rgba(239, 68, 68, 0.4);
    transform: translateY(-2px);
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(motion.div)`
  background: rgba(0, 0, 0, 0.02);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StatIcon = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  
  ${props => props.type === 'resolved' && `
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  `}
  
  ${props => props.type === 'escalated' && `
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
  `}
  
  ${props => props.type === 'total' && `
    background: linear-gradient(135deg, #0ea5e9, #3b82f6);
    color: white;
  `}
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
`;

const StatLabel = styled.div`
  color: #9ca3af;
  font-size: 0.875rem;
  margin-top: 0.25rem;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
`;

const Tab = styled.button`
  background: none;
  border: none;
  color: ${props => props.active ? '#0ea5e9' : '#9ca3af'};
  font-size: 1rem;
  font-weight: 600;
  padding: 1rem 1.5rem;
  cursor: pointer;
  border-bottom: 2px solid ${props => props.active ? '#0ea5e9' : 'transparent'};
  transition: all 0.3s ease;
  
  &:hover {
    color: #0ea5e9;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 250px;
  padding: 0.75rem 1rem 0.75rem 3rem;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  color: #1f2937;
  font-size: 1rem;
  position: relative;
  
  &:focus {
    outline: none;
    border-color: #0ea5e9;
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
  }
  
  &::placeholder {
    color: #6b7280;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 250px;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
`;

const FilterSelect = styled.select`
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  color: #1f2937;
  font-size: 1rem;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #0ea5e9;
  }
  
  option {
    background: #ffffff;
    color: #1f2937;
  }
`;

const TicketsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TicketCard = styled(motion.div)`
  background: rgba(0, 0, 0, 0.02);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
`;

const TicketHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: flex-start;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const TicketInfo = styled.div`
  flex: 1;
`;

const TicketId = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const TicketMeta = styled.div`
  display: flex;
  gap: 1rem;
  color: #9ca3af;
  font-size: 0.875rem;
  flex-wrap: wrap;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 600;
  
  ${props => props.status === 'resolved' && `
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  `}
  
  ${props => props.status === 'escalated' && `
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
  `}
`;

const TicketDescription = styled.div`
  color: #374151;
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const TicketSolution = styled.div`
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 1rem;
  color: #374151;
  line-height: 1.6;
  font-size: 0.875rem;
  
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

function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('resolved');
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    escalated: 0
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, activeTab, searchTerm, departmentFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/tickets');
      setTickets(response.data.tickets);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = tickets.filter(ticket => 
      activeTab === 'resolved' ? ticket.status === 'resolved' : ticket.status === 'escalated'
    );

    if (searchTerm) {
      filtered = filtered.filter(ticket => 
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.issue_description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.department === departmentFilter);
    }

    setFilteredTickets(filtered);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <DashboardContainer>
      <DashboardHeader>
        <DashboardTitle>
          <FaTicketAlt />
          Admin Dashboard
        </DashboardTitle>
        <LogoutButton
          onClick={onLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FaSignOutAlt />
          Logout
        </LogoutButton>
      </DashboardHeader>

      <StatsContainer>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatIcon type="total">
            <FaTicketAlt />
          </StatIcon>
          <StatContent>
            <StatNumber>{stats.total}</StatNumber>
            <StatLabel>Total Tickets</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatIcon type="resolved">
            <FaCheckCircle />
          </StatIcon>
          <StatContent>
            <StatNumber>{stats.resolved}</StatNumber>
            <StatLabel>Resolved Tickets</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatIcon type="escalated">
            <FaArrowUp />
          </StatIcon>
          <StatContent>
            <StatNumber>{stats.escalated}</StatNumber>
            <StatLabel>Escalated Tickets</StatLabel>
          </StatContent>
        </StatCard>
      </StatsContainer>

      <TabContainer>
        <Tab 
          active={activeTab === 'resolved'} 
          onClick={() => setActiveTab('resolved')}
        >
          <FaCheckCircle style={{ marginRight: '0.5rem' }} />
          Resolved Tickets ({stats.resolved})
        </Tab>
        <Tab 
          active={activeTab === 'escalated'} 
          onClick={() => setActiveTab('escalated')}
        >
          <FaArrowUp style={{ marginRight: '0.5rem' }} />
          Escalated Tickets ({stats.escalated})
        </Tab>
      </TabContainer>

      <FilterContainer>
        <SearchContainer>
          <SearchIcon>
            <FaSearch />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search tickets by ID, user, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>
        
        <FilterSelect
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
        >
          <option value="all">All Departments</option>
          <option value="it">IT</option>
          <option value="hr">HR</option>
          <option value="finance">Finance</option>
          <option value="operations">Operations</option>
          <option value="sales">Sales</option>
          <option value="marketing">Marketing</option>
        </FilterSelect>
      </FilterContainer>

      <TicketsContainer>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
            Loading tickets...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
            No tickets found for the current filter.
          </div>
        ) : (
          filteredTickets.map((ticket, index) => (
            <TicketCard
              key={ticket.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <TicketHeader>
                <TicketInfo>
                  <TicketId>Ticket {ticket.id}</TicketId>
                  <TicketMeta>
                    <span><FaUser /> {ticket.user_name}</span>
                    <span>• {ticket.department.toUpperCase()}</span>
                    <span>• <FaClock /> {formatDate(ticket.created_at)}</span>
                  </TicketMeta>
                </TicketInfo>
                <StatusBadge status={ticket.status}>
                  {ticket.status === 'resolved' ? <FaCheckCircle /> : <FaArrowUp />}
                  {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                </StatusBadge>
              </TicketHeader>
              
              <TicketDescription>
                <strong>Issue:</strong> {ticket.issue_description}
              </TicketDescription>
              
              {ticket.solution && (
                <TicketSolution>
                  <strong>Solution:</strong><br />
                  <div style={{ marginTop: '0.75rem' }}>
                    {formatSolutionText(ticket.solution)}
                  </div>
                </TicketSolution>
              )}
              
              {ticket.escalation_details && (
                <TicketSolution>
                  <strong>Escalation Details:</strong><br />
                  <div style={{ marginTop: '0.75rem' }}>
                    {formatSolutionText(ticket.escalation_details)}
                  </div>
                </TicketSolution>
              )}
            </TicketCard>
          ))
        )}
      </TicketsContainer>
    </DashboardContainer>
  );
}

export default AdminDashboard;
