import React, { useState, useEffect } from 'react';
import type { Question, Language } from '../types';
import { getText } from '../lib/translations';
import '../styles/QuestionCard.css';

interface QuestionCardProps {
    question: Question;
    questionNumber: number;
    totalQuestions: number;
    language: Language;
    userAnswer?: string;
    onSubmit: (answer: string) => void;
    onRequestTheory: () => void;
    onRequestExplanation: () => void;
    loadingAction: 'theory' | 'explanation' | null;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
    question,
    questionNumber,
    totalQuestions,
    language,
    userAnswer,
    onSubmit,
    onRequestTheory,
    onRequestExplanation,
    loadingAction,
}) => {
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

    // Reset or restore selection when question changes
    useEffect(() => {
        if (userAnswer) {
            setSelectedOptions(userAnswer.split(''));
        } else {
            setSelectedOptions([]);
        }
    }, [question.id, userAnswer]);

    const t = (key: string) => getText(language, key);
    const isLoadingAI = !!loadingAction;

    const handleOptionChange = (optionLetter: string) => {
        if (question.is_multiselect) {
            setSelectedOptions(prev =>
                prev.includes(optionLetter)
                    ? prev.filter(o => o !== optionLetter)
                    : [...prev, optionLetter].sort()
            );
        } else {
            setSelectedOptions([optionLetter]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedOptions.length > 0) {
            onSubmit(selectedOptions.join(''));
        }
    };

    const getOptionLetter = (option: string): string => {
        return option.split('.')[0].trim();
    };

    const isCorrect = userAnswer === question.correct_answer;
    const hasAnswered = !!userAnswer;

    return (
        <div className="question-card card fade-in">
            {/* Header */}
            <div className="question-header">
                <h2>
                    {t('question_header')} {questionNumber} {t('of')} {totalQuestions}
                </h2>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question Text */}
            <div className="question-text">
                <p>{question.question}</p>
                {question.is_multiselect && (
                    <span className="multiselect-badge">{t('select_multiple')}</span>
                )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="question-form">
                {/* Options */}
                <div className="options-container">
                    {question.options.map((option) => {
                        const optionLetter = getOptionLetter(option);
                        const isSelected = selectedOptions.includes(optionLetter);

                        return (
                            <label
                                key={optionLetter}
                                className={`option-label ${isSelected ? 'selected' : ''}`}
                            >
                                <input
                                    type={question.is_multiselect ? 'checkbox' : 'radio'}
                                    name="answer"
                                    value={optionLetter}
                                    checked={isSelected}
                                    onChange={() => handleOptionChange(optionLetter)}
                                    className={question.is_multiselect ? 'checkbox' : 'radio'}
                                    disabled={isLoadingAI}
                                />
                                <span className="option-text">{option}</span>
                            </label>
                        );
                    })}
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onRequestTheory}
                        disabled={isLoadingAI}
                    >
                        {loadingAction === 'theory' ? t('loading_theory') : t('btn_theory')}
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onRequestExplanation}
                        disabled={isLoadingAI}
                    >
                        {loadingAction === 'explanation' ? t('loading_explanation') : t('btn_explain')}
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={selectedOptions.length === 0 || isLoadingAI}
                    >
                        {t('btn_submit')}
                    </button>
                </div>
            </form>

            {/* Answer Feedback */}
            {hasAnswered && (
                <div className={`answer-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
                    <div className="feedback-header">
                        {isCorrect ? t('correct') : t('incorrect')}
                    </div>
                    <div className="feedback-details">
                        <div>
                            <strong>{t('your_answer')}:</strong> {userAnswer}
                        </div>
                        {!isCorrect && (
                            <div>
                                <strong>{t('correct_answer')}:</strong> {question.correct_answer}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
