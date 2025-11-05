import React from 'react';

/**
 * 🎨 Composant Button Ultra-Moderne
 * Design avec gradients, effets de brillance et animations fluides
 */
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  disabled = false,
  loading = false,
  icon = null,
  onClick,
  type = 'button',
  className = '',
  ariaLabel,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-3 font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 relative overflow-hidden group';
  
  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 focus:ring-purple-500 shadow-lg hover:shadow-xl hover:shadow-purple-500/25 hover:-translate-y-0.5',
    
    secondary: 'bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800 focus:ring-slate-500 shadow-md hover:shadow-lg hover:-translate-y-0.5',
    
    success: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 focus:ring-emerald-500 shadow-md hover:shadow-lg hover:-translate-y-0.5',
    
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 focus:ring-red-500 shadow-md hover:shadow-lg hover:-translate-y-0.5',
    
    warning: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 focus:ring-amber-500 shadow-md hover:shadow-lg hover:-translate-y-0.5',
    
    outline: 'border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white focus:ring-purple-500 bg-transparent hover:-translate-y-0.5',
    
    ghost: 'text-slate-700 hover:bg-slate-100 focus:ring-slate-500 hover:-translate-y-0.5',
    
    glass: 'bg-white/20 backdrop-blur-md border border-white/30 text-slate-800 hover:bg-white/30 focus:ring-slate-500 shadow-lg hover:shadow-xl'
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-10',
    md: 'px-6 py-3 text-base min-h-12',
    lg: 'px-8 py-4 text-lg min-h-14',
    xl: 'px-10 py-5 text-xl min-h-16'
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      aria-label={ariaLabel}
      {...props}
    >
      {/* Effet de brillance au survol */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
      
      {/* Contenu du bouton */}
      <div className="relative z-10 flex items-center gap-2">
        {loading && (
          <div className="spinner-modern w-4 h-4"></div>
        )}
        {icon && !loading && (
          <span className="transition-transform duration-200 group-hover:scale-110">
            {icon}
          </span>
        )}
        <span className="transition-all duration-200 group-hover:font-semibold">
          {children}
        </span>
      </div>
    </button>
  );
};

export default Button;