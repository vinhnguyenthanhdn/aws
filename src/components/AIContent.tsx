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


import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const AIContent: React.FC<AIContentProps> = ({
    type,
    content,
    language,
    discussionLink,
}) => {
    const t = (key: string) => getText(language, key);
    const title = type === 'theory' ? t('ai_theory') : t('ai_explanation');

    // Clean AI output - remove leading colons and extra spacing
    const cleanContent = (text: string): string => {
        return text
            // Remove ": " after bold keywords
            .replace(/(\*\*[^*]+\*\*)\s*:\s*/g, '$1\n\n')
            // Remove standalone ": " at start of lines  
            .replace(/^\s*:\s+/gm, '')
            // Clean up multiple newlines
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    };

    return (
        <div className={`ai-content card ${type}`}>
            <div className="ai-content-header">
                <h3>{title}</h3>
            </div>
            <div className="ai-content-body markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {cleanContent(content)}
                </ReactMarkdown>
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
