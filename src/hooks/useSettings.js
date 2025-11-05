import { useState, useEffect } from 'react';
import settingsService from '../services/settingsService';

/**
 * Hook personnalisé pour les paramètres de l'application
 */
const useSettings = () => {
  const [tableNumberEnabled, setTableNumberEnabled] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState('€');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const enabled = await settingsService.isTableNumberEnabled();
        setTableNumberEnabled(enabled);
        
        // Charger la devise
        try {
          const currencyResponse = await settingsService.getSetting('currency_symbol');
          if (currencyResponse.success && currencyResponse.data?.value) {
            setCurrencySymbol(currencyResponse.data.value);
            // Stocker dans localStorage pour accès rapide
            localStorage.setItem('currency_symbol', currencyResponse.data.value);
          } else {
            // Utiliser la valeur depuis localStorage ou défaut
            const stored = localStorage.getItem('currency_symbol');
            setCurrencySymbol(stored || '€');
          }
        } catch (error) {
          console.error('❌ Erreur chargement devise:', error);
          const stored = localStorage.getItem('currency_symbol');
          setCurrencySymbol(stored || '€');
        }
      } catch (error) {
        console.error('❌ Erreur chargement paramètre table_number_enabled:', error);
        setTableNumberEnabled(false);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  return {
    tableNumberEnabled,
    currencySymbol,
    loading
  };
};

export default useSettings;

