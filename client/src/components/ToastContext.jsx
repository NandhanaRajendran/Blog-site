import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toast, setToast] = useState('');

    const showToast = useCallback((message) => {
        setToast(message);
        setTimeout(() => setToast(''), 3000);
    }, []);

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            {toast && (
                <div className="app-toast">
                    {toast}
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const showToast = useContext(ToastContext);
    if (!showToast) {
        throw new Error('useToast must be used inside ToastProvider');
    }
    return showToast;
}
