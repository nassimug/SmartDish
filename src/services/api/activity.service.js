import axios from 'axios';

const PERSISTANCE_API_URL = 'http://localhost:8090/api/persistance/utilisateurs';

class ActivityService {
    // Helper pour obtenir le token
    getAuthHeader() {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    // Helper pour gérer les erreurs
    handleError(error) {
        if (error.response) {
            console.error('[ActivityService] HTTP error', {
                status: error.response.status,
                url: error.config?.url,
                data: error.response.data
            });
            const message = error.response.data?.error || error.response.data?.message || 'Une erreur est survenue';
            throw new Error(message);
        } else if (error.request) {
            console.error('[ActivityService] No response', { url: error.config?.url });
            throw new Error('Impossible de contacter le serveur');
        } else {
            console.error('[ActivityService] Error', error);
            throw new Error(error.message);
        }
    }

    /**
     * Récupérer l'historique complet d'activité d'un utilisateur
     * GET /api/persistance/utilisateurs/{utilisateurId}/activite
     */
    async getActivitesByUtilisateur(utilisateurId) {
        try {
            const response = await axios.get(
                `${PERSISTANCE_API_URL}/${utilisateurId}/activite`,
                { headers: this.getAuthHeader() }
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Récupérer les 10 dernières activités d'un utilisateur (pour le dashboard)
     * GET /api/persistance/utilisateurs/{utilisateurId}/activite/recent
     */
    async getRecentActivites(utilisateurId) {
        try {
            const response = await axios.get(
                `${PERSISTANCE_API_URL}/${utilisateurId}/activite/recent`,
                { headers: this.getAuthHeader() }
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Formater une activité pour l'affichage
     * @param {Object} activity - Activité à formater
     * @returns {Object} Activité formatée pour l'affichage
     */
    formatActivityForDisplay(activity) {
        const typeLabels = {
            'RECIPE_CREATED': 'Recette créée',
            'RECIPE_COOKED': 'Recette cuisinée',
            'RECIPE_FAVORITED': 'Recette ajoutée aux favoris',
            'RECIPE_SHARED': 'Recette partagée',
            'FEEDBACK_CREATED': 'Avis laissé',
            'PLANNER_UPDATED': 'Planning mis à jour'
        };

        return {
            ...activity,
            typeLabel: typeLabels[activity.typeActivite] || activity.typeActivite,
            formattedDate: this.formatDate(activity.dateActivite)
        };
    }

    /**
     * Formater une date de manière relative (il y a X jours)
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Aujourd'hui";
        if (diffDays === 1) return "Hier";
        if (diffDays < 7) return `Il y a ${diffDays} jours`;
        if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
        if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
        return `Il y a ${Math.floor(diffDays / 365)} an${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
    }
}

export default new ActivityService();
