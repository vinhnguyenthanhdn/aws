import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
    public: {
        Tables: {
            questions: {
                Row: {
                    id: string;
                    topic: string | null;
                    question: string;
                    options: string[];
                    correct_answer: string;
                    discussion_link: string | null;
                    is_multiselect: boolean;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    topic?: string | null;
                    question: string;
                    options: string[];
                    correct_answer: string;
                    discussion_link?: string | null;
                    is_multiselect?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    topic?: string | null;
                    question?: string;
                    options?: string[];
                    correct_answer?: string;
                    discussion_link?: string | null;
                    is_multiselect?: boolean;
                    created_at?: string;
                };
            };
            user_answers: {
                Row: {
                    id: string;
                    user_id: string;
                    question_id: string;
                    answer: string;
                    is_correct: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    question_id: string;
                    answer: string;
                    is_correct: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    question_id?: string;
                    answer?: string;
                    is_correct?: boolean;
                    created_at?: string;
                };
            };
            ai_cache: {
                Row: {
                    id: string;
                    question_id: string;
                    language: string;
                    type: 'explanation' | 'theory';
                    content: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    question_id: string;
                    language: string;
                    type: 'explanation' | 'theory';
                    content: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    question_id?: string;
                    language?: string;
                    type?: 'explanation' | 'theory';
                    content?: string;
                    created_at?: string;
                };
            };
        };
    };
}
