import { useEffect } from 'react';
import useKioskStore from '../../store/kioskStore';
import logger from '../../utils/logger';

/**
 * Sélection de la langue
 * Grands boutons pour choisir la langue
 */
function LanguageSelection() {
  const { setLanguage, setCurrentStep, updateActivity } = useKioskStore();

  useEffect(() => {
    updateActivity();
  }, [updateActivity]);

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }
  ];

  const handleLanguageSelect = (langCode) => {
    logger.log(`🌐 Kiosk - Langue sélectionnée: ${langCode}`);
    setLanguage(langCode);
    // Aller à l'écran principal style KFC
    setCurrentStep('home');
  };

  return (
    <div className="language-selection h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <h2 className="text-6xl font-bold text-gray-800 mb-16">
        Choisissez votre langue
      </h2>

      <div className="language-buttons grid grid-cols-3 gap-8 w-full max-w-6xl px-8">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageSelect(lang.code)}
            className="language-button bg-white hover:bg-blue-50 border-4 border-gray-300 hover:border-blue-500 rounded-3xl p-12 text-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 min-h-[300px] touch-manipulation"
          >
            <div className="text-8xl mb-6">{lang.flag}</div>
            <div className="text-4xl font-bold text-gray-800">{lang.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default LanguageSelection;

