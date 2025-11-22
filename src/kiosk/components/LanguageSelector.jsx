import { useEffect } from 'react';
import useKioskStore from '../../store/kioskStore';
import logger from '../../utils/logger';
import './LanguageSelector.css';

/**
 * Sélecteur de langue avec drapeaux circulaires
 * Positionné en bas à gauche de l'écran
 */
function LanguageSelector() {
  const { language, setLanguage, updateActivity } = useKioskStore();

  useEffect(() => {
    updateActivity();
  }, [updateActivity]);

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  const handleLanguageSelect = (langCode) => {
    logger.log(`🌐 LanguageSelector - Langue sélectionnée: ${langCode}`);
    setLanguage(langCode);
    updateActivity();
  };

  return (
    <div className="language-selector">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageSelect(lang.code)}
          className={`language-selector__flag ${language === lang.code ? 'language-selector__flag--active' : ''}`}
          aria-label={`Sélectionner ${lang.name}`}
          title={lang.name}
        >
          <span className="language-selector__flag-emoji">{lang.flag}</span>
        </button>
      ))}
    </div>
  );
}

export default LanguageSelector;

