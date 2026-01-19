import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';
import type { Language } from '../types';

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
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const result = await model.generateContent(prompt);
        return result.response.text() || 'No response generated';
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

    const prompt = `You are an AWS Solutions Architect expert helping students prepare for the SAA-C03 exam.

Question: ${question}

Options:
${options}

Correct Answer: ${correctAnswer}

${languageInstruction}

Provide a comprehensive explanation covering:

1. **Giải thích câu hỏi**: Phân tích yêu cầu chính của câu hỏi, xác định các điểm mấu chốt cần chú ý.

2. **Giải thích đáp án đúng**: Tại sao đáp án ${correctAnswer} là đúng? Giải thích chi tiết cách nó đáp ứng yêu cầu của câu hỏi.

3. **Tại sao không chọn các đáp án khác**: Phân tích từng đáp án sai, giải thích lý do tại sao chúng không phù hợp hoặc không tối ưu.

4. **Các lỗi thường gặp (Common Mistakes)**: Liệt kê các lỗi mà thí sinh hay mắc phải khi gặp dạng câu hỏi này.

5. **Mẹo để nhớ (Tips to Remember)**: Cung cấp các mẹo, tricks hoặc cách nhớ nhanh để áp dụng cho các câu hỏi tương tự.

Keep the explanation structured and easy to understand (max 500 words).`;

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

    const prompt = `You are an AWS Solutions Architect expert. Provide theoretical foundation for understanding this question.

Question: ${question}

Options:
${options}

${languageInstruction}

Provide a comprehensive theoretical breakdown:

1. **Cơ sở lý thuyết các thuật ngữ trong câu hỏi**: Liệt kê và giải thích TẤT CẢ các AWS services, concepts, và thuật ngữ kỹ thuật được đề cập trong câu hỏi. Mỗi thuật ngữ cần được giải thích ngắn gọn nhưng đầy đủ.

2. **Cơ sở lý thuyết các thuật ngữ trong đáp án**: Liệt kê và giải thích TẤT CẢ các AWS services, concepts, và thuật ngữ kỹ thuật xuất hiện trong các đáp án (A, B, C, D). Đặc biệt chú ý những thuật ngữ khác với phần câu hỏi.

Keep the theory organized and easy to reference (max 500 words).`;

    const content = await callGeminiAPI(prompt);

    // Cache the result
    await setCachedAIContent(questionId, language, 'theory', content);

    return content;
}
