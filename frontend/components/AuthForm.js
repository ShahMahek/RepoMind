'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '../lib/api';
import { saveAuth } from '../lib/auth';

export default function AuthForm({ mode }) {
  const router = useRouter();
  const isLogin = mode === 'login';
  const canvasRef = useRef(null);

  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Node animation ────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const labels = ['main','feat/ai','fix/auth','PR #12','PR #8','Issue #3',
                    'merge','commit','branch','fork','HEAD','origin','dev',
                    'v1.2','push','clone'];
    const NODE_COUNT = 16;
    let nodes = [];
    let pkt = null;
    let animId;

    function resize() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      nodes = labels.map(() => ({
        x: 20 + Math.random() * (canvas.width  - 40),
        y: 20 + Math.random() * (canvas.height - 40),
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        r:  Math.random() * 2.5 + 2.5,
        label: labels[Math.floor(Math.random() * labels.length)],
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.018 + Math.random() * 0.012,
        big: Math.random() > 0.5,
      }));
    }

    function spawnPkt() {
      const f = Math.floor(Math.random() * NODE_COUNT);
      let t = Math.floor(Math.random() * NODE_COUNT);
      while (t === f) t = Math.floor(Math.random() * NODE_COUNT);
      pkt = { f, t, prog: 0 };
    }

    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < NODE_COUNT; i++) {
        for (let j = i + 1; j < NODE_COUNT; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(33,110,57,${(1 - dist/120) * 0.18})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      if (!pkt) spawnPkt();
      pkt.prog += 0.012;
      if (pkt.prog >= 1) { spawnPkt(); }
      else {
        const a = nodes[pkt.f], b = nodes[pkt.t];
        const px = a.x + (b.x - a.x) * pkt.prog;
        const py = a.y + (b.y - a.y) * pkt.prog;
        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(33,110,57,0.65)'; ctx.fill();
        ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(33,110,57,0.1)';  ctx.fill();
      }

      nodes.forEach(n => {
        n.phase += n.phaseSpeed;
        const pulse = 0.5 + 0.5 * Math.sin(n.phase);
        if (n.big) {
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 7, 0, Math.PI*2);
          ctx.fillStyle = `rgba(46,160,67,${0.05 + pulse*0.08})`; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
        ctx.fillStyle = n.big
          ? `rgba(33,110,57,${0.5 + pulse*0.4})`
          : `rgba(100,180,100,${0.25 + pulse*0.2})`;
        ctx.fill();
        if (n.big) {
          ctx.font = '9px "JetBrains Mono", "Courier New", monospace';
          ctx.fillStyle = `rgba(33,80,33,${0.4 + pulse*0.35})`;
          ctx.fillText(n.label, n.x + n.r + 5, n.y + 3.5);
        }
        n.x += n.vx; n.y += n.vy;
        if (n.x < 10 || n.x > W - 10) n.vx *= -1;
        if (n.y < 10 || n.y > H - 10) n.vy *= -1;
      });

      animId = requestAnimationFrame(draw);
    }

    resize();
    spawnPkt();
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);
  // ─────────────────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!isLogin) {
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
      if (password.length < 6)          { setError('Password must be at least 6 characters.'); return; }
      if (username.length < 3)          { setError('Username must be at least 3 characters.'); return; }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setError('Username can only contain letters, numbers and underscores.'); return;
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
    <div className="auth-page-bg">
      <div className={`auth-switch-card ${isLogin ? 'is-login' : 'is-register'}`}>

        {/* ── Animated left/right panel ── */}
        <div className="auth-panel">
          <canvas ref={canvasRef} className="auth-panel-canvas" />

       {/* Animated wavy curve */}
          <svg className="auth-panel-wave" viewBox="0 0 80 900" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="#ffffff">
              <animate
                attributeName="d"
                dur="6s"
                repeatCount="indefinite"
                values="
                  M20,0 C80,100 -20,200 50,350 C110,490 -20,580 30,700 C70,810 10,870 20,900 L80,900 L80,0 Z;
                  M30,0 C100,120 -30,220 40,370 C100,500 -10,600 20,720 C55,830 0,880 30,900 L80,900 L80,0 Z;
                  M20,0 C80,100 -20,200 50,350 C110,490 -20,580 30,700 C70,810 10,870 20,900 L80,900 L80,0 Z
                "
              />
            </path>
          </svg>
          {/* Animated border line */}
          <svg className="auth-panel-wave-border" viewBox="0 0 80 900" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="none" stroke="#c8ddc8" strokeWidth="1.5">
              <animate
                attributeName="d"
                dur="6s"
                repeatCount="indefinite"
                values="
                  M20,0 C80,100 -20,200 50,350 C110,490 -20,580 30,700 C70,810 10,870 20,900;
                  M30,0 C100,120 -30,220 40,370 C100,500 -10,600 20,720 C55,830 0,880 30,900;
                  M20,0 C80,100 -20,200 50,350 C110,490 -20,580 30,700 C70,810 10,870 20,900
                "
              />
            </path>
          </svg>
          <div className="auth-panel-brand">
            <div className="auth-panel-logo">
              <svg viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577
                  0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7
                  3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236
                  1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3
                  -5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176
                  0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405
                  2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23
                  1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22
                  0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295
                  24 12c0-6.63-5.37-12-12-12"/>
              </svg>
            </div>
            <span className="auth-panel-name">RepoMind</span>
          </div>

          <div className="auth-panel-copy">
            <div className="auth-panel-heading">
              Your GitHub,<br /><span>reimagined.</span>
            </div>
            <p className="auth-panel-sub">
              Create repos, manage PRs and issues — all through conversation.
            </p>
          </div>
        </div>

        {/* ── Form panel ── */}
        <div className="auth-form-panel">
          <div className="text-center mb-6">
            <h1 style={{ color: '#216e39', fontSize: '2.25rem', fontWeight: 800, fontFamily: 'Inter, sans-serif' }}>
              {isLogin ? 'Log in' : 'Register'}
            </h1>
            <p style={{ color: '#557055', marginTop: '6px', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </p>
          </div>

          <div className="auth-tabs">
            <a href="/login"
              onClick={(e) => { e.preventDefault(); router.push('/login'); }}
              className={`auth-tab ${isLogin ? 'active' : ''}`}>
              Sign in
            </a>
            <a href="/register"
              onClick={(e) => { e.preventDefault(); router.push('/register'); }}
              className={`auth-tab ${!isLogin ? 'active' : ''}`}>
              Register
            </a>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {isLogin && (
              <div>
                <label className="auth-field-label">// Username_or_Email</label>
                <input
                  type="text" value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="Enter email or username" required
                  className="w-full bg-[#f7faf7] border border-[#c8ddc8] rounded-lg
                    px-3 py-2.5 text-[#1a3a1a] placeholder-[#a0baa0] text-sm
                    focus:outline-none focus:border-[#216e39] focus:ring-1
                    focus:ring-[#216e39]/20 transition-all"
                />
              </div>
            )}

            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="auth-field-label">// Username</label>
                  <input
                    type="text" value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. name123" required
                    className="w-full bg-[#f7faf7] border border-[#c8ddc8] rounded-lg
                      px-3 py-2.5 text-[#1a3a1a] placeholder-[#a0baa0] text-sm
                      focus:outline-none focus:border-[#216e39] focus:ring-1
                      focus:ring-[#216e39]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="auth-field-label">// Email</label>
                  <input
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@gmail.com" required
                    className="w-full bg-[#f7faf7] border border-[#c8ddc8] rounded-lg
                      px-3 py-2.5 text-[#1a3a1a] placeholder-[#a0baa0] text-sm
                      focus:outline-none focus:border-[#216e39] focus:ring-1
                      focus:ring-[#216e39]/20 transition-all"
                  />
                </div>
              </div>
            )}

            {isLogin ? (
              <div>
                <label className="auth-field-label">// Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password" required
                    className="w-full bg-[#f7faf7] border border-[#c8ddc8] rounded-lg
                      px-3 py-2.5 pr-10 text-[#1a3a1a] placeholder-[#a0baa0] text-sm
                      focus:outline-none focus:border-[#216e39] focus:ring-1
                      focus:ring-[#216e39]/20 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a8a6a] hover:text-[#216e39] transition-colors">
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="auth-field-label">// Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter password" required
                      className="w-full bg-[#f7faf7] border border-[#c8ddc8] rounded-lg
                        px-3 py-2.5 pr-10 text-[#1a3a1a] placeholder-[#a0baa0] text-sm
                        focus:outline-none focus:border-[#216e39] focus:ring-1
                        focus:ring-[#216e39]/20 transition-all"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a8a6a] hover:text-[#216e39] transition-colors">
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="auth-field-label">// Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password" required
                      className={`w-full bg-[#f7faf7] border rounded-lg px-3 py-2.5 pr-10
                        text-[#1a3a1a] placeholder-[#a0baa0] text-sm focus:outline-none
                        transition-all focus:ring-1
                        ${confirmPassword && password !== confirmPassword
                          ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                          : confirmPassword && password === confirmPassword
                            ? 'border-[#216e39] focus:border-[#216e39] focus:ring-[#216e39]/20'
                            : 'border-[#c8ddc8] focus:border-[#216e39] focus:ring-[#216e39]/20'
                        }`}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a8a6a] hover:text-[#216e39] transition-colors">
                      {showConfirm ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {confirmPassword && (
                    <p className={`text-xs mt-1 ${password === confirmPassword ? 'text-[#216e39]' : 'text-red-400'}`}>
                      {password === confirmPassword ? '✓ Match' : '✗ No match'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 flex items-start gap-2">
                <span className="text-red-400 text-sm">⚠️</span>
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-[#216e39] hover:bg-[#1a5c2e] disabled:opacity-50
                disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg
                transition-colors duration-150 text-sm mt-1"
            >
              {loading
                ? (isLogin ? 'Signing in...' : 'Creating account...')
                : (isLogin ? 'Sign in →' : 'Create account →')}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#d4e8d4] text-center auth-mobile-switch">
            <p className="text-[#6a8a6a] text-sm">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <a href={isLogin ? '/register' : '/login'}
                className="text-[#216e39] hover:text-[#1a5c2e] font-medium transition-colors">
                {isLogin ? 'Sign up free' : 'Sign in'}
              </a>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}