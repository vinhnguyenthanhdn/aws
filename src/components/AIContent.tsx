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

    // Clean AI output - ONLY remove colons, don't add line breaks
    const cleanContent = (text: string): string => {
        return text
            // Remove ONLY the colon and space after bold keywords
            // Keep text on same line to preserve context
            .replace(/(\*\*[^*]+\*\*)\s*:\s*/g, '$1 ')
            // Remove standalone ": " at start of lines
            .replace(/^\s*:\s+/gm, '')
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
