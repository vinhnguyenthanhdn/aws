import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Language } from '../types';
import { getText } from '../lib/translations';
import '../styles/AuthButton.css';

interface AuthButtonProps {
    currentLanguage?: Language;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ currentLanguage = 'vi' }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const handleAuth = async () => {
            console.log('Current URL:', window.location.href);

            // Check if URL contains auth info
            const hash = window.location.hash;
            const search = window.location.search;
            const hasAuthParams = hash.includes('access_token') ||
                hash.includes('error_description') ||
                search.includes('code=');

            if (hasAuthParams) {
                console.log('Auth params detected, processing...');
                // Wait for Supabase SDK to process the URL
                await new Promise(res => setTimeout(res, 500));
            }

            // Check for errors in URL
            const params = new URLSearchParams(hash.substring(1));
            const errorDescription = params.get('error_description');
            if (errorDescription) {
                console.error('Auth Error:', errorDescription);
                alert(`Login Failed: ${errorDescription}`);
            }

            const { data: { session } } = await supabase.auth.getSession();
            console.log('Current Session:', session);
            setUser(session?.user ?? null);
        };

        handleAuth();

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
                <>
                    <span className="auth-cta">{getText(currentLanguage, 'login_cta')}</span>
                    <button className="auth-btn" onClick={handleLogin}>
                        <span className="google-icon">G</span>
                        Sign in with Google
                    </button>
                </>
            )}
        </div>
    );
};
