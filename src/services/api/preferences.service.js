import axios from 'axios';

const PERSISTANCE_API_URL = 'http://localhost:8090/api/persistance';

class PreferencesService {
    constructor() {}

    // Helper pour obtenir le token
    getAuthHeader() {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    // Helper pour gérer les erreurs
    handleError(error) {
        if (error.response) {
            console.error('[PreferencesService] HTTP error', {
                status: error.response.status,
                url: error.config?.url,
                data: error.response.data
            });
            const message = error.response.data?.error || error.response.data?.message || 'Une erreur est survenue';
            throw new Error(message);
        } else if (error.request) {
            console.error('[PreferencesService] No response', { url: error.config?.url });
            throw new Error('Impossible de contacter le serveur');
        } else {
            console.error('[PreferencesService] Error', error);
            throw new Error(error.message);
        }
    }

    /**
     * Récupérer tous les régimes alimentaires disponibles
     * GET /api/persistance/preferences/regimes
     */
    async getAllRegimes() {
        try {
            const response = await axios.get(
                `${PERSISTANCE_API_URL}/preferences/regimes`,
                { headers: this.getAuthHeader() }
            );

            return response.data.map(regime => ({
                ...regime,
                nom: regime.description,
                description: regime.nom
            }));
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Récupérer tous les allergènes disponibles
     * GET /api/persistance/preferences/allergenes
     */
    async getAllAllergenes() {
        try {
            const response = await axios.get(
                `${PERSISTANCE_API_URL}/preferences/allergenes`,
                { headers: this.getAuthHeader() }
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Récupérer tous les types de cuisine disponibles
     * GET /api/persistance/preferences/cuisines
     */
    async getAllTypesCuisine() {
        try {
            const response = await axios.get(
                `${PERSISTANCE_API_URL}/preferences/cuisines`,
                { headers: this.getAuthHeader() }
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }
}

export default new PreferencesService();