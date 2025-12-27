import axios from 'axios';

const API_URL = 'http://localhost:8093/api/recettes';
const PERSISTANCE_URL = 'http://localhost:8090/api/persistance';

/**
 * Service pour vérifier la santé des différents composants du backend
 */
const healthService = {
    /**
     * Vérifie si le service de stockage d'images (MinIO) est disponible
     * @returns {Promise<boolean>} true si MinIO est disponible
     */
    async checkMinioAvailability() {
        try {
            // Tentative de connexion au endpoint de test MinIO
            const response = await axios.get(`${PERSISTANCE_URL}/health/minio`, {
                timeout: 3000
            });
            console.log('✅ MinIO est disponible:', response.data);
            return true;
        } catch (error) {
            console.warn('⚠️ MinIO non disponible:', error.message);
            return false;
        }
    },

    /**
     * Vérifie la santé générale du backend
     * @returns {Promise<{persistance: boolean, recette: boolean, minio: boolean}>}
     */
    async checkBackendHealth() {
        const health = {
            persistance: false,
            recette: false,
            minio: false
        };

        try {
            // Test ms-persistance
            await axios.get(`${PERSISTANCE_URL}/actuator/health`, { timeout: 2000 });
            health.persistance = true;
        } catch (error) {
            console.warn('ms-persistance non disponible');
        }

        try {
            // Test ms-recette
            await axios.get(`${API_URL}`, { timeout: 2000 });
            health.recette = true;
        } catch (error) {
            console.warn('ms-recette non disponible');
        }

        // Test MinIO
        health.minio = await this.checkMinioAvailability();

        console.log('🏥 État des services backend:', health);
        return health;
    }
};

export default healthService;
