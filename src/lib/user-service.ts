import { supabase } from './supabase';

export async function saveUserProgress(userId: string, index: number) {
    try {
        const { error } = await supabase
            .from('user_progress')
            .upsert({
                user_id: userId,
                last_question_index: index,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

        if (error) throw error;
    } catch (error) {
        console.error('Error saving user progress:', error);
    }
}

export async function getUserProgress(userId: string): Promise<number | null> {
    try {
        console.log('Fetching progress for user:', userId);
        const { data, error } = await supabase
            .from('user_progress')
            .select('last_question_index')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                console.log('No progress found for user (PGRST116)');
                return null;
            }
            console.error('Supabase error fetching progress:', error);
            throw error;
        }

        console.log('Progress data from Supabase:', data);
        return data?.last_question_index ?? null;
    } catch (error) {
        console.error('Error getting user progress:', error);
        return null;
    }
}
