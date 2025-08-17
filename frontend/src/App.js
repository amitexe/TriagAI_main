import React, { useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import TicketForm from './components/TicketForm';
import TicketResponse from './components/TicketResponse';
import Header from './components/Header';
import Background from './components/Background';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background: #ffffff;
    color: #1f2937;
    min-height: 100vh;
    overflow-x: hidden;
  }

  html {
    scroll-behavior: smooth;
  }

  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #f8fafc;
  }

  ::-webkit-scrollbar-thumb {
    background: linear-gradient(45deg, #0ea5e9, #3b82f6);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(45deg, #0284c7, #2563eb);
  }
`;

const AppContainer = styled.div`
  min-height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  position: relative;
  z-index: 2;
`;

const ContentWrapper = styled(motion.div)`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

function App() {
  const [ticketResponse, setTicketResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const handleTicketSubmit = (response) => {
    setTicketResponse(response);
  };

  const handleNewTicket = () => {
    setTicketResponse(null);
  };

  const handleLoadingChange = (loading) => {
    setIsLoading(loading);
  };

  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true);
    setTicketResponse(null);
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setTicketResponse(null);
  };

  return (
    <>
      <GlobalStyle />
      <AppContainer>
        <Background />
        <Header onAdminClick={() => setShowAdminLogin(true)} showAdminButton={!isAdminLoggedIn} />
        <MainContent>
          <ContentWrapper
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatePresence mode="wait">
              {isAdminLoggedIn ? (
                <motion.div
                  key="admin-dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <AdminDashboard onLogout={handleAdminLogout} />
                </motion.div>
              ) : !ticketResponse ? (
                <motion.div
                  key="ticket-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <TicketForm 
                    onSubmit={handleTicketSubmit}
                    onLoadingChange={handleLoadingChange}
                    isLoading={isLoading}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="ticket-response"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <TicketResponse 
                    response={ticketResponse}
                    onNewTicket={handleNewTicket}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </ContentWrapper>
        </MainContent>
        
        {showAdminLogin && (
          <AdminLogin
            onClose={() => setShowAdminLogin(false)}
            onLoginSuccess={handleAdminLogin}
          />
        )}
      </AppContainer>
    </>
  );
}

export default App;
