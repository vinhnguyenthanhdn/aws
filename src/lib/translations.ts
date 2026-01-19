import type { Language } from '../types';

interface Translations {
    [key: string]: {
        vi: string;
        en: string;
    };
}

const translations: Translations = {
    app_title: {
        vi: 'AWS SAA-C03 Quiz',
        en: 'AWS SAA-C03 Quiz',
    },
    question_header: {
        vi: 'Câu hỏi',
        en: 'Question',
    },
    of: {
        vi: 'của',
        en: 'of',
    },
    select_answer: {
        vi: 'Chọn câu trả lời',
        en: 'Select your answer',
    },
    select_multiple: {
        vi: 'Chọn nhiều câu trả lời',
        en: 'Select multiple answers',
    },
    btn_submit: {
        vi: 'Nộp bài',
        en: 'Submit',
    },
    btn_theory: {
        vi: '📚 Lý thuyết',
        en: '📚 Theory',
    },
    btn_explain: {
        vi: '🤖 Giải thích',
        en: '🤖 Explain',
    },
    btn_previous: {
        vi: '← Trước',
        en: '← Previous',
    },
    btn_next: {
        vi: 'Sau →',
        en: 'Next →',
    },
    correct: {
        vi: '✅ Chính xác!',
        en: '✅ Correct!',
    },
    incorrect: {
        vi: '❌ Sai rồi!',
        en: '❌ Incorrect!',
    },
    correct_answer: {
        vi: 'Đáp án đúng',
        en: 'Correct answer',
    },
    your_answer: {
        vi: 'Câu trả lời của bạn',
        en: 'Your answer',
    },
    loading_theory: {
        vi: '⏳ Đang tải lý thuyết...',
        en: '⏳ Loading theory...',
    },
    loading_explanation: {
        vi: '⏳ Đang phân tích...',
        en: '⏳ Analyzing...',
    },
    ai_explanation: {
        vi: '🤖 Giải thích AI',
        en: '🤖 AI Explanation',
    },
    ai_theory: {
        vi: '📚 Lý thuyết AI',
        en: '📚 AI Theory',
    },
    jump_to_question: {
        vi: 'Nhảy đến câu hỏi',
        en: 'Jump to question',
    },
    progress: {
        vi: 'Tiến độ',
        en: 'Progress',
    },
    contact: {
        vi: 'Liên hệ',
        en: 'Contact',
    },
    login_cta: {
        vi: 'Đăng nhập để cá nhân hóa quá trình học',
        en: 'Sign in to personalize your learning',
    },
};

export function getText(language: Language, key: string): string {
    return translations[key]?.[language] || key;
}

export function getAvailableLanguages(): Language[] {
    return ['vi', 'en'];
}
