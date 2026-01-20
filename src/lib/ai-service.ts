import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';
import type { Language } from '../types';

const getAllApiKeys = (): string[] => {
    // Try to get list of keys first
    const keysString = import.meta.env.VITE_GOOGLE_API_KEYS || '';
    const keys = keysString.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);

    // Fallback to single key if list is empty
    if (keys.length === 0) {
        const singleKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        return singleKey ? [singleKey] : [];
    }

    return keys;
};

async function callGeminiAPI(prompt: string): Promise<string> {
    const apiKeys = getAllApiKeys();

    if (apiKeys.length === 0) {
        throw new Error('No API Key configured');
    }

    // Try each API key until one succeeds
    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[i];
        const keyId = `key ${i + 1}/${apiKeys.length}`;

        try {
            console.log(`🔑 Trying ${keyId}...`);
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const result = await model.generateContent(prompt);
            const text = result.response.text();

            if (text && text.trim() !== '') {
                console.log(`✅ ${keyId} succeeded`);
                return text;
            }

            console.warn(`⚠️ ${keyId} returned empty response`);
        } catch (error: any) {
            const errorMsg = error?.message || String(error);

            // Check if it's a rate limit or quota error
            if (errorMsg.toLowerCase().includes('quota') ||
                errorMsg.toLowerCase().includes('rate') ||
                errorMsg.toLowerCase().includes('429')) {
                console.warn(`⚠️ ${keyId} rate limited, trying next key...`);
                continue; // Try next key
            }

            // For other errors, also try next key
            console.warn(`⚠️ ${keyId} failed: ${errorMsg}, trying next key...`);
        }
    }

    // All keys exhausted
    console.error('❌ All API keys exhausted!');
    throw new Error('AI_SERVICE_UNAVAILABLE');
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
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error(`❌ Database error fetching cache for Q${questionId} (${type}, ${language}):`, {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            return null;
        }

        if (!data) {
            console.log(`📭 No cache found in DB for Q${questionId} (${type}, ${language})`);
            return null;
        }

        // Validate content is not empty or error message
        if (!data.content || data.content.trim() === '' || data.content === 'No response generated') {
            console.warn(`⚠️ Invalid cache content for Q${questionId} (${type}, ${language}), will regenerate`);
            return null;
        }

        return data.content;
    } catch (err) {
        console.error(`❌ Exception in getCachedAIContent:`, err);
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
    if (cached) {
        console.log(`✅ Cache HIT for explanation: Q${questionId} (${language})`);
        return cached;
    }
    console.log(`🔄 Cache MISS - Calling Gemini API for explanation: Q${questionId} (${language})`);

    const languageInstruction = language === 'vi'
        ? 'Vui lòng trả lời bằng tiếng Việt.'
        : 'Please respond in English.';

    const promptStructure = language === 'vi'
        ? `## Giải thích câu hỏi
Phân tích yêu cầu chính của câu hỏi, xác định các điểm mấu chốt cần chú ý.

## Giải thích đáp án đúng
Tại sao đáp án ${correctAnswer} là đúng? Giải thích chi tiết cách nó đáp ứng yêu cầu của câu hỏi.

## Tại sao không chọn các đáp án khác
Phân tích từng đáp án sai, giải thích lý do tại sao chúng không phù hợp hoặc không tối ưu.

## Các lỗi thường gặp (Common Mistakes)
Liệt kê các lỗi mà thí sinh hay mắc phải khi gặp dạng câu hỏi này.

## Mẹo để nhớ (Tips to Remember)
Cung cấp các mẹo, tricks hoặc cách nhớ nhanh để áp dụng cho các câu hỏi tương tự.`
        : `## Question Analysis
Analyze the main requirements of the question and identify the key points to focus on.

## Correct Answer Explanation
Why is answer ${correctAnswer} correct? Explain in detail how it meets the question's requirements.

## Why Other Answers Are Wrong
Analyze each incorrect answer and explain why they are not suitable or not optimal.

## Common Mistakes
List the mistakes that students often make when encountering this type of question.

## Tips to Remember
Provide tips, tricks, or memorization techniques to apply to similar questions.`;

    const prompt = `You are an AWS Solutions Architect expert. Analyze this SAA-C03 exam question.

Question: ${question}

Options:
${options}

Correct Answer: ${correctAnswer}

${languageInstruction}

IMPORTANT: Start directly with the analysis. Do NOT include any greetings, introductions (like "Chào bạn, là một chuyên gia..." or "Hello, as an expert..."), or conclusions. Go straight to the structured content below.

Provide a comprehensive explanation covering:

${promptStructure}

Keep the explanation structured and easy to understand (max 500 words).`;

    const content = await callGeminiAPI(prompt);

    // Only cache if content is valid
    if (content && content.trim() !== '' && content !== 'No response generated') {
        await setCachedAIContent(questionId, language, 'explanation', content);
    } else {
        console.warn(`⚠️ Not caching invalid explanation for Q${questionId}`);
    }

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
    if (cached) {
        console.log(`✅ Cache HIT for theory: Q${questionId} (${language})`);
        return cached;
    }
    console.log(`🔄 Cache MISS - Calling Gemini API for theory: Q${questionId} (${language})`);

    const languageInstruction = language === 'vi'
        ? 'Vui lòng trả lời bằng tiếng Việt.'
        : 'Please respond in English.';

    const promptStructure = language === 'vi'
        ? `## Cơ sở lý thuyết các thuật ngữ trong câu hỏi

Liệt kê và giải thích TẤT CẢ các AWS services, concepts, và thuật ngữ kỹ thuật được đề cập trong câu hỏi.

Định dạng cho mỗi thuật ngữ:
- **Tên thuật ngữ** (in đậm, không có dấu hai chấm)
- Giải thích ngắn gọn và đầy đủ về thuật ngữ đó (trên dòng mới)

## Cơ sở lý thuyết các thuật ngữ trong đáp án

Liệt kê và giải thích TẤT CẢ các AWS services, concepts, và thuật ngữ kỹ thuật xuất hiện trong các đáp án (A, B, C, D).

Định dạng cho mỗi thuật ngữ:
- **Tên thuật ngữ** (in đậm, không có dấu hai chấm)
- Giải thích ngắn gọn và đầy đủ về thuật ngữ đó (trên dòng mới)

QUAN TRỌNG: KHÔNG dùng dấu hai chấm (:) sau tên thuật ngữ.`
        : `## Theoretical Foundation of Question Terms

List and explain ALL AWS services, concepts, and technical terms mentioned in the question.

Format for each term:
- **Term name** (bold, NO colon)
- Concise but thorough explanation (on new line)

## Theoretical Foundation of Answer Terms

List and explain ALL AWS services, concepts, and technical terms appearing in the answers (A, B, C, D).

Format for each term:
- **Term name** (bold, NO colon)
- Concise but thorough explanation (on new line)

IMPORTANT: Do NOT use colons (:) after term names.`;

    const prompt = `You are an AWS Solutions Architect expert. Provide theoretical foundation for this question.

Question: ${question}

Options:
${options}

${languageInstruction}

IMPORTANT: Start directly with the theoretical content. Do NOT include any greetings, introductions (like "Chào bạn, là một chuyên gia..."), or conclusions. Go straight to the structured content below.

Provide a comprehensive theoretical breakdown:

${promptStructure}

Keep the theory organized and easy to reference (max 500 words).`;

    const content = await callGeminiAPI(prompt);

    // Only cache if content is valid
    if (content && content.trim() !== '' && content !== 'No response generated') {
        await setCachedAIContent(questionId, language, 'theory', content);
    } else {
        console.warn(`⚠️ Not caching invalid theory for Q${questionId}`);
    }

    return content;
}
