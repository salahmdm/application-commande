/**
 * Composant de bouton moderne pour les actions principales
 * Design avec effets visuels avancés et animations
 */

import React from 'react';

/**
 * Bouton moderne avec effets visuels
 */
const ModernActionButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  subtitle,
  className = '',
  disabled = false,
  ...props
}) => {
  const baseClasses = 'group relative overflow-hidden backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';
  
  const variants = {
    primary: 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white border border-blue-400/30 shadow-xl hover:shadow-2xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-800',
    success: 'bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white border border-green-400/30 shadow-xl hover:shadow-2xl hover:from-green-600 hover:via-green-700 hover:to-green-800',
    warning: 'bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-700 text-white border border-yellow-400/30 shadow-xl hover:shadow-2xl hover:from-yellow-600 hover:via-yellow-700 hover:to-yellow-800',
    danger: 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white border border-red-400/30 shadow-xl hover:shadow-2xl hover:from-red-600 hover:via-red-700 hover:to-red-800',
    secondary: 'bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700 text-white border border-gray-400/30 shadow-xl hover:shadow-2xl hover:from-gray-600 hover:via-gray-700 hover:to-gray-800'
  };
  
  const sizes = {
    sm: 'px-4 py-2 rounded-xl gap-2',
    md: 'px-6 py-3 rounded-2xl gap-3',
    lg: 'px-8 py-4 rounded-2xl gap-4'
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {/* Effet de brillance au survol */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
      
      {/* Effet de particules */}
      <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-2 left-4 w-1 h-1 bg-white/60 rounded-full animate-ping"></div>
        <div className="absolute top-4 right-6 w-1 h-1 bg-white/40 rounded-full animate-ping animation-delay-200"></div>
        <div className="absolute bottom-3 left-8 w-1 h-1 bg-white/50 rounded-full animate-ping animation-delay-400"></div>
      </div>
      
      <div className="relative z-10 flex items-center gap-3">
        {Icon && (
          <div className={`p-1.5 bg-white/20 rounded-lg ${size === 'lg' ? 'p-2' : ''}`}>
            <Icon className={iconSizes[size]} />
          </div>
        )}
        
        <div className="flex flex-col items-start">
          <span className={`font-heading font-bold leading-tight ${
            size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'
          }`}>
            {children}
          </span>
          {subtitle && (
            <span className="text-xs opacity-90 font-medium">
              {subtitle}
            </span>
          )}
        </div>
      </div>
      
      {/* Indicateur d'état actif avec animation */}
      <div className="absolute top-3 right-3 w-3 h-3 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:animate-pulse"></div>
      
      {/* Bordure lumineuse */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
        variant === 'primary' ? 'bg-gradient-to-r from-blue-400/20 to-blue-600/20' :
        variant === 'success' ? 'bg-gradient-to-r from-green-400/20 to-green-600/20' :
        variant === 'warning' ? 'bg-gradient-to-r from-yellow-400/20 to-yellow-600/20' :
        variant === 'danger' ? 'bg-gradient-to-r from-red-400/20 to-red-600/20' :
        'bg-gradient-to-r from-gray-400/20 to-gray-600/20'
      }`}></div>
    </button>
  );
};

/**
 * Bouton compact pour mobile
 */
const CompactActionButton = ({
  children,
  onClick,
  variant = 'primary',
  icon: Icon,
  className = '',
  disabled = false,
  ...props
}) => {
  const baseClasses = 'group relative overflow-hidden backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';
  
  const variants = {
    primary: 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white border border-blue-400/30 shadow-lg hover:shadow-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-800',
    success: 'bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white border border-green-400/30 shadow-lg hover:shadow-xl hover:from-green-600 hover:via-green-700 hover:to-green-800',
    warning: 'bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-700 text-white border border-yellow-400/30 shadow-lg hover:shadow-xl hover:from-yellow-600 hover:via-yellow-700 hover:to-yellow-800',
    danger: 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white border border-red-400/30 shadow-lg hover:shadow-xl hover:from-red-600 hover:via-red-700 hover:to-red-800',
    secondary: 'bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700 text-white border border-gray-400/30 shadow-lg hover:shadow-xl hover:from-gray-600 hover:via-gray-700 hover:to-gray-800'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} px-4 py-3 rounded-xl flex items-center gap-2 ${className}`}
      {...props}
    >
      {/* Effet de brillance */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
      
      <div className="relative z-10 flex items-center gap-2">
        {Icon && (
          <div className="p-1 bg-white/20 rounded-lg">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <span className="text-xs font-bold">{children}</span>
      </div>
    </button>
  );
};

export { ModernActionButton, CompactActionButton };
export default ModernActionButton;
