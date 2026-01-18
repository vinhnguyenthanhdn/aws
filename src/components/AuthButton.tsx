import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import '../styles/AuthButton.css';

export const AuthButton: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        console.log('Current URL:', window.location.href);

        // Check for errors in URL
        const params = new URLSearchParams(window.location.hash.substring(1)); // For implicit/PKCE hash
        const errorDescription = params.get('error_description');
        if (errorDescription) {
            console.error('Auth Error:', errorDescription);
            alert(`Login Failed: ${errorDescription}`);
        }

        // Check active session with a slight delay/retry for Chrome reliability
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            console.log('Current Session:', session);
            setUser(session?.user ?? null);
        };

        checkSession();

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
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'select_account',
                },
            },
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
