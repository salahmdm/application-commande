/**
 * Composant de bouton d'action avec feedback visuel
 * Boutons modernes avec animations et états de chargement
 */

import React, { useState } from 'react';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

/**
 * Bouton d'action avec états de feedback
 */
const ActionButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  success = false,
  error = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const baseClasses = 'relative overflow-hidden transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-300',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-300',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-300',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-300'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-xl'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const getStateIcon = () => {
    if (loading) return <Loader2 className={`${iconSizes[size]} animate-spin`} />;
    if (success) return <CheckCircle className={`${iconSizes[size]} text-green-400`} />;
    if (error) return <XCircle className={`${iconSizes[size]} text-red-400`} />;
    return Icon ? <Icon className={iconSizes[size]} /> : null;
  };

  const getStateClasses = () => {
    if (success) return 'bg-green-600 hover:bg-green-700';
    if (error) return 'bg-red-600 hover:bg-red-700';
    return variants[variant];
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        ${baseClasses} ${getStateClasses()} ${sizes[size]} ${className}
        ${isPressed ? 'scale-95' : 'hover:scale-105'}
        ${success ? 'animate-pulse' : ''}
        ${error ? 'animate-pulse' : ''}
      `}
      {...props}
    >
      {/* Effet de brillance au survol */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700"></div>
      
      {/* Contenu du bouton */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {getStateIcon()}
        <span className="font-medium">{children}</span>
      </div>
      
      {/* Indicateur de progression pour le chargement */}
      {loading && (
        <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
          <div className="h-full bg-white animate-pulse"></div>
        </div>
      )}
    </button>
  );
};

/**
 * Bouton de confirmation avec double validation
 */
const ConfirmButton = ({
  children,
  onConfirm,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger',
  size = 'md',
  className = '',
  ...props
}) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleClick = () => {
    if (!isConfirming) {
      setIsConfirming(true);
      // Auto-annulation après 3 secondes
      setTimeout(() => setIsConfirming(false), 3000);
    } else {
      onConfirm();
      setIsConfirming(false);
    }
  };

  return (
    <ActionButton
      onClick={handleClick}
      variant={isConfirming ? 'success' : variant}
      size={size}
      className={className}
      {...props}
    >
      {isConfirming ? confirmText : children}
    </ActionButton>
  );
};

/**
 * Bouton avec animation de succès
 */
const SuccessButton = ({
  children,
  onClick,
  successMessage = 'Succès !',
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const [state, setState] = useState('idle'); // idle, loading, success

  const handleClick = async () => {
    setState('loading');
    
    try {
      await onClick();
      setState('success');
      
      // Retour à l'état initial après 2 secondes
      setTimeout(() => setState('idle'), 2000);
    } catch (error) {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    }
  };

  return (
    <ActionButton
      onClick={handleClick}
      variant={variant}
      size={size}
      loading={state === 'loading'}
      success={state === 'success'}
      error={state === 'error'}
      className={className}
      {...props}
    >
      {state === 'success' ? successMessage : children}
    </ActionButton>
  );
};

/**
 * Bouton avec compteur de clics
 */
const CounterButton = ({
  children,
  onClick,
  maxClicks = 3,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount >= maxClicks) {
      onClick();
      setClickCount(0);
    }
  };

  return (
    <ActionButton
      onClick={handleClick}
      variant={clickCount > 0 ? 'warning' : variant}
      size={size}
      className={className}
      {...props}
    >
      {clickCount > 0 ? `${clickCount}/${maxClicks}` : children}
    </ActionButton>
  );
};

export { 
  ActionButton, 
  ConfirmButton, 
  SuccessButton, 
  CounterButton 
};
export default ActionButton;
