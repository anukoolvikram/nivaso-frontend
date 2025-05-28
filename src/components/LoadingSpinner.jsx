// src/components/LoadingSpinner.jsx
import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';

export default function LoadingSpinner({ size = 32, color = 'inherit', className = '' }) {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <CircularProgress size={size} color={color} />
    </div>
  );
}
