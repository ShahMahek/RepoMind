'use client';
import { useState, useEffect, useRef } from 'react';
import { chatAPI, sessionsAPI } from '../lib/api';
import MessageBubble from './MessageBubble';

const SUGGESTIONS = [
  'List all my repositories',
  'Show open issues in my repo',
  'List open pull requests',
  'Create a new repository',
];

const LOADING_MESSAGES = [
  'Thinking',
  'Thanks for your patience',
  'Almost there',
  'Talking to GitHub',
  'Just a sec',
];

function LoadingMessage() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return <span>{LOADING_MESSAGES[index]}</span>;
}

export default function ChatWindow({ githubConnected, sessionId, onTitleUpdate, onMessageSent, onNewChat }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const bottomRef = useRef(null);

  // ─── Load session messages when sessionId changes ──────
  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    loadSession();
  }, [sessionId]);

  // ─── Auto scroll ───────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function loadSession() {
    setLoadingSession(true);
    try {
      const data = await sessionsAPI.getOne(sessionId);
      setMessages(data.session.messages || []);
    } catch (err) {
      console.error('Failed to load session:', err);
      setMessages([]);
    } finally {
      setLoadingSession(false);
    }
  }

  async function sendMessage(text) {
    const messageText = text || input.trim();
    if (!messageText || loading || !sessionId) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageText }]);
    setLoading(true);

    try {
      const data = await chatAPI.sendMessage(messageText, sessionId);
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      if (data.title && onTitleUpdate) onTitleUpdate(sessionId, data.title);
      if (onMessageSent) onMessageSent();
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `❌ ${err.message || 'Something went wrong. Please try again.'}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ─── No session selected ───────────────────────────────
  if (!sessionId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white
        rounded-xl border border-brand-border">
        <div className="text-center">
          {githubConnected ? (
            <>
              <h3 className="text-brand-text font-medium mb-1">
                Select a chat or start a new one
              </h3>
              <p className="text-brand-textMuted text-sm">
                Click <span
                  onClick={onNewChat}
                  className="font-medium text-brand-green cursor-pointer hover:underline"
                >+ New Chat</span> in the sidebar
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-brand-green/20 border
                border-brand-green/30 flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 16 16" fill="#2ea043">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
                    0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
                    -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87
                    2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95
                    0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12
                    0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27
                    .68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82
                    .44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15
                    0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48
                    0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38
                    A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
              </div>
              <h3 className="text-brand-text font-medium mb-1">Welcome to RepoMind</h3>
              <p className="text-brand-textMuted text-sm">
                Connect your GitHub first to get started
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-brand-black rounded-xl border
      border-brand-border overflow-hidden">

      {/* ─── Header ─────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b
        border-brand-border bg-brand-darkGray">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-green"></div>
          <span className="text-brand-white text-sm font-medium">RepoMind AI</span>
          <span className="text-brand-textMuted text-xs">GPT-4o</span>
        </div>
      </div>

      {/* ─── Messages ───────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loadingSession ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-brand-textMuted text-sm">Loading chat...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <h3 className="text-brand-white font-medium mb-1">New Conversation</h3>
              <p className="text-brand-textMuted text-sm">
                {githubConnected
                  ? 'Ask me anything about your GitHub'
                  : 'Connect GitHub first to get started'}
              </p>
            </div>
            {githubConnected && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-left text-xs px-3 py-2.5 rounded-lg border
                      border-brand-border bg-brand-darkGray text-brand-textMuted
                      hover:text-brand-white hover:border-brand-green/50 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
            {loading && (
              <div className="flex items-center gap-2 mb-4 fade-in">
                <div className="w-7 h-7 rounded-md bg-brand-green flex items-center
      justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="white">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
          0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
          -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87
          2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95
          0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12
          0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27
          .68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82
          .44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15
          0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48
          0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38
          A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                  </svg>
                </div>
                <div className="bg-brand-darkGray border border-brand-border
      rounded-xl rounded-tl-sm px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-textMuted typing-dot" />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-textMuted typing-dot" />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-textMuted typing-dot" />
                  </div>
                  <span className="text-brand-textMuted text-xs italic">
                    <LoadingMessage />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ─── Input ──────────────────────────────── */}
      <div className="px-4 py-3 border-t border-brand-border bg-brand-darkGray">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              githubConnected
                ? 'Ask about your repos, issues, PRs...'
                : 'Connect GitHub to get started...'
            }
            disabled={!githubConnected || loading}
            rows={1}
            className="flex-1 bg-brand-medGray border border-brand-border rounded-lg
              px-3 py-2.5 text-brand-white placeholder-brand-textMuted text-sm
              focus:outline-none focus:border-brand-green transition-colors resize-none
              disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading || !githubConnected}
            className="bg-brand-green hover:bg-brand-greenHover disabled:opacity-40
              disabled:cursor-not-allowed text-white p-2.5 rounded-lg transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-brand-textMuted text-xs mt-1.5">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}