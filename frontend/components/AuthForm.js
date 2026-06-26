'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '../lib/api';
import { saveAuth } from '../lib/auth';

export default function AuthForm({ mode }) {
  const router = useRouter();
  const isLogin = mode === 'login';

  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Client side validation for register
    if (!isLogin) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (username.length < 3) {
        setError('Username must be at least 3 characters.');
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setError('Username can only contain letters, numbers and underscores.');
        return;
      }
    }

    setLoading(true);

    try {
      const data = isLogin
        ? await authAPI.login(identifier, password)
        : await authAPI.register(username, email, password, confirmPassword);

      saveAuth(data.token, data.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen auth-page-bg flex items-center justify-center px-4 relative overflow-hidden">
    
      {/* ─── Switch Card (desktop: sliding panel / mobile: stacked) ── */}
      <div className={`auth-switch-card relative z-10 w-full ${isLogin ? 'is-login' : 'is-register'}`}>

        {/* Sliding brand panel */}
        <div className="auth-panel">
          <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center
            justify-center mb-5 backdrop-blur-sm">
            <svg width="28" height="28" viewBox="0 0 16 16" fill="white">
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
          <h2 className="text-white text-4xl font-bold mb-3">
            {isLogin ? 'New here?' : 'Welcome back'}
          </h2>
          <p className="text-white/80 text-base mb-8 max-w-[280px]">
            {isLogin
              ? 'Create an account and start exploring RepoMind in minutes.'
              : 'Already part of RepoMind? Sign in to pick up where you left off.'}
          </p>
          <a
            href={isLogin ? '/register' : '/login'}
            className="auth-panel-btn"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </a>
        </div>

        {/* Form panel */}
        <div className="auth-form-panel">
          <div className="text-center mb-6">
            <h1 className="text-brand-green text-4xl font-bold">
              {isLogin ? 'Log in' : 'Register'}
            </h1>
            <p className="text-brand-textMuted text-base mt-2">
  {isLogin ? 'Sign in to your account' : 'Create your account'}
</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Login — Email or Username */}
            {isLogin && (
              <div>
                <label className="block text-sm text-brand-textMuted mb-1.5">
                  Email or Username
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter email or username"
                  required
                  className="w-full bg-brand-medGray border border-brand-border rounded-lg
                    px-3 py-2.5 text-brand-white placeholder-brand-textMuted text-sm
                    focus:outline-none focus:border-brand-green focus:ring-1
                    focus:ring-brand-green/20 transition-all"
                />
              </div>
            )}

            {/* Register — Username + Email (row 1, 2-up) */}
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3 ">
                <div>
                  <label className="block text-sm text-brand-textMuted
                   mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. name123"
                    required
                    className="w-full bg-brand-medGray border border-brand-border rounded-lg
                      px-3 py-2.5 text-brand-white placeholder-brand-textMuted text-sm
                      focus:outline-none focus:border-brand-green focus:ring-1
                      focus:ring-brand-green/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-brand-textMuted mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    required
                    className="w-full bg-brand-medGray border border-brand-border rounded-lg
                      px-3 py-2.5 text-brand-white placeholder-brand-textMuted text-sm
                      focus:outline-none focus:border-brand-green focus:ring-1
                      focus:ring-brand-green/20 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Password (+ Confirm Password as 2-up row on register) */}
            {isLogin ? (
              <div>
                <label className="block text-sm text-brand-textMuted mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full bg-brand-medGray border border-brand-border rounded-lg
                      px-3 py-2.5 pr-10 text-brand-white placeholder-brand-textMuted text-sm
                      focus:outline-none focus:border-brand-green focus:ring-1
                      focus:ring-brand-green/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                      text-brand-textMuted hover:text-brand-white transition-colors"
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45
                          18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11
                          8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-brand-textMuted mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      className="w-full bg-brand-medGray border border-brand-border rounded-lg
                        px-3 py-2.5 pr-10 text-brand-white placeholder-brand-textMuted text-sm
                        focus:outline-none focus:border-brand-green focus:ring-1
                        focus:ring-brand-green/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2
                        text-brand-textMuted hover:text-brand-white transition-colors"
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45
                            18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11
                            8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-brand-textMuted mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      className={`w-full bg-brand-medGray border rounded-lg px-3 py-2.5
                        pr-10 text-brand-white placeholder-brand-textMuted text-sm
                        focus:outline-none transition-all focus:ring-1
                        ${confirmPassword && password !== confirmPassword
                          ? 'border-red-600 focus:border-red-500 focus:ring-red-500/20'
                          : confirmPassword && password === confirmPassword
                            ? 'border-brand-green focus:border-brand-green focus:ring-brand-green/20'
                            : 'border-brand-border focus:border-brand-green focus:ring-brand-green/20'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2
                        text-brand-textMuted hover:text-brand-white transition-colors"
                    >
                      {showConfirm ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45
                            18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11
                            8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {confirmPassword && (
                    <p className={`text-xs mt-1 ${password === confirmPassword ? 'text-brand-green' : 'text-red-400'
                      }`}>
                      {password === confirmPassword
                        ? '✓ Match'
                        : '✗ No match'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg px-3 py-2.5
                flex items-start gap-2">
                <span className="text-red-400 text-sm">⚠️</span>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-green hover:bg-brand-greenHover
                disabled:opacity-50 disabled:cursor-not-allowed text-white
                font-semibold py-2.5 rounded-lg transition-colors duration-150 text-sm
                shadow-lg shadow-brand-green/25 mt-1"
            >
              {loading
                ? (isLogin ? 'Signing in...' : 'Creating account...')
                : (isLogin ? ' Sign in → ' : 'Create account → ')}
            </button>
          </form>

          {/* Switch mode — visible on mobile where the side panel stacks below */}
          <div className="mt-4 pt-4 border-t border-brand-border text-center auth-mobile-switch">
            <p className="text-brand-textMuted text-sm">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <a
                href={isLogin ? '/register' : '/login'}
                className="text-brand-green hover:text-brand-greenHover
                  font-medium transition-colors"
              >
                {isLogin ? 'Sign up free' : 'Sign in'}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}