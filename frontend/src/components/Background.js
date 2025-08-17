import React from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';

const BackgroundContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
`;

const GradientBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #ffffff;
`;

// Bouncing ball animations
const bounce1 = keyframes`
  0% { transform: translate(0vw, 0vh); }
  25% { transform: translate(80vw, 20vh); }
  50% { transform: translate(70vw, 70vh); }
  75% { transform: translate(10vw, 80vh); }
  100% { transform: translate(0vw, 0vh); }
`;

const bounce2 = keyframes`
  0% { transform: translate(90vw, 10vh); }
  25% { transform: translate(20vw, 30vh); }
  50% { transform: translate(10vw, 60vh); }
  75% { transform: translate(85vw, 75vh); }
  100% { transform: translate(90vw, 10vh); }
`;

const bounce3 = keyframes`
  0% { transform: translate(50vw, 0vh); }
  25% { transform: translate(5vw, 40vh); }
  50% { transform: translate(80vw, 50vh); }
  75% { transform: translate(60vw, 85vh); }
  100% { transform: translate(50vw, 0vh); }
`;

const bounce4 = keyframes`
  0% { transform: translate(20vw, 90vh); }
  25% { transform: translate(75vw, 70vh); }
  50% { transform: translate(85vw, 20vh); }
  75% { transform: translate(30vw, 10vh); }
  100% { transform: translate(20vw, 90vh); }
`;

const bounce5 = keyframes`
  0% { transform: translate(70vw, 30vh); }
  25% { transform: translate(15vw, 15vh); }
  50% { transform: translate(40vw, 80vh); }
  75% { transform: translate(90vw, 60vh); }
  100% { transform: translate(70vw, 30vh); }
`;

const bounce6 = keyframes`
  0% { transform: translate(30vw, 50vh); }
  25% { transform: translate(80vw, 10vh); }
  50% { transform: translate(60vw, 85vh); }
  75% { transform: translate(5vw, 70vh); }
  100% { transform: translate(30vw, 50vh); }
`;

const bounce7 = keyframes`
  0% { transform: translate(95vw, 40vh); }
  25% { transform: translate(25vw, 80vh); }
  50% { transform: translate(15vw, 25vh); }
  75% { transform: translate(75vw, 5vh); }
  100% { transform: translate(95vw, 40vh); }
`;

const bounce8 = keyframes`
  0% { transform: translate(45vw, 95vh); }
  25% { transform: translate(10vw, 35vh); }
  50% { transform: translate(85vw, 55vh); }
  75% { transform: translate(55vw, 15vh); }
  100% { transform: translate(45vw, 95vh); }
`;

const BouncingBall = styled.div`
  position: absolute;
  border-radius: 50%;
  filter: blur(30px);
  opacity: 0.4;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
`;

const Ball1 = styled(BouncingBall)`
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(59, 130, 246, 0.1));
  border: 1px solid rgba(14, 165, 233, 0.2);
  animation: ${bounce1} 15s infinite;
  animation-delay: 0s;
`;

const Ball2 = styled(BouncingBall)`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));
  border: 1px solid rgba(16, 185, 129, 0.2);
  animation: ${bounce2} 18s infinite;
  animation-delay: -2s;
`;

const Ball3 = styled(BouncingBall)`
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1));
  border: 1px solid rgba(245, 158, 11, 0.2);
  animation: ${bounce3} 22s infinite;
  animation-delay: -5s;
`;

const Ball4 = styled(BouncingBall)`
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(190, 24, 93, 0.1));
  border: 1px solid rgba(236, 72, 153, 0.2);
  animation: ${bounce4} 20s infinite;
  animation-delay: -8s;
`;

const Ball5 = styled(BouncingBall)`
  width: 90px;
  height: 90px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.1));
  border: 1px solid rgba(139, 92, 246, 0.2);
  animation: ${bounce5} 16s infinite;
  animation-delay: -3s;
`;

const Ball6 = styled(BouncingBall)`
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(8, 145, 178, 0.1));
  border: 1px solid rgba(6, 182, 212, 0.2);
  animation: ${bounce6} 19s infinite;
  animation-delay: -6s;
`;

const Ball7 = styled(BouncingBall)`
  width: 110px;
  height: 110px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1));
  border: 1px solid rgba(239, 68, 68, 0.2);
  animation: ${bounce7} 21s infinite;
  animation-delay: -9s;
`;

const Ball8 = styled(BouncingBall)`
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, rgba(132, 204, 22, 0.1), rgba(101, 163, 13, 0.1));
  border: 1px solid rgba(132, 204, 22, 0.2);
  animation: ${bounce8} 17s infinite;
  animation-delay: -4s;
`;

const FloatingOrb = styled(motion.div)`
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.6;
`;


const GridPattern = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: radial-gradient(circle at 50% 50%, black 40%, transparent 80%);
`;

const NoiseOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E");
`;

function Background() {
  return (
    <BackgroundContainer>
      <GradientBackground />
      
      {/* Bouncing Balls */}
      <Ball1 />
      <Ball2 />
      <Ball3 />
      <Ball4 />
      <Ball5 />
      <Ball6 />
      <Ball7 />
      <Ball8 />
      
    </BackgroundContainer>
  );
}

export default Background;
