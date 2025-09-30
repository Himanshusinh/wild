import React from 'react';
import { useCredits } from '@/hooks/useCredits';
import { formatCredits } from '@/utils/creditValidation';

interface CreditsDisplayProps {
  showIcon?: boolean;
  className?: string;
  showLabel?: boolean;
}

export const CreditsDisplay: React.FC<CreditsDisplayProps> = ({
  showIcon = true,
  className = '',
  showLabel = true,
}) => {
  const { creditBalance, loading, hasCredits, isLowOnCredits } = useCredits();

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && (
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
        )}
        {showLabel && (
          <span className="text-white/60 text-sm">Loading...</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-colors ${
            isLowOnCredits ? 'text-red-400' : hasCredits ? 'text-green-400' : 'text-white/60'
          }`}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M16.5 9.5l-5 5-2.5-2.5" />
        </svg>
      )}
      {showLabel && (
        <span
          className={`text-sm font-medium transition-colors ${
            isLowOnCredits ? 'text-red-400' : hasCredits ? 'text-green-400' : 'text-white/60'
          }`}
        >
          {formatCredits(creditBalance)} credits
        </span>
      )}
    </div>
  );
};

export default CreditsDisplay;
