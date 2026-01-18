import React from 'react';
import { LanguageSelector } from './LanguageSelector';
import { AuthButton } from './AuthButton';
import type { Language } from '../types';
import '../styles/Header.css';

interface HeaderProps {
    currentLanguage: Language;
    onLanguageChange: (language: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentLanguage, onLanguageChange }) => {
    return (
        <header className="app-header">
            <div className="container">
                <div className="header-content">
                    <AuthButton />
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
