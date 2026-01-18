import React from 'react';
import type { Language } from '../types';
import '../styles/LanguageSelector.css';

interface LanguageSelectorProps {
    currentLanguage: Language;
    onLanguageChange: (language: Language) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    currentLanguage,
    onLanguageChange,
}) => {
    return (
        <div className="language-selector">
            <button
                className={`lang-btn ${currentLanguage === 'vi' ? 'active' : ''}`}
                onClick={() => onLanguageChange('vi')}
            >
                🇻🇳 Tiếng Việt
            </button>
            <button
                className={`lang-btn ${currentLanguage === 'en' ? 'active' : ''}`}
                onClick={() => onLanguageChange('en')}
            >
                🇬🇧 English
            </button>
        </div>
    );
};
