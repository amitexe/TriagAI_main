import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaHeadset, FaRobot, FaLightbulb, FaUserShield } from 'react-icons/fa';

const HeaderContainer = styled(motion.header)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 1.5rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const LogoIcon = styled(motion.div)`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #0ea5e9, #3b82f6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(14, 165, 233, 0.4);
  
  svg {
    color: white;
    font-size: 1.2rem;
  }
`;

const LogoText = styled.div`
  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #00d4ff, #0ea5e9);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    text-shadow: 0 0 30px rgba(0, 212, 255, 0.3);
  }
  
  p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
    font-weight: 400;
  }
`;

const StatusIndicators = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const StatusItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.status === 'online' ? '#10b981' : '#ef4444'};
  box-shadow: 0 0 8px ${props => props.status === 'online' ? '#10b981' : '#ef4444'};
`;

const AdminButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 10px 30px rgba(124, 58, 237, 0.4);
    transform: translateY(-2px);
  }
  
  svg {
    font-size: 1rem;
  }
`;

function Header({ onAdminClick, showAdminButton = true }) {
  return (
    <HeaderContainer
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <HeaderContent>
        <Logo>
          <LogoIcon
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaHeadset />
          </LogoIcon>
          <LogoText>
            <h1>TriageAI</h1>
            <p>AI-Powered Support</p>
          </LogoText>
        </Logo>
        
        <StatusIndicators>
          <StatusItem
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <FaRobot />
            <StatusDot status="online" />
            AI Online
          </StatusItem>
          
          <StatusItem
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <FaLightbulb />
            <StatusDot status="online" />
            Smart Search
          </StatusItem>
          
          {showAdminButton && (
            <AdminButton
              onClick={onAdminClick}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaUserShield />
              Admin Login
            </AdminButton>
          )}
        </StatusIndicators>
      </HeaderContent>
    </HeaderContainer>
  );
}

export default Header;
