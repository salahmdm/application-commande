import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * 🎨 Composant Modal Ultra-Moderne
 * Design avec effets de verre, animations fluides et backdrop élégant
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  variant = 'default'
}) => {
  console.log('🔧 Modal render - isOpen:', isOpen, 'title:', title);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  const sizes = {
    sm: 'sm:max-w-lg',
    md: 'sm:max-w-2xl',
    lg: 'sm:max-w-4xl',
    xl: 'sm:max-w-6xl',
    full: 'max-w-full mx-4'
  };

  const variants = {
    default: 'bg-white border-slate-200/50 shadow-xl',
    glass: 'bg-white/90 backdrop-blur-xl border-white/20 shadow-2xl',
    dark: 'bg-slate-900 border-slate-700 shadow-2xl text-white'
  };
  
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{ 
        zIndex: 999999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        isolation: 'isolate'
      }}
    >
      <div 
        className={`
          rounded-3xl 
          w-full 
          ${sizes[size]} 
          max-h-[90vh] 
          overflow-hidden 
          flex flex-col
          animate-scale-in
          ${variants[variant]}
          relative
        `}
        style={{ 
          zIndex: 1000000,
          position: 'relative',
          isolation: 'isolate'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header avec gradient */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-white">
            <h2 id="modal-title" className="text-2xl font-bold text-slate-900 gradient-text">
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100 transition-all duration-200 hover:scale-110 active:scale-95 group"
                aria-label="Fermer"
              >
                <X className="w-6 h-6 text-slate-600 group-hover:text-slate-900 transition-colors duration-200" />
              </button>
            )}
          </div>
        )}
        
        {/* Content avec scrollbar moderne */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;