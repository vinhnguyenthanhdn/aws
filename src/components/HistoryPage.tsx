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
        return (
            <div className="history-page">
                <div className="loading-container" style={{ textAlign: 'center', padding: '3rem' }}>
                    Loading history...
                </div>
            </div>
        );
    }

    if (submissions.length === 0) {
        return (
            <div className="history-page fade-in">
                <div className="empty-state">
                    <h3>No history found</h3>
                    <p>Start answering questions to see your progress here!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="history-page fade-in">
            {/* Header Section */}
            <div className="history-header">
                <div className="header-left">
                    <h2 className="history-title">Submission History</h2>
                    <div className="history-stats">
                        <span className="stat-item">
                            <strong>{submissions.length}</strong> Total Submissions
                        </span>
                        <span className="stat-divider">•</span>
                        <span className="stat-item">
                            <strong>{Object.keys(groupedSubmissions).length}</strong> Questions Attempted
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleClearHistory}
                    className="btn-clear-history"
                >
                    Clear History
                </button>
            </div>

            {/* List Section */}
            <div className="history-list">
                {sortedGroups.map(([questionId, groupSubs]) => {
                    const question = questions.find(q => q.id === questionId);
                    const questionIndex = questions.findIndex(q => q.id === questionId);

                    if (!question) return null;

                    return (
                        <div key={questionId} className="history-group">
                            <div className="group-header">
                                <div className="question-info">
                                    <div className="question-identifier">
                                        Question {questionIndex + 1}:
                                    </div>
                                    <div className="question-text-preview">
                                        {question.question}
                                    </div>
                                </div>
                                <button
                                    className="btn-jump"
                                    onClick={() => onJumpToQuestion(questionIndex)}
                                >
                                    Jump to Question
                                </button>
                            </div>

                            <div className="submissions-list">
                                {groupSubs.map((sub, idx) => {
                                    const submissionDate = new Date(sub.created_at);
                                    const formattedDate = submissionDate.toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    });
                                    const formattedTime = submissionDate.toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                    });

                                    return (
                                        <div key={sub.id} className="submission-item-compact">
                                            <div className="sub-left-content">
                                                <span className="attempt-number">#{groupSubs.length - idx}</span>
                                                <span className={`status-tag ${sub.is_correct ? 'correct' : 'incorrect'}`}>
                                                    {sub.is_correct ? 'CORRECT' : 'INCORRECT'}
                                                </span>
                                                <span className="answer-text">
                                                    You chose: <strong>{sub.answer}</strong>
                                                </span>
                                            </div>

                                            <div className="sub-right-content">
                                                <span className="sub-datetime">
                                                    {formattedDate} <span className="time-separator">at</span> {formattedTime}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
