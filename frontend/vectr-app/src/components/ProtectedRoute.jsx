import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants';
import VectrBrand from './VectrBrand';

/**
 * Route guard. Redirects unauthenticated users to login.
 * Shows a brief loading state while auth initializes.
 */
export default function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0c0c0c]">
                <div className="flex flex-col items-center">
                    <VectrBrand logoSize={54} showSubtitle={true} />
                    <p className="text-zinc-500 mt-5 animate-pulse text-xs font-mono">Initializing Cockpit...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    return children;
}
