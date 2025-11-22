import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour debounce une valeur
 * Utile pour limiter les appels API lors de la saisie dans un champ de recherche
 * 
 * @param {any} value - La valeur à debouncer
 * @param {number} delay - Le délai en millisecondes (défaut: 300ms)
 * @returns {any} - La valeur debouncée
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 300);
 * 
 * useEffect(() => {
 *   // Cette fonction ne sera appelée que 300ms après la dernière modification
 *   performSearch(debouncedSearchTerm);
 * }, [debouncedSearchTerm]);
 */
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Créer un timer qui mettra à jour la valeur debouncée après le délai
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoyer le timer si la valeur change avant que le délai ne soit écoulé
    // Cela annule le timer précédent et en crée un nouveau
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;

