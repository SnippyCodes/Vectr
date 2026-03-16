import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { patAPI, authAPI } from '../services/api';
import { useToast } from '../components/Toast';
import { ROUTES, EXPERIENCE_LEVELS } from '../constants';

export default function SettingsPage() {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    
    const [pat, setPat] = useState('');
    const [showPat, setShowPat] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [updatingExp, setUpdatingExp] = useState(false);

    const handleExperienceChange = async (e) => {
        const newLevel = e.target.value;
        setUpdatingExp(true);
        try {
            await authAPI.updateExperience(user.email, newLevel);
            updateUser({ experienceLevel: newLevel });
            showToast('Experience level updated successfully!', 'success');
        } catch (err) {
            showToast(err.message || 'Failed to update experience level.', 'error');
        } finally {
            setUpdatingExp(false);
        }
    };

    const handleUpdatePat = async () => {
        const trimmed = pat.trim();
        if (!trimmed) {
            setError('Please enter a valid GitHub Personal Access Token');
            return;
        }
        if (!trimmed.startsWith('ghp_') && !trimmed.startsWith('github_pat_')) {
            setError('Invalid PAT format. GitHub PATs start with ghp_ or github_pat_');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const data = await patAPI.validate(user.email, trimmed);
            updateUser({ hasPat: true, githubUsername: data.github_username });
            showToast('GitHub PAT updated successfully!', 'success');
            setPat(''); // Clear the input after success
        } catch (err) {
            setError(err.message || 'Failed to update PAT. Please check and try again.');
        } finally {
            setLoading(false);
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate(ROUTES.LOGIN);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto fade-in">
            <h1 className="text-2xl font-semibold text-text-primary mb-8">Settings</h1>

            <div className="glass-card p-6 mb-8">
                <h2 className="text-lg font-medium text-text-primary mb-2">GitHub Personal Access Token</h2>
                <p className="text-sm text-text-muted mb-6">
                    Update your GitHub Personal Access Token (PAT). Your token is encrypted securely on our servers.
                </p>

                {error && (
                    <div className="mb-4 p-3 rounded-lg text-sm" style={{
                        background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171'
                    }}>
                        {error}
                    </div>
                )}

                <div className="max-w-md">
                    <label htmlFor="pat-input" className="text-text-secondary text-sm mb-1 block">New GitHub PAT</label>
                    <div className="relative mb-4">
                        <input
                            id="pat-input"
                            type={showPat ? 'text' : 'password'}
                            value={pat}
                            onChange={e => setPat(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !loading && handleUpdatePat()}
                            placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            className="input-dark pr-12"
                            autoComplete="off"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPat(!showPat)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                            aria-label={showPat ? 'Hide PAT' : 'Show PAT'}
                            tabIndex={-1}
                        >
                            {showPat ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>
                    </div>

                    <button 
                        onClick={handleUpdatePat} 
                        disabled={loading || !pat.trim()} 
                        className="btn-primary text-sm"
                    >
                        {loading ? <><span className="spinner"></span> Updating...</> : 'Update PAT'}
                    </button>
                </div>
            </div>
            
            <div className="glass-card p-6">
                <h2 className="text-lg font-medium text-text-primary mb-2">Account Details</h2>
                <div className="space-y-4 max-w-md">
                    <div>
                        <p className="text-sm text-text-muted mb-1">Email</p>
                        <p className="text-text-primary font-medium">{user?.email}</p>
                    </div>
                    <div>
                        <p className="text-sm text-text-muted mb-1">GitHub Username</p>
                        <p className="text-text-primary font-medium">{user?.githubUsername || 'Not linked'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-text-muted mb-1">Experience Level</p>
                        <div className="flex items-center gap-3">
                            <select 
                                value={user?.experienceLevel || ''} 
                                onChange={handleExperienceChange}
                                disabled={updatingExp}
                                className="bg-bg-panel border border-border-default/50 rounded-lg px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:border-accent-cyan cursor-pointer w-48"
                            >
                                <option value="" disabled>Select Level</option>
                                {EXPERIENCE_LEVELS.map(level => (
                                    <option key={level.value} value={level.value}>{level.label}</option>
                                ))}
                            </select>
                            {updatingExp && <span className="spinner small"></span>}
                        </div>
                    </div>
                </div>

                <div className="mt-8 border-t border-border-default/50 pt-6">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-status-rejected/90 hover:bg-status-rejected transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Logout
                    </button>
                    <p className="text-xs text-text-muted mt-2">Sign out from this Device.</p>
                </div>
            </div>
        </div>
    );
}
