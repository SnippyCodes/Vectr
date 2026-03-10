import { Component } from 'react';
import VectrLogo from './VectrLogo';

/**
 * Global error boundary — catches unhandled React rendering errors
 * and shows a recoverable fallback UI instead of a white screen.
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[Vectr] Uncaught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-bg-primary p-6">
                    <div className="text-center max-w-md">
                        <VectrLogo size={48} />
                        <h1 className="text-xl font-semibold text-text-primary mt-6 mb-2">Something went wrong</h1>
                        <p className="text-text-muted text-sm mb-6">
                            {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
                        </p>
                        <button
                            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
                            className="btn-primary text-sm"
                        >
                            Return to Home
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
