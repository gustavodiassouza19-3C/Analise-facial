import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-[#09090b]/50 border border-[#09090b]/80 rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
}