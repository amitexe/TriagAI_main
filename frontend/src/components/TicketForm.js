import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaUser, FaBuilding, FaClipboardList, FaPaperPlane, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const FormContainer = styled(motion.div)`
  max-width: 800px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #0ea5e9, #3b82f6, transparent);
  }
`;

const FormTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #1f2937, #374151);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const FormSubtitle = styled.p`
  text-align: center;
  color: #6b7280;
  margin-bottom: 2.5rem;
  font-size: 1.1rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  position: relative;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #e5e7eb;
  font-size: 0.95rem;
`;

const InputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  color: #6b7280;
  font-size: 1.1rem;
  z-index: 2;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  color: #1f2937;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #0ea5e9;
    box-shadow: 0 0 20px rgba(14, 165, 233, 0.2);
    background: rgba(0, 0, 0, 0.05);
  }
  
  &::placeholder {
    color: #6b7280;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  color: #1f2937;
  font-size: 1rem;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #0ea5e9;
    box-shadow: 0 0 20px rgba(14, 165, 233, 0.2);
    background: rgba(0, 0, 0, 0.05);
  }
  
  option {
    background: #ffffff;
    color: #1f2937;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  color: #1f2937;
  font-size: 1rem;
  min-height: 120px;
  resize: vertical;
  transition: all 0.3s ease;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #0ea5e9;
    box-shadow: 0 0 20px rgba(14, 165, 233, 0.2);
    background: rgba(0, 0, 0, 0.05);
  }
  
  &::placeholder {
    color: #6b7280;
  }
`;

const SubmitButton = styled(motion.button)`
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  color: #1e293b;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  margin-top: 1rem;
  min-height: 56px;
  
  &:hover {
    box-shadow: 0 10px 30px rgba(248, 250, 252, 0.3);
    transform: translateY(-2px);
    background: linear-gradient(135deg, #ffffff, #f1f5f9);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const LoadingSpinner = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  svg {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const departments = [
  { value: 'it', label: 'Information Technology' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'finance', label: 'Finance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'operations', label: 'Operations' },
  { value: 'support', label: 'Support' },
  { value: 'other', label: 'Other' }
];

function TicketForm({ onSubmit, onLoadingChange, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    issue_description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.department || !formData.issue_description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.issue_description.trim().length < 10) {
      toast.error('Please provide a more detailed description (at least 10 characters)');
      return;
    }

    onLoadingChange(true);
    
    try {
      const response = await axios.post('/api/tickets/submit', formData);
      toast.success('Ticket submitted successfully!');
      onSubmit(response.data);
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit ticket. Please try again.');
    } finally {
      onLoadingChange(false);
    }
  };

  return (
    <FormContainer
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <FormTitle>Submit Support Ticket</FormTitle>
      <FormSubtitle>
        Describe your issue and our AI assistant will help find the best solution
      </FormSubtitle>
      
      <Form onSubmit={handleSubmit}>
        <InputGroup>
          <Label htmlFor="name">Full Name</Label>
          <InputContainer>
            <InputIcon><FaUser /></InputIcon>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              disabled={isLoading}
            />
          </InputContainer>
        </InputGroup>

        <InputGroup>
          <Label htmlFor="department">Department</Label>
          <InputContainer>
            <InputIcon><FaBuilding /></InputIcon>
            <Select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="">Select your department</option>
              {departments.map(dept => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </Select>
          </InputContainer>
        </InputGroup>

        <InputGroup>
          <Label htmlFor="issue_description">Issue Description</Label>
          <InputContainer>
            <InputIcon style={{ top: '1rem', alignItems: 'flex-start' }}>
              <FaClipboardList />
            </InputIcon>
            <TextArea
              id="issue_description"
              name="issue_description"
              value={formData.issue_description}
              onChange={handleChange}
              placeholder="Please describe your issue in detail. Include any error messages, when the problem started, and what you were trying to do..."
              disabled={isLoading}
            />
          </InputContainer>
        </InputGroup>

        <SubmitButton
          type="submit"
          disabled={isLoading}
          whileHover={!isLoading ? { scale: 1.02 } : {}}
          whileTap={!isLoading ? { scale: 0.98 } : {}}
        >
          {isLoading ? (
            <LoadingSpinner>
              <FaSpinner />
              Processing...
            </LoadingSpinner>
          ) : (
            <>
              <FaPaperPlane />
              Submit Ticket
            </>
          )}
        </SubmitButton>
      </Form>
    </FormContainer>
  );
}

export default TicketForm;
