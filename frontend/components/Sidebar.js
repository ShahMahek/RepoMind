'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sessionsAPI, authAPI } from '../lib/api';
import { clearAuth } from '../lib/auth';

export default function Sidebar({ currentSessionId, onSessionSelect, onNewChat, refreshKey, isOpen, onClose }) {
    const router = useRouter();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        loadSessions();
    }, [currentSessionId, refreshKey]);

    async function loadSessions() {
        try {
            const data = await sessionsAPI.getAll();
            setSessions(data.sessions || []);
        } catch (err) {
            console.error('Failed to load sessions:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(e, sessionId) {
        e.stopPropagation();
        try {
            await sessionsAPI.delete(sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            if (sessionId === currentSessionId) onNewChat();
        } catch (err) {
            console.error('Failed to delete session:', err);
        }
    }

    async function handleLogout() {
        if (loggingOut) return;
        setLoggingOut(true);
        try {
            await authAPI.logout();
        } catch (err) {
            // Continue logout even if API fails
        }
        clearAuth();
        router.push('/login');
    }

    function formatTime(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diffHours = (now - date) / (1000 * 60 * 60);
        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
        return date.toLocaleDateString();
    }

    return (
        <div className={`sidebar-panel fixed md:static top-0 left-0 z-50
            w-64 bg-brand-darkGray border-r border-brand-border
            flex flex-col flex-shrink-0
            ${isOpen ? '' : 'closed'}`}
            style={{ height: 'calc(100vh - 57px)', top: '57px' }}>

            {/* ─── Toggle + New Chat ──────────────────── */}
            <div className="px-3 pt-3 pb-3 flex items-center gap-2">
                <button
                    onClick={onClose}
                    className="p-2 rounded-lg border border-brand-border text-brand-textMuted
                        hover:text-brand-text hover:bg-brand-medGray transition-colors flex-shrink-0"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <line x1="9" y1="3" x2="9" y2="21" />
                    </svg>
                </button>
                <button
                    onClick={onNewChat}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2
                        bg-brand-green hover:bg-brand-greenHover text-white text-sm font-medium
                        rounded-lg transition-colors"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New Chat
                </button>
            </div>

            {/* ─── Sessions list ───────────────────────── */}
            <div className="flex-1 overflow-y-auto py-2">
                {loading ? (
                    <div className="space-y-2 px-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-10 bg-brand-medGray rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="px-3 py-6 text-center">
                        <p className="text-brand-textMuted text-xs">No chats yet</p>
                        <p className="text-brand-textMuted text-xs mt-1">Click New Chat to start</p>
                    </div>
                ) : (
                    <div className="space-y-0.5 px-2">
                        {sessions.filter(s => s.messageCount > 0).map(session => (
                            <div
                                key={session.id}
                                onClick={() => onSessionSelect(session.id)}
                                className={`group flex items-center justify-between px-3 py-2.5
                  rounded-lg cursor-pointer transition-colors
                  ${currentSessionId === session.id
                                        ? 'bg-brand-green/10 border border-brand-green/30'
                                        : 'hover:bg-brand-medGray border border-transparent'
                                    }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-medium truncate
                    ${currentSessionId === session.id
                                            ? 'text-brand-green'
                                            : 'text-brand-text'
                                        }`}>
                                        {session.title}
                                    </p>
                                    <p className="text-brand-textMuted text-xs mt-0.5">
                                        {formatTime(session.updatedAt)} · {session.messageCount} msgs
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, session.id)}
                                    className="opacity-0 group-hover:opacity-100 ml-2 p-1 rounded
                    text-brand-textMuted hover:text-red-500 transition-all flex-shrink-0"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6l-1 14H6L5 6" />
                                        <path d="M10 11v6M14 11v6" />
                                        <path d="M9 6V4h6v2" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ─── Logout at bottom ────────────────────── */}
            <div className="p-3 border-t border-brand-border">
                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2
text-brand-textMuted hover:text-red-500 hover:bg-red-50 text-sm
rounded-lg transition-colors border border-brand-border disabled:opacity-50
disabled:cursor-not-allowed"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    {loggingOut ? 'Logging out...' : 'Logout'}
                </button>
            </div>
        </div>
    );
}