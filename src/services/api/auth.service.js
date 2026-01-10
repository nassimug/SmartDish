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

            // Mettre à jour le localStorage avec les nouvelles données
            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (currentUser) {
                const updatedUser = {
                    ...currentUser,
                    ...response.data
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                console.log('💾 localStorage mis à jour:', updatedUser);
            }

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
     * Changer le mot de passe
     */
    async changePassword(userId, oldPassword, newPassword) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('Token manquant');
            }

            console.log('🔐 Changement de mot de passe pour utilisateur:', userId);

            const response = await axios.put(
                `${API_URL}/${userId}`,
                {
                    ancienMotDePasse: oldPassword,
                    nouveauMotDePasse: newPassword
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Mot de passe changé avec succès');
            return response.data;
        } catch (error) {
            console.error('❌ Erreur changement mot de passe:', error);

            if (error.response) {
                const message = error.response.data?.message || error.response.data?.error || 'Erreur lors du changement de mot de passe';

                // Messages d'erreur spécifiques
                if (error.response.status === 401 || message.includes('incorrect')) {
                    throw new Error('L\'ancien mot de passe est incorrect');
                } else if (error.response.status === 400) {
                    throw new Error('Les données fournies sont invalides');
                } else {
                    throw new Error(message);
                }
            } else if (error.request) {
                throw new Error('Impossible de contacter le serveur');
            } else {
                throw new Error(error.message);
            }
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

    /**
     * Mettre à jour les préférences alimentaires d'un utilisateur
     * PUT /api/utilisateurs/{id}
     */
    async updatePreferences(userId, preferences) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('Token manquant');
            }

            console.log('🔄 Mise à jour des préférences:', preferences);

            const response = await axios.put(
                `${API_URL}/${userId}`,
                preferences,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Préférences mises à jour:', response.data);

            // Mettre à jour localStorage
            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (currentUser) {
                const updatedUser = {
                    ...currentUser,
                    regimesIds: response.data.regimesIds || preferences.regimesIds || currentUser.regimesIds,
                    allergenesIds: response.data.allergenesIds || preferences.allergenesIds || currentUser.allergenesIds,
                    typesCuisinePreferesIds: response.data.typesCuisinePreferesIds || preferences.typesCuisinePreferesIds || currentUser.typesCuisinePreferesIds
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                console.log('💾 localStorage mis à jour:', updatedUser);
            }

            return response.data;
        } catch (error) {
            console.error('❌ Erreur mise à jour préférences:', error);

            if (error.response) {
                const message = error.response.data?.message || error.response.data?.error || 'Erreur serveur';
                throw new Error(message);
            } else if (error.request) {
                throw new Error('Impossible de contacter le serveur');
            } else {
                throw new Error(error.message);
            }
        }
    }
}

export default new AuthService();