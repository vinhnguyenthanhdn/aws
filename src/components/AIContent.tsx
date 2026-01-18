import React from 'react';
import type { Language } from '../types';
import { getText } from '../lib/translations';
import '../styles/AIContent.css';

interface AIContentProps {
    type: 'theory' | 'explanation';
    content: string;
    language: Language;
    discussionLink?: string;
}

export const AIContent: React.FC<AIContentProps> = ({
    type,
    content,
    language,
    discussionLink,
}) => {
    const t = (key: string) => getText(language, key);
    const title = type === 'theory' ? t('ai_theory') : t('ai_explanation');

    return (
        <div className={`ai-content card ${type}`}>
            <div className="ai-content-header">
                <h3>{title}</h3>
            </div>
            <div className="ai-content-body">
                <p>{content}</p>
            </div>
            {discussionLink && type === 'explanation' && (
                <div className="ai-content-footer">
                    <a
                        href={discussionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="discussion-link"
                    >
                        💬 View Discussion
                    </a>
                </div>
            )}
        </div>
    );
};
