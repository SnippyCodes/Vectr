import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../config/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { ROUTES, APP, EXPERIENCE_LEVELS } from '../constants';
import { useToast } from '../components/Toast';
import VectrLogo from '../components/VectrLogo';
import FeaturesSection from '../components/FeaturesSection';

export default function LoginPage() {
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [level, setLevel] = useState(EXPERIENCE_LEVELS[0].value);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [githubLoading, setGithubLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Check for redirect result on mount (fallback when popup is blocked)
    useEffect(() => {
        getRedirectResult(auth).then(async (result) => {
            if (result?.user) {
                const token = await result.user.getIdToken();
                const data = await authAPI.googleLogin(token);
                login({
                    email: data.email,
                    hasPat: data.has_pat,
                    authType: 'oauth',
                    token,
                    experienceLevel: data.experience_level,
                });
                showToast('Signed in successfully', 'success');
                navigate(ROUTES.PAT);
            }
        }).catch(err => {
            console.error("Auth redirect error:", err);
        });
    }, []);

    const handleGoogleLogin = async () => {
        setError('');
        setGoogleLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const token = await result.user.getIdToken();
            const data = await authAPI.googleLogin(token);
            login({
                email: data.email,
                hasPat: data.has_pat,
                authType: 'google',
                token,
                experienceLevel: data.experience_level,
            });
            showToast('Signed in successfully', 'success');
            navigate(ROUTES.PAT);
        } catch (err) {
            if (err.code === 'auth/popup-blocked' || err.message?.includes('popup-blocked')) {
                try {
                    showToast('Popup blocked by browser. Redirecting to sign in...', 'info');
                    await signInWithRedirect(auth, googleProvider);
                    return;
                } catch (redirectErr) {
                    setError('Browser blocked the popup. Please allow popups or use Email/Password sign in.');
                }
            } else {
                setError(err.message || 'Google sign-in failed. Please try again.');
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleGithubLogin = async () => {
        setError('');
        setGithubLoading(true);
        try {
            const result = await signInWithPopup(auth, githubProvider);
            const token = await result.user.getIdToken();
            const data = await authAPI.googleLogin(token);
            login({
                email: data.email,
                hasPat: data.has_pat,
                authType: 'github',
                token,
                experienceLevel: data.experience_level,
            });
            showToast('Signed in with GitHub successfully', 'success');
            navigate(ROUTES.PAT);
        } catch (err) {
            if (err.code === 'auth/popup-blocked' || err.message?.includes('popup-blocked')) {
                try {
                    showToast('Popup blocked by browser. Redirecting to sign in...', 'info');
                    await signInWithRedirect(auth, githubProvider);
                    return;
                } catch (redirectErr) {
                    setError('Browser blocked the popup. Please allow popups or use Email/Password sign in.');
                }
            } else {
                setError(err.message || 'GitHub sign-in failed. Please try again.');
            }
        } finally {
            setGithubLoading(false);
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            setError('Please fill in all fields');
            return;
        }
        setError('');
        setLoading(true);
        try {
            if (isSignup) {
                await authAPI.emailSignup(email, password, level);
                login({ email, hasPat: false, authType: 'email', experienceLevel: level });
                showToast('Account created! Now set up your GitHub PAT.', 'success');
                navigate(ROUTES.PAT);
            } else {
                const data = await authAPI.emailLogin(email, password);
                login({ email: data.email, hasPat: data.has_pat || false, authType: 'email' });
                showToast('Welcome back! Please connect your GitHub PAT.', 'success');
                navigate(ROUTES.PAT);
            }
        } catch (err) {
            setError(err.message || 'Authentication failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const anyLoading = loading || googleLoading || githubLoading;

    return (
        <div className="login-page">
            {/* ─── Left Panel: Form ─────────────────────────────── */}
            <div className="login-left">
                <div className="login-left-inner">
                    {/* Logo + Name */}
                    <div className="login-logo">
                        <VectrLogo size={28} />
                        <span className="login-logo-name">{APP.NAME.toLowerCase()}</span>
                    </div>

                    {/* Heading */}
                    <h1 className="login-heading">
                        {isSignup ? 'Get started!' : 'Welcome back!'}
                    </h1>
                    <p className="login-subtitle">
                        We empower developers and technical teams to create,
                        simulate, and manage AI-driven workflows visually
                    </p>

                    {/* Error */}
                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    {/* Email / Password Form */}
                    <form onSubmit={handleEmailAuth} className="login-form">
                        <div className="login-field">
                            <label htmlFor="login-email">Email</label>
                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="youremail@yourdomain.com"
                                required
                                autoComplete="email"
                                disabled={anyLoading}
                            />
                        </div>

                        <div className="login-field">
                            <label htmlFor="login-password">Password</label>
                            <input
                                id="login-password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Create a password"
                                required
                                autoComplete={isSignup ? 'new-password' : 'current-password'}
                                disabled={anyLoading}
                            />
                        </div>

                        {isSignup && (
                            <div className="login-field">
                                <label htmlFor="login-level">Experience Level</label>
                                <select
                                    id="login-level"
                                    value={level}
                                    onChange={e => setLevel(e.target.value)}
                                    disabled={anyLoading}
                                >
                                    {EXPERIENCE_LEVELS.map(l => (
                                        <option key={l.value} value={l.value}>{l.label} — {l.description}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={anyLoading}
                            className="login-submit-btn"
                            id="auth-submit-btn"
                        >
                            {loading ? (
                                <><span className="spinner"></span> Please wait...</>
                            ) : (
                                isSignup ? 'Sign up' : 'Sign in'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="login-divider">
                        <span className="login-divider-line"></span>
                        <span className="login-divider-text">or</span>
                        <span className="login-divider-line"></span>
                    </div>

                    {/* Social Buttons */}
                    <div className="login-social-row">
                        {/* Google */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={anyLoading}
                            className="login-social-btn"
                            type="button"
                        >
                            {googleLoading ? (
                                <span className="spinner small"></span>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24">
                                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                                    <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.7-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
                                </svg>
                            )}
                            Google
                        </button>

                        {/* GitHub */}
                        <button
                            onClick={handleGithubLogin}
                            disabled={anyLoading}
                            className="login-social-btn"
                            type="button"
                        >
                            {githubLoading ? (
                                <span className="spinner small"></span>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                </svg>
                            )}
                            GitHub
                        </button>
                    </div>

                    {/* Toggle Signup / Login */}
                    <div className="login-toggle">
                        {isSignup ? (
                            <p>
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => { setIsSignup(false); setError(''); }}
                                    className="login-toggle-btn"
                                >
                                    Sign in
                                </button>
                            </p>
                        ) : (
                            <p>
                                Don't have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => { setIsSignup(true); setError(''); }}
                                    className="login-toggle-btn"
                                >
                                    Sign up
                                </button>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Right Panel: Features Showcase ─────────────── */}
            <FeaturesSection />
        </div>
    );
}
