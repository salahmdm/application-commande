/**
 * Composant d'indicateur d'état pour les boutons d'action
 * Montre visuellement quelle section est active
 */

import React from 'react';

/**
 * Indicateur d'état avec animation
 */
const StatusIndicator = ({ 
  isActive = false, 
  variant = 'primary',
  size = 'md',
  className = '' 
}) => {
  const baseClasses = 'absolute rounded-full transition-all duration-300';
  
  const variants = {
    primary: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    secondary: 'bg-gray-500'
  };
  
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };
  
  const positions = {
    sm: 'top-2 right-2',
    md: 'top-3 right-3',
    lg: 'top-4 right-4'
  };

  if (!isActive) return null;

  return (
    <div className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${positions[size]} ${className}`}>
      {/* Effet de pulsation */}
      <div className={`absolute inset-0 ${variants[variant]} rounded-full animate-ping opacity-75`}></div>
      
      {/* Point central */}
      <div className={`relative ${variants[variant]} rounded-full ${sizes[size]}`}></div>
    </div>
  );
};

/**
 * Indicateur de progression avec étapes
 */
const ProgressIndicator = ({ 
  currentStep = 0, 
  totalSteps = 3,
  variant = 'primary',
  className = '' 
}) => {
  const baseClasses = 'flex items-center gap-2';
  
  const variants = {
    primary: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    secondary: 'bg-gray-500'
  };

  return (
    <div className={`${baseClasses} ${className}`}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            index <= currentStep 
              ? `${variants[variant]} animate-pulse` 
              : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  );
};

/**
 * Badge de notification avec compteur
 */
const NotificationBadge = ({ 
  count = 0, 
  variant = 'danger',
  maxCount = 99,
  className = '' 
}) => {
  const baseClasses = 'absolute -top-2 -right-2 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg';
  
  const variants = {
    primary: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    secondary: 'bg-gray-500'
  };
  
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7'
  };

  if (count === 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <div className={`${baseClasses} ${variants[variant]} ${sizes.md} ${className}`}>
      {displayCount}
    </div>
  );
};

/**
 * Indicateur de chargement avec animation
 */
const LoadingIndicator = ({ 
  variant = 'primary',
  size = 'md',
  className = '' 
}) => {
  const baseClasses = 'animate-spin rounded-full border-solid';
  
  const variants = {
    primary: 'border-blue-500',
    success: 'border-green-500',
    warning: 'border-yellow-500',
    danger: 'border-red-500',
    secondary: 'border-gray-500'
  };
  
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}>
      <div className={`${baseClasses} ${variants[variant]} ${sizes[size]} border-t-transparent`}></div>
    </div>
  );
};

export { 
  StatusIndicator, 
  ProgressIndicator, 
  NotificationBadge, 
  LoadingIndicator 
};
export default StatusIndicator;
