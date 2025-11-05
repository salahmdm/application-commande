import React from 'react';

/**
 * 🎨 Composant Card Ultra-Moderne
 * Design avec effets de verre, gradients et animations fluides
 */
const Card = ({ 
  children, 
  className = '', 
  padding = 'md',
  hover = false,
  variant = 'default',
  onClick,
  ...props 
}) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };
  
  const variants = {
    default: 'bg-white border border-slate-200/50 shadow-lg',
    glass: 'bg-white/80 backdrop-blur-md border border-white/20 shadow-xl',
    gradient: 'bg-gradient-to-br from-white to-slate-50 border border-slate-200/50 shadow-lg',
    elevated: 'bg-white border border-slate-200/50 shadow-xl',
    minimal: 'bg-slate-50 border border-slate-200/30 shadow-sm'
  };
  
  const hoverClass = hover 
    ? 'hover:shadow-xl hover:shadow-slate-200/50 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer hover:border-slate-300/50 transition-all duration-300' 
    : 'transition-all duration-300';
    
  const clickableClass = onClick ? 'cursor-pointer' : '';
  
  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl
        ${variants[variant]}
        ${paddings[padding]} 
        ${hoverClass} 
        ${clickableClass} 
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;