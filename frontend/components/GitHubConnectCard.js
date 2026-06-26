'use client';
import { useState } from 'react';
import Image from 'next/image';
import { githubAPI } from '../lib/api';

export default function GitHubConnectCard({ status, onDisconnect }) {
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    try {
      const data = await githubAPI.getConnectUrl();
      window.location.href = data.url;
    } catch (err) {
      console.error('Connect error:', err);
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    try {
      await githubAPI.disconnect();
      onDisconnect();
    } catch (err) {
      console.error('Disconnect error:', err);
    } finally {
      setLoading(false);
    }
  }

  // ─── Connected State ───────────────────────────
  if (status?.connected) {
    return (
      <div className="bg-brand-darkGray border border-brand-border rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative w-9 h-9 rounded-full overflow-hidden border
              border-brand-border">
              <Image
                src={status.avatarUrl}
                alt={status.githubUsername}
                fill
                className="object-cover"
              />
            </div>
            {/* Info */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-brand-white text-sm font-medium">
                  {status.githubUsername}
                </span>
                <span className="flex items-center gap-1 text-xs text-brand-green">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green
                    inline-block"></span>
                  Connected
                </span>
              </div>
              <p className="text-brand-textMuted text-xs mt-0.5">
                Connected on {new Date(status.connectedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <a
              href={status.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-md border border-brand-border
                text-brand-textMuted hover:text-brand-white hover:border-brand-textMuted
                transition-colors"
            >
              View Profile
            </a>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-md border border-red-800
                text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              {loading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Not Connected State ───────────────────────
  return (
    <div className="bg-brand-darkGray border border-brand-border rounded-xl p-5">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-brand-white font-medium text-sm mb-1">
            Connect GitHub
          </h3>
          <p className="text-brand-textMuted text-xs leading-relaxed max-w-sm">
            Connect your GitHub account to list repositories, manage issues,
            review pull requests, and create repos using AI.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/dashboard/connect"
            className="text-xs px-3 py-1.5 rounded-md border border-brand-border
              text-brand-textMuted hover:text-brand-white transition-colors"
          >
            How to connect?
          </a>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="flex items-center gap-2 text-xs px-4 py-1.5 rounded-md
              bg-brand-green hover:bg-brand-greenHover text-white font-medium
              transition-colors disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
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
            {loading ? 'Connecting...' : 'Connect GitHub'}
          </button>
        </div>
      </div>
    </div>
  );
}