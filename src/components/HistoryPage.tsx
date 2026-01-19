import React, { useEffect, useState } from 'react';
import { UserSubmission, Question } from '../types';
import { getUserSubmissions, clearUserHistory } from '../lib/history-service';
import '../styles/HistoryPage.css';

interface HistoryPageProps {
    userId: string;
    questions: Question[];
    onJumpToQuestion: (index: number) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
    userId,
    questions,
    onJumpToQuestion
}) => {
    const [submissions, setSubmissions] = useState<UserSubmission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, [userId]);

    const loadHistory = async () => {
        setLoading(true);
        const data = await getUserSubmissions(userId);
        setSubmissions(data);
        setLoading(false);
    };

    const handleClearHistory = async () => {
        if (confirm('Are you sure you want to clear your entire history? This cannot be undone.')) {
            await clearUserHistory(userId);
            setSubmissions([]);
        }
    };

    // Group submissions by question_id
    const groupedSubmissions = submissions.reduce((acc, sub) => {
        if (!acc[sub.question_id]) {
            acc[sub.question_id] = [];
        }
        acc[sub.question_id].push(sub);
        return acc;
    }, {} as Record<string, UserSubmission[]>);

    // Sort groups by latest submission time? Or keep original question order?
    // Requirement: "Jump to question"
    // Let's sort groups by most recently submitted question first.
    const sortedGroups = Object.entries(groupedSubmissions).sort(([, aSubs], [, bSubs]) => {
        const aLatest = new Date(aSubs[0].created_at).getTime();
        const bLatest = new Date(bSubs[0].created_at).getTime();
        return bLatest - aLatest;
    });

    if (loading) {
        return <div className="history-page"><div className="loading">Loading history...</div></div>;
    }

    if (submissions.length === 0) {
        return (
            <div className="history-page">
                <div className="empty-state">
                    <h3>No history found</h3>
                    <p>Start answering questions to see your progress here!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="history-page">
            <div className="history-header">
                <div>
                    <h1>Submission History</h1>
                    <div className="history-stats">
                        <span>Total Submissions: {submissions.length}</span>
                        <span>Questions Attempted: {Object.keys(groupedSubmissions).length}</span>
                    </div>
                </div>
                <button onClick={handleClearHistory} className="clear-history-btn">
                    Clear History
                </button>
            </div>

            <div className="history-list">
                {sortedGroups.map(([questionId, groupSubs]) => {
                    const question = questions.find(q => q.id === questionId);
                    // Find actual index in the questions array to jump to
                    const questionIndex = questions.findIndex(q => q.id === questionId);

                    if (!question) return null; // Should not happen unless questions changed

                    return (
                        <div key={questionId} className="history-group">
                            <div className="group-header">
                                <div>
                                    <div className="question-title">
                                        Question {questionIndex + 1}: {question.question.substring(0, 100)}...
                                    </div>
                                    <div className="question-meta">
                                        ID: {questionId}
                                    </div>
                                </div>
                                <button
                                    className="jump-btn"
                                    onClick={() => onJumpToQuestion(questionIndex)}
                                >
                                    Go to Question
                                </button>
                            </div>

                            <div className="submissions-list">
                                {groupSubs.map((sub) => (
                                    <div
                                        key={sub.id}
                                        className={`submission-item ${sub.is_correct ? 'correct' : 'incorrect'}`}
                                    >
                                        <div className="submission-info">
                                            <span className="submission-answer">Answer: {sub.answer}</span>
                                            <span className="submission-time">
                                                {new Date(sub.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className={`status-badge ${sub.is_correct ? 'correct' : 'incorrect'}`}>
                                            {sub.is_correct ? 'Correct' : 'Incorrect'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
