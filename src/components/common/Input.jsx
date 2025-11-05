import React from 'react';

/**
 * 🎨 Composant Input Ultra-Moderne
 * Design avec effets de focus élégants et animations fluides
 */
const Input = ({ 
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  icon,
  disabled = false,
  required = false,
  className = '',
  variant = 'default',
  ...props 
}) => {
  const variants = {
    default: 'bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-500',
    glass: 'bg-white/50 backdrop-blur-sm border-white/30 focus:border-purple-400 focus:ring-purple-400',
    minimal: 'bg-slate-50 border-slate-200 focus:border-purple-500 focus:ring-purple-500',
    filled: 'bg-slate-100 border-slate-200 focus:border-purple-500 focus:ring-purple-500'
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-2 transition-colors duration-200">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-200 group-focus-within:text-purple-500">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full px-4 py-3 rounded-xl 
            border-2 transition-all duration-200
            text-slate-900 placeholder-slate-400
            focus:outline-none focus:ring-2 focus:ring-offset-2
            disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-500
            min-h-12 font-medium
            ${icon ? 'pl-12' : ''}
            ${variants[variant]}
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
            hover:border-slate-400
          `}
          {...props}
        />
        
        {/* Effet de brillance au focus */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-purple-500/10 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>
      
      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600 font-medium animate-fade-in-up">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};

export default Input;