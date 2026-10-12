import React from 'react';
import { LearnerMascot, MascotMood } from './LearnerMascot';

export type EngyMood = MascotMood;

interface EngyMascotProps {
  mood?: EngyMood;
  speechText?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  onClick?: () => void;
}

export const EngyMascot: React.FC<EngyMascotProps> = (props) => {
  return <LearnerMascot {...props} />;
};
