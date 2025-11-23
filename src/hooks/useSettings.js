import { useState, useEffect } from 'react';
import settingsService from '../services/settingsService';
import logger from '../utils/logger';

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
          if (currencyResponse.success && currencyResponse.data) {
            // Gérer les différents formats (setting_value ou value)
            const value = currencyResponse.data.setting_value || currencyResponse.data.value;
            if (value) {
              setCurrencySymbol(value);
              // Stocker dans localStorage pour accès rapide
              localStorage.setItem('currency_symbol', value);
            } else {
              // Utiliser la valeur depuis localStorage ou défaut
              const stored = localStorage.getItem('currency_symbol');
              setCurrencySymbol(stored || '€');
            }
          } else {
            // Paramètre non trouvé, utiliser la valeur depuis localStorage ou défaut
            const stored = localStorage.getItem('currency_symbol');
            setCurrencySymbol(stored || '€');
          }
        } catch (error) {
          logger.error('❌ Erreur chargement devise:', error);
          const stored = localStorage.getItem('currency_symbol');
          setCurrencySymbol(stored || '€');
        }
      } catch (error) {
        logger.error('❌ Erreur chargement paramètre table_number_enabled:', error);
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

