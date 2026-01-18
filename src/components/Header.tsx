import React from 'react';
import '../styles/Header.css';

export const Header: React.FC = () => {
    return (
        <header className="app-header">
            <div className="container">
                <div className="header-content">
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
