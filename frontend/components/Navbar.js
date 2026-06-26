'use client';
import { useState } from 'react';
import { githubAPI } from '../lib/api';

export default function Navbar({ githubStatus, onDisconnect, onConnect }) {
  const [loading, setLoading] = useState(false);
 const [showTokenModal, setShowTokenModal] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loadingToken, setLoadingToken] = useState(false);
async function openTokenModal() {
    setShowTokenModal(true);
    setLoadingToken(true);
    try {
      const data = await githubAPI.getToken();
      if (data.hasToken) {
        setToken(data.token);
      }
    } catch (err) {
      // No token stored, fine
    } finally {
      setLoadingToken(false);
    }
  }

  async function handleConnect() {
    setError('');
    if (!token.trim()) {
      setError('Please paste your GitHub token.');
      return;
    }
    setLoading(true);
    try {
      const data = await githubAPI.connect(token.trim());
      setToken('');
      setShowTokenModal(false);
      if (onConnect) onConnect(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    try {
      await githubAPI.disconnect();
      if (onDisconnect) onDisconnect();
    } catch (err) {
      console.error('Disconnect error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <nav className="w-full border-b border-brand-border bg-white px-4 py-2.5
  flex-shrink-0 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-brand-green flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
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
          <span className="text-brand-text font-semibold text-lg">RepoMind</span>
        </div>

        {/* ─── Connected ──────────────────────── */}
       {githubStatus?.connected && (
        <div className="flex items-center gap-3">
            {githubStatus.avatarUrl && (
              <img
                src={githubStatus.avatarUrl}
                alt={githubStatus.githubUsername}
                className="w-7 h-7 rounded-full border border-brand-border"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-brand-text text-sm font-medium">
                  {githubStatus.githubUsername}
                </span>
                <span className="flex items-center gap-1 text-xs text-brand-green
                  font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green inline-block" />
                  Connected
                </span>
              </div>
              <p className="text-brand-textMuted text-xs">
                Connected on {new Date(githubStatus.connectedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <a
                href={githubStatus.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded-md border border-brand-border
                  text-brand-textMuted hover:text-brand-text hover:bg-brand-medGray
                  transition-colors"
              >
                View Profile
              </a>
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-md border border-red-300
                  text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {loading ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          </div>
        )}

        {/* ─── Not connected ──────────────────── */}
        {githubStatus && !githubStatus.connected && (
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <button
                 onClick={openTokenModal}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md
                  bg-brand-green hover:bg-brand-greenHover text-white font-medium
                  transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
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
                Connect GitHub
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ─── Token Modal ──────────────────────── */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center
          bg-black/30 backdrop-blur-sm">
          <div className="bg-white border border-brand-border rounded-2xl shadow-xl
            w-full max-w-md mx-4 p-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-brand-text font-semibold text-base">
                  Connect GitHub
                </h3>
                <p className="text-brand-textMuted text-xs mt-0.5">
                  Paste your Personal Access Token below
                </p>
              </div>
              <button
                onClick={() => { setShowTokenModal(false); setError(''); setToken(''); }}
                className="text-brand-textMuted hover:text-brand-text transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Steps hint */}
            <div className="bg-brand-darkGray border border-brand-border rounded-lg
  p-3 mb-4 text-xs text-brand-textMuted space-y-1">
              <p className="font-medium text-brand-text mb-1">How to get your token:</p>
              <p>1. Go to <span className="text-brand-green font-medium">
                github.com → Settings → Developer Settings</span></p>
              <p>2. Click <span className="font-medium">Personal access tokens
                → Tokens (classic)</span></p>
              <p>3. Click <span className="font-medium">Generate new token (classic)</span></p>
              <p>4. Give it a name like <span className="font-medium">RepoMind</span> and set expiry</p>
              <p>5. Select these scopes:</p>
              <div className="ml-3 mt-1 space-y-1.5 bg-white border border-brand-border
    rounded-lg p-2">
                <p>✅ <code className="bg-brand-darkGray border border-brand-border px-1
      rounded font-bold">repo</code>
                  {' '}<span className="text-brand-textMuted">— tick the top level one</span></p>
                <p>✅ <code className="bg-brand-darkGray border border-brand-border px-1
      rounded">read:user</code>
                  {' '}<span className="text-brand-textMuted">— under user section</span></p>
                <p>✅ <code className="bg-brand-darkGray border border-brand-border px-1
      rounded">read:org</code>
                  {' '}<span className="text-brand-textMuted">— under admin:org section</span></p>

                <p>⚠️ <code className="bg-brand-darkGray border border-brand-border px-1
                  rounded">delete_repo</code>
                  {' '}<span className="text-brand-textMuted">— optional, only if you want
                    RepoMind to delete repositories</span></p>
                <p className="text-red-400 text-xs mt-1">
                  ⚠️ Do NOT select full user or admin:org — only the sub-scopes above
                </p>

              </div>
              <p className="mt-1">6. Click <span className="font-medium">Generate token</span>
                → copy it immediately!</p>
            </div>

            {/* Token input */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-brand-textMuted
                mb-1.5 uppercase tracking-wide">
                Personal Access Token
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={loadingToken ? 'Loading...' : 'ghp_xxxxxxxxxxxxxxxxxxxx'}
                disabled={loadingToken}
                className="w-full bg-brand-darkGray border border-brand-border
                  rounded-lg px-3 py-2.5 text-brand-text text-sm font-mono
                  focus:outline-none focus:border-brand-green focus:ring-1
                  focus:ring-brand-green/20 transition-all"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3
                py-2.5 mb-4 flex items-start gap-2">
                <span className="text-red-500 text-sm">⚠️</span>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowTokenModal(false); setError(''); setToken(''); }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-brand-border
                  text-brand-textMuted hover:text-brand-text text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={loading || !token.trim()}
                className="flex-1 px-4 py-2.5 rounded-lg bg-brand-green
                  hover:bg-brand-greenHover text-white text-sm font-medium
                  transition-colors disabled:opacity-50"
              >
                {loading ? 'Connecting...' : 'Connect GitHub'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}