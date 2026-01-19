import React from 'react';
import { LanguageSelector } from './LanguageSelector';
import { AuthButton } from './AuthButton';
import type { Language } from '../types';
import '../styles/Header.css';

interface HeaderProps {
    currentLanguage: Language;
    onLanguageChange: (language: Language) => void;
    onHistoryClick?: () => void;
    isHistoryView?: boolean;
    user?: any;
}

export const Header: React.FC<HeaderProps> = ({
    currentLanguage,
    onLanguageChange,
    onHistoryClick,
    isHistoryView,
    user
}) => {
    return (
        <header className="app-header">
            <div className="container">
                <div className="header-content">
                    <div className="header-actions">
                        <AuthButton currentLanguage={currentLanguage} />
                        {user && onHistoryClick && (
                            <button
                                className={`btn ${isHistoryView ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={onHistoryClick}
                                style={{ marginLeft: '1rem' }}
                            >
                                {isHistoryView ? 'Back to Quiz' : 'My History'}
                            </button>
                        )}
                    </div>
                    <LanguageSelector
                        currentLanguage={currentLanguage}
                        onLanguageChange={onLanguageChange}
                    />
                    <h1 className="app-title">
                        <span className="title-icon">☁️</span>
                        AWS SAA-C03 Quiz
                    </h1>
                    <p className="app-subtitle">
                        Master your AWS Solutions Architect Associate Certification
                    </p>
                </div>
            </div>
        </header>
    );
};
