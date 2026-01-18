import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import '../styles/AuthButton.css';

export const AuthButton: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        console.log('Current URL:', window.location.href);

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('Current Session:', session);
            setUser(session?.user ?? null);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth Event:', event, session);
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google'
        });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="auth-container">
            {user ? (
                <div className="user-info">
                    {user.user_metadata.avatar_url && (
                        <img
                            src={user.user_metadata.avatar_url}
                            alt="User Avatar"
                            className="user-avatar"
                        />
                    )}
                    <button className="auth-btn" onClick={handleLogout}>
                        Sign Out
                    </button>
                </div>
            ) : (
                <button className="auth-btn" onClick={handleLogin}>
                    <span className="google-icon">G</span>
                    Sign in with Google
                </button>
            )}
        </div>
    );
};
