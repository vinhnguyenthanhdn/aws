export interface Question {
    id: string;
    question: string;
    options: string[];
    correct_answer: string;
    is_multiselect: boolean;
    discussion_link?: string;
}

export interface UserAnswer {
    questionId: string;
    answer: string;
    isCorrect: boolean;
    timestamp: number;
}

export interface AICache {
    questionId: string;
    language: string;
    type: 'explanation' | 'theory';
    content: string;
    createdAt: number;
}

export type Language = 'vi' | 'en';

export interface AppState {
    currentIndex: number;
    userAnswers: Record<string, string>;
    language: Language;
    activeAISection: 'theory' | 'explanation' | null;
}
