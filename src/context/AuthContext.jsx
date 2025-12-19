import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Vérifier l'authentification au démarrage
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');

            if (token && savedUser) {
                try {
                    const userData = JSON.parse(savedUser);
                    setIsAuthenticated(true);
                    setUser(userData);
                } catch (error) {
                    console.error('Erreur lors de la récupération des données utilisateur:', error);
                    // Nettoyer le localStorage si les données sont corrompues
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }

            setLoading(false);
        };

        checkAuth();
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