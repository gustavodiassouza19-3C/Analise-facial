import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export default function Button({ 
  children, 
  onClick, 
  className = '', 
  variant = 'primary', 
  disabled = false 
}: ButtonProps) {
  const isDisabled = disabled;

  let baseClass = '';

  if (variant === 'primary') {
    baseClass = `px-6 py-3 bg-[#D3AB39] text-[#00090b] font-semibold rounded-lg ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 transition'}`;
  } else if (variant === 'secondary') {
    baseClass = `px-6 py-3 bg-black/40 border border-white/10 text-[#a1a1a1] rounded-lg ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-white hover:border-white/20 transition'}`;
  }

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseClass} ${className}`}
    >
      {children}
    </button>
  );
}