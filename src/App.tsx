import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

import { QuestionCard } from './components/QuestionCard';
import { AIContent } from './components/AIContent';
import { Navigation } from './components/Navigation';
import { Loading } from './components/Loading';
import { supabase } from './lib/supabase';
import { getAIExplanation, getAITheory } from './lib/ai-service';
import { saveUserProgress, getUserProgress } from './lib/user-service';
import { saveUserSubmission } from './lib/history-service';
import { HistoryPage } from './components/HistoryPage';
import type { User } from '@supabase/supabase-js';
import type { Question, Language } from './types';
import './styles/App.css';

function App() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [language, setLanguage] = useState<Language>('vi');
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [activeAISection, setActiveAISection] = useState<'theory' | 'explanation' | null>(null);
    const [aiContent, setAiContent] = useState<Record<string, string>>({});
    const [user, setUser] = useState<User | null>(null);
    const [isRestoringProgress, setIsRestoringProgress] = useState(true);
    const [pendingSavedIndex, setPendingSavedIndex] = useState<number | null>(null);
    const [view, setView] = useState<'quiz' | 'history'>('quiz');

    // Load questions on mount
    useEffect(() => {
        const loadQuestions = async () => {
            try {
                // Fetch from Supabase with pagination to bypass 1000 row limit
                let allData: any[] = [];
                let from = 0;
                const PAGE_SIZE = 1000;
                let fetchMore = true;

                while (fetchMore) {
                    const { data, error } = await supabase
                        .from('questions')
                        .select('*')
                        .range(from, from + PAGE_SIZE - 1)
                        .order('id');

                    if (error) {
                        throw error;
                    }

                    if (data) {
                        allData = [...allData, ...data];

                        // If we got less than PAGE_SIZE, we've reached the end
                        if (data.length < PAGE_SIZE) {
                            fetchMore = false;
                        } else {
                            from += PAGE_SIZE;
                        }
                    } else {
                        fetchMore = false;
                    }
                }

                const data = allData;

                if (data && data.length > 0) {
                    // Map DB response to Question type
                    const mappedQuestions: Question[] = data.map(q => ({
                        id: q.id,
                        question: q.question,
                        options: q.options,
                        correct_answer: q.correct_answer,
                        is_multiselect: q.is_multiselect,
                        discussion_link: q.discussion_link || undefined
                    }));

                    // Sort by ID naturally (numeric sort of strings)
                    mappedQuestions.sort((a, b) => parseInt(a.id) - parseInt(b.id));

                    setQuestions(mappedQuestions);

                    // Load saved answers from localStorage
                    const savedAnswers = localStorage.getItem('aws_quiz_answers');
                    if (savedAnswers) {
                        setUserAnswers(JSON.parse(savedAnswers));
                    }
                }
            } catch (error) {
                console.error('Error loading questions:', error);
            } finally {
                setLoading(false);
            }
        };

        loadQuestions();
    }, []);

    // Auto-detect language based on IP
    useEffect(() => {
        const detectLanguage = async () => {
            try {
                // Check if user manually selected language before (optional, but good UX)
                // If we want strict IP based on first load:
                // Use api.country.is (free, no key, HTTPS supported)
                const response = await fetch('https://api.country.is');
                if (!response.ok) throw new Error('IP API failed');

                const data = await response.json();
                console.log('Detected Country:', data.country);

                // Only switch if we successfully got a country code
                if (data.country) {
                    if (data.country !== 'VN') {
                        setLanguage('en');
                    } else {
                        setLanguage('vi');
                    }
                }
            } catch (error) {
                console.error('Error detecting language:', error);
                // Keep default 'vi' on error
            }
        };

        detectLanguage();
    }, []);

    // Monitor Auth State & Load Progress
    useEffect(() => {
        const handleAuthChange = async (session: any) => {
            setUser(session?.user ?? null);

            if (session?.user) {
                const savedIndex = await getUserProgress(session.user.id);

                if (savedIndex !== null) {
                    setPendingSavedIndex(savedIndex);
                }
            }
            // Done checking auth/progress
            setIsRestoringProgress(false);
        };

        // We need to know if we are waiting for auth
        // getSession returns almost immediately with local session
        supabase.auth.getSession().then(({ data: { session } }) => {
            handleAuthChange(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            // On subsequent changes, we don't necessarily block URL updates, 
            // but we might want to update user state.
            // We can just set user here. The initial load is what matters for isRestoringProgress.
            if (!isRestoringProgress) {
                setUser(session?.user ?? null);
            }
        });

        return () => subscription.unsubscribe();
    }, []); // Run once on mount

    // Determine Initial Index (Priority: Saved > URL)
    // Determine Initial Index (Priority: URL > Saved)
    useEffect(() => {
        if (loading || isRestoringProgress) return;

        // Check URL first (User Request: Link overrides saved state for VIEWING)
        const params = new URLSearchParams(window.location.search);
        const qParam = params.get('q');
        if (qParam) {
            const index = parseInt(qParam) - 1;
            if (index >= 0 && index < questions.length) {
                setCurrentIndex(index);
                return;
            }
        }

        // If no URL param, fall back to saved index
        if (pendingSavedIndex !== null) {
            if (pendingSavedIndex >= 0 && pendingSavedIndex < questions.length) {
                setCurrentIndex(pendingSavedIndex);
                return;
            }
        }
    }, [loading, isRestoringProgress, pendingSavedIndex, questions]);

    // Update URL & Save Progress when index changes
    // Update URL when index changes
    useEffect(() => {
        // Don't update URL if we are still determining start index
        if (isRestoringProgress || loading) return;

        // Avoid overwriting URL if Auth flow is active
        const hash = window.location.hash;
        const search = window.location.search;
        if (hash.includes('access_token') || hash.includes('type=recovery') || search.includes('code=')) {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        params.set('q', String(currentIndex + 1));
        window.history.replaceState({}, '', `?${params.toString()}`);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Reset AI section when changing questions
        setActiveAISection(null);

        // NOTE: We do NOT auto-save progress here anymore. 
        // We only save when user explicitly Navigates (Next/Prev/Jump) or Submits.
        // This prevents overwriting history when just visiting a link.
    }, [currentIndex, isRestoringProgress, loading]);

    // Save answers to localStorage
    useEffect(() => {
        localStorage.setItem('aws_quiz_answers', JSON.stringify(userAnswers));
    }, [userAnswers]);

    const currentQuestion = questions[currentIndex];

    const handleSubmitAnswer = (answer: string) => {
        const isCorrect = answer === currentQuestion.correct_answer;

        setUserAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: answer,
        }));

        // Reset AI section explanation/theory to null when new answer is submitted? 
        // Or keep it? Usually better to keep if user wants to see it.

        // Save submission history if logged in
        if (user) {
            saveUserSubmission(user.id, currentQuestion.id, answer, isCorrect);
            // Also save progress on submit
            saveUserProgress(user.id, currentIndex);
        }
    };

    const handleLanguageChange = (newLanguage: Language) => {
        setLanguage(newLanguage);
        // Clear AI content when language changes
        setAiContent({});
        setActiveAISection(null);
    };

    const handleRequestTheory = async () => {
        if (!currentQuestion || aiLoading) return;

        // Save progress when user engages with AI
        if (user) {
            saveUserProgress(user.id, currentIndex);
        }

        const cacheKey = `theory_${currentQuestion.id}_${language}`;

        // Check if already loaded in memory (UI state)
        if (aiContent[cacheKey]) {
            setActiveAISection('theory');
            return;
        }

        setAiLoading(true);
        setActiveAISection('theory');

        try {
            const optionsText = currentQuestion.options.join('\n');
            // getAITheory will check database cache first before calling Gemini API
            const theory = await getAITheory(
                currentQuestion.question,
                optionsText,
                currentQuestion.id,
                language
            );

            // Store in memory for this session
            setAiContent(prev => ({
                ...prev,
                [cacheKey]: theory,
            }));
        } catch (error: any) {
            console.error('Error getting theory:', error);

            // Check if it's AI service unavailable error
            if (error?.message === 'AI_SERVICE_UNAVAILABLE') {
                const errorMessage = language === 'vi'
                    ? '⚠️ Dịch vụ AI hiện đang quá tải. Vui lòng thử lại sau vài phút.'
                    : '⚠️ AI service is currently overloaded. Please try again in a few minutes.';
                alert(errorMessage);
            } else {
                const errorMessage = language === 'vi'
                    ? '❌ Không thể tải lý thuyết. Vui lòng thử lại.'
                    : '❌ Failed to load theory. Please try again.';
                alert(errorMessage);
            }

            setActiveAISection(null);
        } finally {
            setAiLoading(false);
        }
    };

    const handleRequestExplanation = async () => {
        if (!currentQuestion || aiLoading) return;

        // Save progress when user engages with AI
        if (user) {
            saveUserProgress(user.id, currentIndex);
        }

        const cacheKey = `explanation_${currentQuestion.id}_${language}`;

        // Check if already loaded in memory (UI state)
        if (aiContent[cacheKey]) {
            setActiveAISection('explanation');
            return;
        }

        setAiLoading(true);
        setActiveAISection('explanation');

        try {
            const optionsText = currentQuestion.options.join('\n');
            // getAIExplanation will check database cache first before calling Gemini API
            const explanation = await getAIExplanation(
                currentQuestion.question,
                optionsText,
                currentQuestion.correct_answer,
                currentQuestion.id,
                language
            );

            // Store in memory for this session
            setAiContent(prev => ({
                ...prev,
                [cacheKey]: explanation,
            }));
        } catch (error: any) {
            console.error('Error getting explanation:', error);

            // Check if it's AI service unavailable error
            if (error?.message === 'AI_SERVICE_UNAVAILABLE') {
                const errorMessage = language === 'vi'
                    ? '⚠️ Dịch vụ AI hiện đang quá tải. Vui lòng thử lại sau vài phút.'
                    : '⚠️ AI service is currently overloaded. Please try again in a few minutes.';
                alert(errorMessage);
            } else {
                const errorMessage = language === 'vi'
                    ? '❌ Không thể tải giải thích. Vui lòng thử lại.'
                    : '❌ Failed to load explanation. Please try again.';
                alert(errorMessage);
            }

            setActiveAISection(null);
        } finally {
            setAiLoading(false);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            setCurrentIndex(newIndex);
            if (user) saveUserProgress(user.id, newIndex);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            if (user) saveUserProgress(user.id, newIndex);
        }
    };

    const handleJumpToQuestion = (index: number) => {
        if (index >= 0 && index < questions.length) {
            setCurrentIndex(index);
            if (user) saveUserProgress(user.id, index);
            setView('quiz'); // Switch back to quiz view
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (loading) {
        return (
            <div className="app">
                <Loading message="Initializing AWS Cloud Learning Environment..." />
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="app">
                <div className="container">
                    <div className="card error-card">
                        <h2>❌ Error Loading Questions</h2>
                        <p>Could not connect to Supabase or no questions found.</p>
                        <br />
                        <p style={{ fontSize: '0.9rem' }}>Please check your <b>.env</b> file has the correct <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.</p>
                    </div>
                </div>
            </div>
        );
    }

    const theoryCacheKey = `theory_${currentQuestion.id}_${language}`;
    const explanationCacheKey = `explanation_${currentQuestion.id}_${language}`;

    return (
        <div className="app">
            <Header
                currentLanguage={language}
                onLanguageChange={handleLanguageChange}
                onHistoryClick={() => setView(v => v === 'quiz' ? 'history' : 'quiz')}
                isHistoryView={view === 'history'}
                user={user}
            />

            <main className="container">
                {view === 'history' && user ? (
                    <HistoryPage
                        userId={user.id}
                        questions={questions}
                        onJumpToQuestion={handleJumpToQuestion}
                    />
                ) : (
                    <>
                        <QuestionCard
                            question={currentQuestion}
                            questionNumber={currentIndex + 1}
                            totalQuestions={questions.length}
                            language={language}
                            userAnswer={userAnswers[currentQuestion.id]}
                            onSubmit={handleSubmitAnswer}
                            onRequestTheory={handleRequestTheory}
                            onRequestExplanation={handleRequestExplanation}
                            loadingAction={aiLoading ? activeAISection : null}
                        />

                        {aiLoading && <Loading message="AI is thinking..." />}

                        {!aiLoading && activeAISection === 'theory' && aiContent[theoryCacheKey] && (
                            <AIContent
                                type="theory"
                                content={aiContent[theoryCacheKey]}
                                language={language}
                            />
                        )}

                        {!aiLoading && activeAISection === 'explanation' && aiContent[explanationCacheKey] && (
                            <AIContent
                                type="explanation"
                                content={aiContent[explanationCacheKey]}
                                language={language}
                                discussionLink={currentQuestion.discussion_link}
                            />
                        )}

                        <Navigation
                            currentIndex={currentIndex}
                            totalQuestions={questions.length}
                            language={language}
                            onPrevious={handlePrevious}
                            onNext={handleNext}
                            onJumpToQuestion={handleJumpToQuestion}
                        />
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}

export default App;
