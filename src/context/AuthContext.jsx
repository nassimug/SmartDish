import { createContext, useContext, useEffect, useState } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Initialiser l'état de manière synchrone pour éviter le clignotement du header
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        return !!token && !!savedUser;
    });
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Validation légère au démarrage pour corriger d'éventuelles données corrompues
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (token && savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                // Réappliquer pour garantir la cohérence
                setIsAuthenticated(true);
                setUser(userData);
            } catch (error) {
                console.error('Erreur lors de la récupération des données utilisateur:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setIsAuthenticated(false);
                setUser(null);
            }
        } else {
            // État non authentifié cohérent
            setIsAuthenticated(false);
            setUser(null);
        }
        setLoading(false);
    }, []);

    const login = (token, userData) => {
        // Sauvegarder dans localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));

        // Mettre à jour l'état
        setIsAuthenticated(true);
        setUser(userData);
    };

    const logout = () => {
        // Nettoyer localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('tokenType');
        localStorage.removeItem('user');

        // Mettre à jour l'état
        setIsAuthenticated(false);
        setUser(null);
    };

    const updateUser = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const value = {
        isAuthenticated,
        loading,
        user,
        login,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};