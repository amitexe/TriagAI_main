import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaTimes, FaArrowUp, FaSpinner, FaCommentDots } from 'react-icons/fa';

const EscalationOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`;

const EscalationModal = styled(motion.div)`
  background: rgba(15, 15, 15, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #ef4444, transparent);
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CloseButton = styled(motion.button)`
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const EscalationForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #e5e7eb;
  font-size: 0.95rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #ffffff;
  font-size: 1rem;
  min-height: 120px;
  resize: vertical;
  transition: all 0.3s ease;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #ef4444;
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
    background: rgba(255, 255, 255, 0.08);
  }
  
  &::placeholder {
    color: #6b7280;
  }
`;

const InfoBox = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 1rem;
  color: #fecaca;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  justify-content: flex-end;
`;

const Button = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 48px;
  
  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    
    &:hover {
      box-shadow: 0 10px 30px rgba(239, 68, 68, 0.4);
      transform: translateY(-2px);
    }
  ` : `
    background: rgba(255, 255, 255, 0.1);
    color: #e5e7eb;
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }
  `}
  
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

function EscalationForm({ onSubmit, onCancel, loading }) {
  const [additionalDetails, setAdditionalDetails] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!additionalDetails.trim()) {
      return;
    }
    
    onSubmit({
      additional_details: additionalDetails.trim()
    });
  };

  return (
    <EscalationOverlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <EscalationModal
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        <ModalHeader>
          <ModalTitle>
            <FaArrowUp />
            Escalate Ticket
          </ModalTitle>
          <CloseButton
            onClick={onCancel}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaTimes />
          </CloseButton>
        </ModalHeader>

        <InfoBox>
          <strong>Why escalate?</strong><br />
          If the suggested solution didn't resolve your issue, we'll escalate your ticket to a human expert who can provide additional assistance.
        </InfoBox>

        <EscalationForm onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="additional_details">
              Additional Details (Optional)
            </Label>
            <TextArea
              id="additional_details"
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder="Please provide any additional information about your issue, what you've tried, or any specific requirements..."
              disabled={loading}
            />
          </div>

          <ButtonGroup>
            <Button
              type="button"
              onClick={onCancel}
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading ? (
                <LoadingSpinner>
                  <FaSpinner />
                  Escalating...
                </LoadingSpinner>
              ) : (
                <>
                  <FaCommentDots />
                  Escalate to Expert
                </>
              )}
            </Button>
          </ButtonGroup>
        </EscalationForm>
      </EscalationModal>
    </EscalationOverlay>
  );
}

export default EscalationForm;
