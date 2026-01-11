import axios from 'axios';

const PERSISTENCE_URL = process.env.REACT_APP_PERSISTENCE_SERVICE_URL || 'http://localhost:8090/api/persistance';
const RECOMMENDATION_URL = process.env.REACT_APP_RECOMMENDATION_SERVICE_URL || 'http://localhost:8095/api';

class SuggestionService {
    constructor() {
        this.alimentsCache = null;
        this.alimentsCacheTimestamp = null;
        this.CACHE_DURATION = 60000; // 60 secondes pour les aliments
    }

    // Helper pour obtenir le token
    getAuthHeader() {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    // Helper pour gérer les erreurs
    handleError(error) {
        if (error.response) {
            const data = error.response.data;
            const message =
                data?.error ||
                data?.message ||
                (typeof data?.detail === "string" ? data.detail : null) ||
                (Array.isArray(data?.detail) ? data.detail.map(d => d.msg).join(", ") : null) ||
                `Erreur HTTP ${error.response.status}`;
            throw new Error(message);
        } else if (error.request) {
            throw new Error("Impossible de contacter le serveur");
        } else {
            throw new Error(error.message);
        }
    }

    /**
     * Supprimer les accents d'une chaîne
     */
    removeAccents(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    /**
     * Récupérer tous les aliments depuis MS-Persistance (avec cache)
     */
    async getAllAliments() {
        try {
            const now = Date.now();

            // Utiliser le cache si valide
            if (this.alimentsCache && this.alimentsCacheTimestamp &&
                (now - this.alimentsCacheTimestamp) < this.CACHE_DURATION) {
                return this.alimentsCache;
            }

            const response = await axios.get(`${PERSISTENCE_URL}/aliments`, {
                headers: this.getAuthHeader()
            });

            this.alimentsCache = response.data || [];
            this.alimentsCacheTimestamp = now;

            return this.alimentsCache;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Invalider le cache des aliments
     */
    invalidateAlimentsCache() {
        this.alimentsCache = null;
        this.alimentsCacheTimestamp = null;
    }

    /**
     * Mapper les noms d'ingrédients vers leurs IDs
     * @param {Array<string>} ingredientNames - Noms des ingrédients
     * @returns {Promise<Array<number>>} - IDs des ingrédients trouvés
     */
    async mapIngredientNamesToIds(ingredientNames) {
        const allAliments = await this.getAllAliments();

        const ingredientIds = ingredientNames.map(name => {
            const normalizedName = name.toLowerCase().trim();

            // Essayer d'abord une correspondance exacte (insensible à la casse)
            let aliment = allAliments.find(a =>
                a.nom && a.nom.toLowerCase() === normalizedName
            );

            // Si pas trouvé, essayer sans accents
            if (!aliment) {
                const withoutAccents = this.removeAccents(normalizedName);
                aliment = allAliments.find(a =>
                    a.nom && this.removeAccents(a.nom.toLowerCase()) === withoutAccents
                );
            }

            // Si toujours pas trouvé, essayer de matcher le début du mot
            if (!aliment) {
                const withoutAccents = this.removeAccents(normalizedName);
                aliment = allAliments.find(a =>
                        a.nom && (
                            this.removeAccents(a.nom.toLowerCase()).startsWith(withoutAccents) ||
                            withoutAccents.startsWith(this.removeAccents(a.nom.toLowerCase()))
                        )
                );
            }

            return aliment ? aliment.id : null;
        }).filter(id => id !== null);

        return ingredientIds;
    }

    /**
     * Générer des recommandations IA basées sur des ingrédients
     * @param {Array<string>} ingredientNames - Noms des ingrédients
     * @param {number} topK - Nombre de recommandations à retourner
     * @returns {Promise<Object>} - Réponse du service de recommandation
     */
    async generateRecommendations(ingredientNames, topK = 3) {
        try {
            const allAliments = await this.getAllAliments();
            const ingredientIds = await this.mapIngredientNamesToIds(ingredientNames);

            console.log('Ingrédients sélectionnés:', ingredientNames);
            console.log('IDs trouvés:', ingredientIds);
            console.log('Aliments disponibles:', allAliments.map(a => ({ id: a.id, nom: a.nom })));

            if (ingredientIds.length === 0) {
                throw new Error(
                    'Aucun ingrédient valide trouvé dans la base de données. Ingrédients disponibles: ' +
                    allAliments.map(a => a.nom).join(', ')
                );
            }

            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                throw new Error('Utilisateur non connecté');
            }

            const response = await axios.post(`${RECOMMENDATION_URL}/recommend/suggestions`, {
                user_id: user.id.toString(),
                ingredients_inclus: ingredientIds,
                top_k: topK,
                limit_candidates: 50
            }, {
                headers: this.getAuthHeader()
            });

            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Rechercher des aliments par nom (pour l'autocomplétion)
     * @param {string} query - Terme de recherche
     * @param {number} limit - Nombre max de résultats
     * @returns {Promise<Array>} - Aliments correspondants
     */
    async searchAliments(query, limit = 10) {
        try {
            const allAliments = await this.getAllAliments();
            const normalizedQuery = this.removeAccents(query.toLowerCase().trim());

            return allAliments
                .filter(a => a.nom && this.removeAccents(a.nom.toLowerCase()).includes(normalizedQuery))
                .slice(0, limit);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Récupérer un aliment par ID
     * @param {number} id - ID de l'aliment
     * @returns {Promise<Object|null>} - Aliment trouvé ou null
     */
    async getAlimentById(id) {
        try {
            const allAliments = await this.getAllAliments();
            return allAliments.find(a => a.id === id) || null;
        } catch (error) {
            this.handleError(error);
        }
    }
}

const suggestionService = new SuggestionService();
export default suggestionService;