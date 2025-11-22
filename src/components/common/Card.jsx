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
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6 lg:p-7',
    lg: 'p-4 sm:p-6 md:p-8 lg:p-9',
    xl: 'p-5 sm:p-8 md:p-10 lg:p-12'
  };
  
  // Support pour padding responsive (ex: "sm sm:md md:lg")
  const getPaddingClasses = (padding) => {
    if (!padding) return '';
    
    // Si le padding contient des espaces, c'est une chaîne responsive
    if (padding.includes(' ')) {
      // Parser la chaîne "sm sm:md md:lg" en classes Tailwind
      return padding.split(' ').map(p => {
        const parts = p.split(':');
        if (parts.length === 1) {
          // Classe de base (ex: "sm")
          return paddings[parts[0]] || '';
        } else if (parts.length === 2) {
          // Classe responsive (ex: "sm:md")
          const breakpoint = parts[0];
          const size = parts[1];
          const basePadding = paddings[size] || '';
          // Remplacer p- par le breakpoint approprié
          return basePadding.replace(/^p-/, `${breakpoint}:p-`);
        }
        return '';
      }).filter(Boolean).join(' ');
    }
    
    // Padding simple
    return paddings[padding] || '';
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
        rounded-xl sm:rounded-2xl
        ${variants[variant]}
        ${getPaddingClasses(padding)} 
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