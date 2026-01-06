import axios from 'axios';

const API_URL = process.env.REACT_APP_AUTH_SERVICE_URL || 'http://localhost:8092/api/utilisateurs';

class AuthService {
    /**
     * Inscription d'un nouvel utilisateur
     */
    async register(userData) {
        try {
            const response = await axios.post(`${API_URL}/register`, userData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Connexion d'un utilisateur
     */
    async login(credentials) {
        try {
            const response = await axios.post(`${API_URL}/login`, credentials);

            // Sauvegarder le token dans localStorage
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('tokenType', response.data.type || 'Bearer');
            }

            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Déconnexion
     */
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('tokenType');
        localStorage.removeItem('user');
    }

    /**
     * Récupérer le token actuel
     */
    getToken() {
        return localStorage.getItem('token');
    }

    /**
     * Vérifier si l'utilisateur est connecté
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Récupérer l'utilisateur par email
     */
    async getUserByEmail(email) {
        try {
            const token = this.getToken();
            const response = await axios.get(`${API_URL}/email/${email}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Récupérer l'utilisateur par ID
     */
    async getUserById(id) {
        try {
            const token = this.getToken();
            const response = await axios.get(`${API_URL}/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Mettre à jour un utilisateur
     */
    async updateUser(id, userData) {
        try {
            const token = this.getToken();
            console.log('🔵 [AuthService] updateUser called');
            console.log('   URL:', `${API_URL}/${id}`);
            console.log('   Data:', JSON.stringify(userData, null, 2));
            console.log('   Token:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
            
            const response = await axios.put(`${API_URL}/${id}`, userData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ [AuthService] Update successful:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ [AuthService] Update failed');
            console.error('   Status:', error.response?.status);
            console.error('   Data:', error.response?.data);
            console.error('   Headers:', error.response?.headers);
            throw this.handleError(error);
        }
    }

    /**
     * Demander la réinitialisation du mot de passe
     */
    async forgotPassword(email) {
        try {
            const response = await axios.post(`${API_URL}/forgot-password`, { email });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Réinitialiser le mot de passe avec le token
     */
    async resetPassword(token, newPassword) {
        try {
            const response = await axios.post(`${API_URL}/reset-password`, {
                token,
                newPassword
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Vérifier la validité du token de réinitialisation
     */
    async verifyResetToken(token) {
        try {
            const response = await axios.get(`${API_URL}/verify-reset-token/${token}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Gérer les erreurs de l'API
     */
    handleError(error) {
        if (error.response) {
            // Erreur de réponse du serveur
            const message = error.response.data?.message || error.response.data?.error || 'Une erreur est survenue';
            const status = error.response.status;

            switch (status) {
                case 400:
                    return new Error(`Données invalides: ${message}`);
                case 401:
                    return new Error('Identifiants incorrects');
                case 404:
                    return new Error('Utilisateur non trouvé');
                case 409:
                    return new Error('Cet email est déjà utilisé');
                default:
                    return new Error(message);
            }
        } else if (error.request) {
            // Pas de réponse du serveur
            return new Error('Impossible de contacter le serveur. Vérifiez votre connexion.');
        } else {
            return new Error(error.message);
        }
    }
}

export default new AuthService();