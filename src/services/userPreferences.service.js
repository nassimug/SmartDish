/**
 * Service pour gérer les préférences utilisateur stockées localement
 * Utile pour les données qui ne sont pas (encore) dans le backend
 */

const USER_PREFERENCES_KEY = 'user_preferences';

class UserPreferencesService {
    /**
     * Sauvegarder les préférences utilisateur
     * @param {number} userId - ID de l'utilisateur
     * @param {Object} preferences - Préférences à sauvegarder
     */
    savePreferences(userId, preferences) {
        try {
            const allPreferences = this.getAllPreferences();
            allPreferences[userId] = {
                ...allPreferences[userId],
                ...preferences,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(allPreferences));
            console.log('💾 Préférences utilisateur sauvegardées:', preferences);
        } catch (error) {
            console.error('❌ Erreur sauvegarde préférences:', error);
        }
    }

    /**
     * Récupérer les préférences d'un utilisateur
     * @param {number} userId - ID de l'utilisateur
     * @returns {Object} - Préférences de l'utilisateur
     */
    getPreferences(userId) {
        try {
            const allPreferences = this.getAllPreferences();
            return allPreferences[userId] || {};
        } catch (error) {
            console.error('❌ Erreur récupération préférences:', error);
            return {};
        }
    }

    /**
     * Récupérer toutes les préférences
     * @returns {Object} - Toutes les préférences
     */
    getAllPreferences() {
        try {
            const data = localStorage.getItem(USER_PREFERENCES_KEY);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('❌ Erreur parsing préférences:', error);
            return {};
        }
    }

    /**
     * Supprimer les préférences d'un utilisateur
     * @param {number} userId - ID de l'utilisateur
     */
    clearPreferences(userId) {
        try {
            const allPreferences = this.getAllPreferences();
            delete allPreferences[userId];
            localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(allPreferences));
            console.log('🗑️ Préférences utilisateur supprimées');
        } catch (error) {
            console.error('❌ Erreur suppression préférences:', error);
        }
    }

    /**
     * Supprimer toutes les préférences
     */
    clearAllPreferences() {
        try {
            localStorage.removeItem(USER_PREFERENCES_KEY);
            console.log('🧹 Toutes les préférences supprimées');
        } catch (error) {
            console.error('❌ Erreur suppression toutes préférences:', error);
        }
    }
}

export default new UserPreferencesService();
