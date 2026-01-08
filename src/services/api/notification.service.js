import axios from 'axios';

const NOTIFICATION_API_URL = process.env.REACT_APP_PERSISTENCE_SERVICE_URL ? `${process.env.REACT_APP_PERSISTENCE_SERVICE_URL}/notifications` : 'https://ms-persistance-production.up.railway.app/api/persistance/notifications';

class NotificationService {
    // Helper pour obtenir le token
    getAuthHeader() {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    // Helper pour gérer les erreurs
    handleError(error) {
        if (error.response) {
            const message = error.response.data?.error || error.response.data?.message || 'Une erreur est survenue';
            throw new Error(message);
        } else if (error.request) {
            throw new Error('Impossible de contacter le serveur');
        } else {
            throw new Error(error.message);
        }
    }

    // Pas de cache: méthode no-op appelée par la navigation au login/logout
    clearCache() {
        // Intentionnellement vide (aucun cache côté frontend)
        console.log('[NotificationService] clearCache() - no-op');
    }

    /**
     * Les notifications sont maintenant gérées par le backend ms-persistance
     * Plus besoin de cache ou localStorage, tout est persisté en base de données
     */

    /**
     * Récupérer toutes les notifications d'un utilisateur
     */
    async getNotificationsByUserId(utilisateurId) {
        try {
            console.log(`🔔 [NotificationService] Récupération notifications pour utilisateur ${utilisateurId}`);
            const response = await axios.get(`${NOTIFICATION_API_URL}/utilisateur/${utilisateurId}`, {
                headers: this.getAuthHeader()
            });
            console.log(`✅ [NotificationService] ${response.data.length} notifications récupérées`);
            return response.data || [];
        } catch (error) {
            console.error('[NotificationService] Erreur récupération notifications:', error);
            this.handleError(error);
        }
    }

    /**
     * Récupérer les notifications non lues
     */
    async getNotificationsNonLues(utilisateurId) {
        try {
            console.log(`📬 [NotificationService] Récupération notifications non lues pour utilisateur ${utilisateurId}`);
            const response = await axios.get(`${NOTIFICATION_API_URL}/utilisateur/${utilisateurId}/non-lues`, {
                headers: this.getAuthHeader()
            });
            console.log(`✅ [NotificationService] ${response.data.length} notifications non lues récupérées`);
            return response.data || [];
        } catch (error) {
            console.error('[NotificationService] Erreur récupération notifications non lues:', error);
            this.handleError(error);
        }
    }

    /**
     * Compter les notifications non lues (sans cache)
     */
    async getUnreadCount(utilisateurId) {
        try {
            console.log(`🔢 [NotificationService] Comptage notifications non lues pour utilisateur ${utilisateurId}`);
            const response = await axios.get(`${NOTIFICATION_API_URL}/utilisateur/${utilisateurId}/count`, {
                headers: this.getAuthHeader()
            });
            const count = response.data?.count || 0;
            console.log(`✅ [NotificationService] ${count} notifications non lues`);
            return count;
        } catch (error) {
            console.error('[NotificationService] Erreur comptage notifications:', error);
            return 0;
        }
    }

    /**
     * Marquer une notification comme lue
     */
    async markAsRead(notificationId) {
        try {
            console.log(`📖 [NotificationService] Marquage notification ${notificationId} comme lue`);
            const response = await axios.put(`${NOTIFICATION_API_URL}/${notificationId}/lire`, null, {
                headers: this.getAuthHeader()
            });
            console.log(`✅ [NotificationService] Notification marquée comme lue`);
            return response.data;
        } catch (error) {
            console.error('[NotificationService] Erreur marquage notification:', error);
            throw error;
        }
    }

    /**
     * Marquer toutes les notifications comme lues
     */
    async markAllAsRead(utilisateurId) {
        try {
            console.log(`📖 [NotificationService] Marquage de toutes les notifications comme lues pour utilisateur ${utilisateurId}`);
            const response = await axios.put(`${NOTIFICATION_API_URL}/utilisateur/${utilisateurId}/tout-lire`, null, {
                headers: this.getAuthHeader()
            });
            console.log(`✅ [NotificationService] Toutes les notifications marquées comme lues`);
            return response.data;
        } catch (error) {
            console.error('[NotificationService] Erreur marquage toutes notifications:', error);
            throw error;
        }
    }

    /**
     * Supprimer définitivement une notification avec gestion CORS fallback
     */
    async deleteNotification(notificationId) {
        try {
            console.log('🗑️ [NotificationService] Suppression notification:', notificationId);
            const response = await axios.delete(`${NOTIFICATION_API_URL}/${notificationId}`, {
                headers: this.getAuthHeader()
            });
            console.log('✅ [NotificationService] Notification supprimée');
            return response.data;
        } catch (error) {
            console.error('❌ [NotificationService] Erreur suppression notification:', error);
            this.handleError(error);
        }
    }

    /**
     * Créer une notification manuellement (fallback si le backend ne le fait pas)
     */
    async createNotification(notificationData) {
        try {
            console.log('📝 [NotificationService] Création manuelle de notification:', notificationData);
            const response = await axios.post(`${NOTIFICATION_API_URL}`, notificationData, {
                headers: this.getAuthHeader()
            });
            console.log('✅ [NotificationService] Notification créée avec succès');
            return response.data;
        } catch (error) {
            console.error('❌ [NotificationService] Erreur création notification:', error);
            // Ne pas bloquer le flux si la création échoue
            return null;
        }
    }

    /**
     * DEPRECATED: Plus besoin de cette méthode car les notifications sont créées automatiquement
     * par le backend lors de la validation/rejet des recettes
     */
    async sendRecipeValidationNotification(utilisateurId, type, data) {
        console.warn('⚠️ [NotificationService] sendRecipeValidationNotification est deprecated');
        console.warn('Les notifications sont maintenant créées automatiquement par le backend lors de la validation/rejet');
        // On ne fait rien, le backend s'en charge
        return Promise.resolve();
    }
}

const notificationService = new NotificationService();
export default notificationService;

