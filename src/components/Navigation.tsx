import React, { useState, useRef } from 'react';
import type { Language } from '../types';
import { getText } from '../lib/translations';
import '../styles/Navigation.css';

interface NavigationProps {
    currentIndex: number;
    totalQuestions: number;
    language: Language;
    onPrevious: () => void;
    onNext: () => void;
    onJumpToQuestion: (index: number) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
    currentIndex,
    totalQuestions,
    language,
    onPrevious,
    onNext,
    onJumpToQuestion,
}) => {
    const [jumpValue, setJumpValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const t = (key: string) => getText(language, key);

    const handleJump = (e: React.FormEvent) => {
        e.preventDefault();
        const questionNumber = parseInt(jumpValue);
        if (questionNumber >= 1 && questionNumber <= totalQuestions) {
            onJumpToQuestion(questionNumber - 1);
            setJumpValue('');
            // Blur input to dismiss keyboard and zoom out on mobile
            inputRef.current?.blur();
        }
    };

    const canGoPrevious = currentIndex > 0;
    const canGoNext = currentIndex < totalQuestions - 1;

    return (
        <div className="navigation">
            <div className="nav-buttons">
                <button
                    className="btn btn-secondary"
                    onClick={onPrevious}
                    disabled={!canGoPrevious}
                >
                    {t('btn_previous')}
                </button>

                <form onSubmit={handleJump} className="jump-form">
                    <input
                        ref={inputRef}
                        type="number"
                        min="1"
                        max={totalQuestions}
                        value={jumpValue}
                        onChange={(e) => setJumpValue(e.target.value)}
                        placeholder={`${t('jump_to_question')}...`}
                        className="input jump-input"
                    />
                    <button type="submit" className="btn btn-primary btn-sm">
                        Go
                    </button>
                </form>

                <button
                    className="btn btn-secondary"
                    onClick={onNext}
                    disabled={!canGoNext}
                >
                    {t('btn_next')}
                </button>
            </div>
        </div>
    );
};
