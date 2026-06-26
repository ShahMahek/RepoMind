'use client';
import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isLoggedIn } from '../../lib/auth';
import { githubAPI, sessionsAPI } from '../../lib/api';
import Navbar from '../../components/Navbar';
import ChatWindow from '../../components/ChatWindow';
import Sidebar from '../../components/Sidebar';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [githubStatus, setGithubStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) router.push('/login');
  }, []);

  useEffect(() => {
    const github = searchParams.get('github');
    const ghuser = searchParams.get('ghuser');
    if (github === 'connected') showNotification('success', `✅ GitHub connected as @${ghuser}!`);
    else if (github === 'denied') showNotification('error', '❌ GitHub connection cancelled.');
    else if (github === 'error') showNotification('error', '❌ GitHub connection failed.');
    if (github) window.history.replaceState({}, '', '/dashboard');
  }, [searchParams]);

  useEffect(() => {
    async function loadStatus() {
      try {
        const status = await githubAPI.getStatus();
        setGithubStatus(status);
        if (status.tokenExpired) {
          showNotification('error', '⚠️ Your GitHub token has expired or been deleted. Please reconnect.');
        }
      } catch (err) {
        console.error('Failed to load GitHub status:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStatus();
  }, []);

  function showNotification(type, message) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }

  async function handleNewChat() {
    try {
      const data = await sessionsAPI.create();
      setCurrentSessionId(data.session.id);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  }

  function handleDisconnect() {
    setGithubStatus({ connected: false });
    showNotification('success', '✅ GitHub disconnected successfully.');
  }

  function handleConnect(data) {
    setGithubStatus({
      connected: true,
      githubUsername: data.githubUsername,
      avatarUrl: data.avatarUrl,
      profileUrl: data.profileUrl,
      connectedAt: new Date().toISOString(),
    });
    showNotification('success', `✅ GitHub connected as @${data.githubUsername}!`);
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border
          text-sm font-medium shadow-lg fade-in max-w-sm
          ${notification.type === 'success'
            ? 'bg-green-50 border-green-300 text-green-700'
            : 'bg-red-50 border-red-300 text-red-700'
          }`}>
          {notification.message}
        </div>
      )}

      <Navbar
        githubStatus={githubStatus}
        onDisconnect={handleDisconnect}
        onConnect={handleConnect}
      />
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <Sidebar
          currentSessionId={currentSessionId}
          onSessionSelect={setCurrentSessionId}
          onNewChat={handleNewChat}
        />

       {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            <ChatWindow
              githubConnected={githubStatus?.connected || false}
              sessionId={currentSessionId}
              onTitleUpdate={() => {}}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-white flex items-center justify-center">
        <p className="text-brand-textMuted text-sm">Loading...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}