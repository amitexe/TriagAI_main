import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const OverlayContainer = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const LoginCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  
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

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s ease;
  
  &:hover {
    color: #1f2937;
    background: rgba(0, 0, 0, 0.1);
  }
`;

const LoginTitle = styled.h2`
  text-align: center;
  margin-bottom: 2rem;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  position: relative;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  z-index: 1;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  color: #1f2937;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #0ea5e9;
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
  }
  
  &::placeholder {
    color: #6b7280;
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  
  &:hover {
    color: #1f2937;
  }
`;

const LoginButton = styled(motion.button)`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #0ea5e9, #3b82f6);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 10px 30px rgba(14, 165, 233, 0.4);
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

function AdminLogin({ onClose, onLoginSuccess }) {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check credentials
      if (credentials.email === 'amit@support.com' && credentials.password === 'amit12345') {
        toast.success('Admin login successful!');
        onLoginSuccess();
        onClose();
      } else {
        toast.error('Invalid credentials. Please try again.');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <AnimatePresence>
      <OverlayContainer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <LoginCard
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
        >
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
          
          <LoginTitle>Admin Login</LoginTitle>
          
          <Form onSubmit={handleSubmit}>
            <InputGroup>
              <InputIcon>
                <FaUser />
              </InputIcon>
              <Input
                type="email"
                name="email"
                placeholder="Admin Email"
                value={credentials.email}
                onChange={handleInputChange}
                required
              />
            </InputGroup>
            
            <InputGroup>
              <InputIcon>
                <FaLock />
              </InputIcon>
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={credentials.password}
                onChange={handleInputChange}
                required
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </PasswordToggle>
            </InputGroup>
            
            <LoginButton
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </LoginButton>
          </Form>
        </LoginCard>
      </OverlayContainer>
    </AnimatePresence>
  );
}

export default AdminLogin;
