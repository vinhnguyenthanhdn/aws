import { supabase } from './supabase';
import { UserSubmission } from '../types';

export const TABLE_NAME = 'user_submissions';

export async function saveUserSubmission(
    userId: string,
    questionId: string,
    answer: string,
    isCorrect: boolean
) {
    try {
        const { error } = await supabase
            .from(TABLE_NAME)
            .insert({
                user_id: userId,
                question_id: questionId,
                answer: answer,
                is_correct: isCorrect,
                created_at: new Date().toISOString(),
            });

        if (error) throw error;
    } catch (error) {
        console.error('Error saving submission:', error);
    }
}

export async function getUserSubmissions(userId: string): Promise<UserSubmission[]> {
    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data as UserSubmission[];
    } catch (error) {
        console.error('Error getting history:', error);
        return [];
    }
}

export async function clearUserHistory(userId: string) {
    try {
        const { error } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
    } catch (error) {
        console.error('Error clearing history:', error);
        throw error;
    }
}
