import axios from 'axios';

const PERSISTANCE_API_URL = 'http://localhost:8090/api/persistance/utilisateurs';

class PlannerService {
    constructor() {}
    
    // Helper pour obtenir le token
    getAuthHeader() {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    // Helper pour gérer les erreurs
    handleError(error) {
        if (error.response) {
            console.error('[PlannerService] HTTP error', {
                status: error.response.status,
                url: error.config?.url,
                data: error.response.data
            });
            const message = error.response.data?.error || error.response.data?.message || 'Une erreur est survenue';
            throw new Error(message);
        } else if (error.request) {
            console.error('[PlannerService] No response', { url: error.config?.url });
            throw new Error('Impossible de contacter le serveur');
        } else {
            console.error('[PlannerService] Error', error);
            throw new Error(error.message);
        }
    }

    /**
     * Récupérer la planification pour une semaine spécifique
     * GET /api/persistance/utilisateurs/{utilisateurId}/planification/{semaine}/{annee}
     */
    async getPlanification(utilisateurId, semaine, annee) {
        try {
            const url = `${PERSISTANCE_API_URL}/${utilisateurId}/planification/${semaine}/${annee}`;
            console.log('[PlannerService] GET', url);
            
            const response = await axios.get(url, { 
                headers: this.getAuthHeader()
            });
            
            console.log('[PlannerService] Réponse reçue:', {
                status: response.status,
                data: response.data
            });
            
            return response.data;
        } catch (error) {
            console.error('[PlannerService] Erreur getPlanification:', {
                url: error.config?.url,
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            this.handleError(error);
        }
    }

    /**
     * Ajouter/modifier un repas pour un jour
     * POST /api/persistance/utilisateurs/{utilisateurId}/planification/{semaine}/{annee}/jour/{jour}/repas
     * @param {Object} params
     * @param {number} params.utilisateurId
     * @param {number} params.semaine
     * @param {number} params.annee
     * @param {number} params.jour - 0=lundi, 6=dimanche
     * @param {number} params.typeRepas - 0=petit-déj, 1=déjeuner, 2=dîner
     * @param {number} params.recetteId - ID de la recette (optionnel)
     * @param {string} params.noteLibre - Note libre (optionnel)
     */
    async addOrUpdateRepas({ utilisateurId, semaine, annee, jour, typeRepas, recetteId, noteLibre }) {
        try {
            const response = await axios.post(
                `${PERSISTANCE_API_URL}/${utilisateurId}/planification/${semaine}/${annee}/jour/${jour}/repas`,
                {
                    typeRepas,
                    recetteId,
                    noteLibre
                },
                { headers: this.getAuthHeader() }
            );
            
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Supprimer un repas planifié
     * DELETE /api/persistance/utilisateurs/{utilisateurId}/planification/{semaine}/{annee}/jour/{jour}/repas/{typeRepas}
     */
    async deleteRepas(utilisateurId, semaine, annee, jour, typeRepas) {
        try {
            const response = await axios.delete(
                `${PERSISTANCE_API_URL}/${utilisateurId}/planification/${semaine}/${annee}/jour/${jour}/repas/${typeRepas}`,
                { headers: this.getAuthHeader() }
            );
            
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Récupérer l'historique des planifications
     * GET /api/persistance/utilisateurs/{utilisateurId}/planifications/historique
     */
    async getPlanificationsHistory(utilisateurId) {
        try {
            const response = await axios.get(
                `${PERSISTANCE_API_URL}/${utilisateurId}/planifications/historique`,
                { headers: this.getAuthHeader() }
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Helper pour obtenir la semaine et l'année actuelles
     */
    getCurrentWeekAndYear() {
        const now = new Date();
        const onejan = new Date(now.getFullYear(), 0, 1);
        const week = Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
        return {
            semaine: week,
            annee: now.getFullYear()
        };
    }

    /**
     * Convertir le nom du jour en index (0-6)
     */
    getDayIndex(dayName) {
        const days = {
            'Lundi': 0,
            'Mardi': 1,
            'Mercredi': 2,
            'Jeudi': 3,
            'Vendredi': 4,
            'Samedi': 5,
            'Dimanche': 6
        };
        return days[dayName];
    }

    /**
     * Convertir le nom du repas en index (0-2)
     */
    getMealIndex(mealName) {
        const meals = {
            'Petit-déjeuner': 0,
            'Déjeuner': 1,
            'Dîner': 2
        };
        return meals[mealName];
    }
}

export default new PlannerService();
