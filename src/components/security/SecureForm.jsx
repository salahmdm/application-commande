/**
 * Composant de validation de formulaires sécurisé
 * Protection contre les attaques et validation côté client
 */

import React, { useState, useEffect } from 'react';
import { InputValidator, XSSProtection } from '../../services/secureAuthService';

/**
 * Hook de validation de formulaire sécurisé
 */
export const useSecureForm = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Valider un champ spécifique
   */
  const validateField = (name, value) => {
    const rule = validationRules[name];
    if (!rule) return null;

    // Vérifier si le champ est requis
    if (rule.required && (!value || value.trim() === '')) {
      return `${rule.label} est requis`;
    }

    // Vérifier la longueur minimale
    if (value && rule.minLength && value.length < rule.minLength) {
      return `Minimum ${rule.minLength} caractères requis`;
    }

    // Vérifier la longueur maximale
    if (value && rule.maxLength && value.length > rule.maxLength) {
      return `Maximum ${rule.maxLength} caractères autorisés`;
    }

    // Vérifier le type email
    if (value && rule.type === 'email' && !InputValidator.validateEmail(value)) {
      return 'Email invalide';
    }

    // Vérifier le type password
    if (value && rule.type === 'password') {
      const passwordValidation = InputValidator.validatePassword(value);
      if (!passwordValidation.isValid) {
        return passwordValidation.errors[0];
      }
    }

    // Vérifier les patterns regex
    if (value && rule.pattern && !rule.pattern.test(value)) {
      return rule.message || 'Format invalide';
    }

    return null;
  };

  /**
   * Valider tous les champs
   */
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(field => {
      const error = validateField(field, values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  /**
   * Gérer le changement de valeur d'un champ
   */
  const handleChange = (name, value) => {
    // Nettoyer la valeur d'entrée
    const cleanValue = InputValidator.sanitizeString(value);
    
    setValues(prev => ({
      ...prev,
      [name]: cleanValue
    }));

    // Valider le champ si il a été touché
    if (touched[name]) {
      const error = validateField(name, cleanValue);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  /**
   * Gérer le focus sur un champ
   */
  const handleBlur = (name) => {
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Valider le champ
    const error = validateField(name, values[name]);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  /**
   * Gérer la soumission du formulaire
   */
  const handleSubmit = async (onSubmit) => {
    setIsSubmitting(true);
    
    try {
      // Marquer tous les champs comme touchés
      const allTouched = {};
      Object.keys(validationRules).forEach(field => {
        allTouched[field] = true;
      });
      setTouched(allTouched);

      // Valider le formulaire
      const isValid = validateForm();
      if (!isValid) {
        throw new Error('Formulaire invalide');
      }

      // Nettoyer les données avant soumission
      const cleanData = {};
      Object.keys(values).forEach(key => {
        cleanData[key] = InputValidator.sanitizeString(values[key]);
      });

      await onSubmit(cleanData);
    } catch (error) {
      console.error('❌ Form submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Réinitialiser le formulaire
   */
  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    validateForm,
    isValid: Object.keys(errors).length === 0
  };
};

/**
 * Composant de champ de saisie sécurisé
 */
export const SecureInput = ({
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  placeholder,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(name, newValue);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur(name);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`
            w-full px-4 py-3 rounded-xl 
            border-2 transition-all duration-200
            bg-gray-50 text-gray-900
            placeholder-gray-400
            focus:outline-none focus:ring-4 focus:ring-gray-200 focus:border-gray-900 focus:bg-white
            ${error && touched ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : 'border-gray-200'}
            ${isFocused ? 'ring-4 ring-gray-200' : ''}
          `}
          {...props}
        />
      </div>
      
      {error && touched && (
        <p className="mt-2 text-sm text-red-600 font-medium animate-slide-in-right">
          <XSSProtection content={error} />
        </p>
      )}
    </div>
  );
};

/**
 * Composant de bouton sécurisé
 */
export const SecureButton = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props
}) => {
  const handleClick = (e) => {
    // Prévenir les clics multiples rapides
    if (loading || disabled) {
      e.preventDefault();
      return;
    }

    if (onClick) {
      onClick(e);
    }
  };

  const baseClasses = 'inline-flex items-center justify-center gap-2 font-heading font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
  
  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-200 shadow-medium hover:shadow-strong hover:scale-105',
    secondary: 'bg-white border-2 border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-200 shadow-soft hover:shadow-medium',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-200 shadow-medium hover:scale-105',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-200 shadow-medium hover:scale-105',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-200 shadow-medium hover:scale-105'
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-10',
    md: 'px-6 py-3 text-base min-h-12',
    lg: 'px-8 py-4 text-lg min-h-14'
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

/**
 * Composant de message d'erreur sécurisé
 */
export const SecureErrorMessage = ({ error, className = '' }) => {
  if (!error) return null;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-800">
            <XSSProtection content={error} />
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Composant de message de succès sécurisé
 */
export const SecureSuccessMessage = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`bg-green-50 border border-green-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-green-800">
            <XSSProtection content={message} />
          </p>
        </div>
      </div>
    </div>
  );
};
