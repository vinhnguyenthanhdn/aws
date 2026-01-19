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

    // Sort groups by latest submission time
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
        <div className="history-page fade-in">
            <div className="history-header">
                <div>
                    <h2>Submission History</h2>
                    <div className="history-stats">
                        <span><strong>{submissions.length}</strong> Total Submissions</span>
                        <span>•</span>
                        <span><strong>{Object.keys(groupedSubmissions).length}</strong> Questions Attempted</span>
                    </div>
                </div>
                <button onClick={handleClearHistory} className="btn btn-error btn-sm">
                    Clear History
                </button>
            </div>

            <div className="history-list">
                {sortedGroups.map(([questionId, groupSubs]) => {
                    const question = questions.find(q => q.id === questionId);
                    const questionIndex = questions.findIndex(q => q.id === questionId);

                    if (!question) return null;

                    return (
                        <div key={questionId} className="history-group">
                            <div className="group-header">
                                <div style={{ flex: 1 }}>
                                    <div className="question-title">
                                        Question {questionIndex + 1}: {question.question.substring(0, 120)}...
                                    </div>
                                    <div className="question-meta">
                                        ID: {questionId}
                                    </div>
                                </div>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => onJumpToQuestion(questionIndex)}
                                    style={{ marginLeft: '1rem' }}
                                >
                                    Jump to Question
                                </button>
                            </div>

                            <div className="submissions-list">
                                {groupSubs.map((sub, idx) => (
                                    <div
                                        key={sub.id}
                                        className={`submission-item ${sub.is_correct ? 'correct' : 'incorrect'}`}
                                    >
                                        <div className="submission-info">
                                            <span style={{ fontWeight: 'bold', width: '2rem' }}>#{groupSubs.length - idx}</span>
                                            <div className={`status-badge ${sub.is_correct ? 'correct' : 'incorrect'}`}>
                                                {sub.is_correct ? 'Correct' : 'Incorrect'}
                                            </div>
                                            <span className="submission-answer">You chose: {sub.answer}</span>
                                        </div>
                                        <span className="submission-time">
                                            {new Date(sub.created_at).toLocaleString()}
                                        </span>
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
