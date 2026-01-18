import { supabase } from './supabase';
import type { Language } from '../types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

interface AIResponse {
    candidates: Array<{
        content: {
            parts: Array<{
                text: string;
            }>;
        };
    }>;
}

const getApiKey = () => {
    // Try to get list of keys first
    const keysString = import.meta.env.VITE_GOOGLE_API_KEYS || '';
    const keys = keysString.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);

    // Fallback to single key if list is empty
    if (keys.length === 0) {
        return import.meta.env.VITE_GEMINI_API_KEY || '';
    }

    // Return random key from list
    return keys[Math.floor(Math.random() * keys.length)];
};

async function callGeminiAPI(prompt: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('No API Key configured');
    }

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            // Check for quota exceeded specifically if we want to be fancy, but simple error throw is fine for now
            // If we had retry logic with different keys, it would go here. 
            // For now, let's just throw.
            throw new Error(`API call failed: ${response.statusText}`);
        }

        const data: AIResponse = await response.json();
        return data.candidates[0]?.content?.parts[0]?.text || 'No response generated';
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        throw error;
    }
}

async function getCachedAIContent(
    questionId: string,
    language: Language,
    type: 'explanation' | 'theory'
): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('ai_cache')
            .select('content')
            .eq('question_id', questionId)
            .eq('language', language)
            .eq('type', type)
            .maybeSingle();

        if (error || !data) return null;
        return data.content;
    } catch {
        return null;
    }
}

async function setCachedAIContent(
    questionId: string,
    language: Language,
    type: 'explanation' | 'theory',
    content: string
): Promise<void> {
    try {
        await supabase.from('ai_cache').upsert({
            question_id: questionId,
            language,
            type,
            content,
        });
    } catch (error) {
        console.error('Error caching AI content:', error);
    }
}

export async function getAIExplanation(
    question: string,
    options: string,
    correctAnswer: string,
    questionId: string,
    language: Language = 'vi'
): Promise<string> {
    // Check cache first
    const cached = await getCachedAIContent(questionId, language, 'explanation');
    if (cached) return cached;

    const languageInstruction = language === 'vi'
        ? 'Vui lòng trả lời bằng tiếng Việt.'
        : 'Please respond in English.';

    const prompt = `You are an AWS Solutions Architect expert. Explain why the correct answer is right for this question.

Question: ${question}

Options:
${options}

Correct Answer: ${correctAnswer}

${languageInstruction}

Provide a clear, detailed explanation focusing on:
1. Why the correct answer is right
2. Key AWS concepts involved
3. Common pitfalls to avoid

Keep the explanation concise but informative (max 300 words).`;

    const content = await callGeminiAPI(prompt);

    // Cache the result
    await setCachedAIContent(questionId, language, 'explanation', content);

    return content;
}

export async function getAITheory(
    question: string,
    options: string,
    questionId: string,
    language: Language = 'vi'
): Promise<string> {
    // Check cache first
    const cached = await getCachedAIContent(questionId, language, 'theory');
    if (cached) return cached;

    const languageInstruction = language === 'vi'
        ? 'Vui lòng trả lời bằng tiếng Việt.'
        : 'Please respond in English.';

    const prompt = `You are an AWS Solutions Architect expert. Provide theoretical background for understanding this question.

Question: ${question}

Options:
${options}

${languageInstruction}

Provide:
1. Key AWS services/concepts mentioned
2. Important theoretical background
3. Best practices related to this topic
4. Helpful tips for the exam

Keep the theory concise but comprehensive (max 400 words).`;

    const content = await callGeminiAPI(prompt);

    // Cache the result
    await setCachedAIContent(questionId, language, 'theory', content);

    return content;
}
