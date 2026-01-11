import axios from 'axios';
import { normalizeImageUrl, normalizeRecipeImageUrl, normalizeRecipesImageUrls } from '../../utils/imageUrlHelper';
import feedbackService from './feedback.service';

const API_URL = process.env.REACT_APP_RECIPE_SERVICE_URL || 'http://localhost:8093/api/recettes';
const PERSISTENCE_URL = process.env.REACT_APP_PERSISTENCE_SERVICE_URL || 'http://localhost:8090/api/persistance';

class RecipesService {
    constructor() {
        this.imagesCache = new Map();
        this.favorisCache = new Map();
        this.allRecipesCache = null;
        this.cacheTimestamp = null;
        this.CACHE_DURATION = 30000; // 30 secondes
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

    // ============================================
    // CRUD RECETTES
    // ============================================

    async createRecette(recetteData) {
        try {
            const response = await axios.post(`${API_URL}`, recetteData, {
                headers: this.getAuthHeader()
            });
            return normalizeRecipeImageUrl(response.data);
        } catch (error) {
            this.handleError(error);
        }
    }

    async getAllRecettes() {
        try {
            const response = await axios.get(`${API_URL}`, {
                headers: this.getAuthHeader()
            });
            return normalizeRecipesImageUrls(response.data);
        } catch (error) {
            this.handleError(error);
        }
    }

    async getRecetteById(id) {
        try {
            const response = await axios.get(`${API_URL}/${id}`, {
                headers: this.getAuthHeader()
            });
            return normalizeRecipeImageUrl(response.data);
        } catch (error) {
            this.handleError(error);
        }
    }

    async getRecetteByIdAsync(id) {
        try {
            const response = await axios.get(`${API_URL}/${id}/async`, {
                headers: this.getAuthHeader()
            });
            return normalizeRecipeImageUrl(response.data);
        } catch (error) {
            this.handleError(error);
        }
    }

    async updateRecette(id, updateData) {
        try {
            const response = await axios.put(`${API_URL}/${id}`, updateData, {
                headers: this.getAuthHeader()
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async deleteRecette(id) {
        try {
            await axios.delete(`${API_URL}/${id}`, {
                headers: this.getAuthHeader()
            });
        } catch (error) {
            this.handleError(error);
        }
    }

    async recetteExists(id) {
        try {
            const response = await axios.get(`${API_URL}/${id}/exists`, {
                headers: this.getAuthHeader()
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    // ============================================
    // RECHERCHE ET FILTRAGE
    // ============================================

    async searchRecettes(searchRequest) {
        try {
            const response = await axios.post(`${API_URL}/search`, searchRequest, {
                headers: this.getAuthHeader()
            });
            return normalizeRecipesImageUrls(response.data);
        } catch (error) {
            this.handleError(error);
        }
    }

    async getRecettesByCategorie(categorie) {
        try {
            const response = await axios.get(`${API_URL}/categorie/${categorie}`, {
                headers: this.getAuthHeader()
            });
            return normalizeRecipesImageUrls(response.data);
        } catch (error) {
            this.handleError(error);
        }
    }

    async getRecetteStats(id) {
        try {
            const response = await axios.get(`${API_URL}/${id}/stats`, {
                headers: this.getAuthHeader()
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async getPopularRecettes(limit = 10) {
        try {
            const response = await axios.get(`${API_URL}/populaires`, {
                params: { limit },
                headers: this.getAuthHeader()
            });
            return normalizeRecipesImageUrls(response.data);
        } catch (error) {
            this.handleError(error);
        }
    }

    async getRecentRecettes(limit = 10) {
        try {
            const response = await axios.get(`${API_URL}/recentes`, {
                params: { limit },
                headers: this.getAuthHeader()
            });
            return normalizeRecipesImageUrls(response.data);
        } catch (error) {
            this.handleError(error);
        }
    }

    // ============================================
    // GESTION DES FICHIERS (Images et Documents)
    // ============================================

    async uploadImage(recetteId, file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(
                `${API_URL}/${recetteId}/fichiers/images`,
                formData,
                {
                    headers: {
                        ...this.getAuthHeader(),
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data?.urlTelechargement) {
                response.data.urlTelechargement = normalizeImageUrl(response.data.urlTelechargement);

                const presignedMatch = response.data.urlTelechargement.match(/https?:\/\/([^/]+)\/(.*?)\?/);
                if (presignedMatch) {
                    const objectPath = presignedMatch[2];
                    const normalizedPath = objectPath.includes('recettes-bucket')
                        ? objectPath
                        : objectPath.replace(/^recettes\//, 'recettes-bucket/');
                    response.data.directUrl = `http://localhost:9002/${normalizedPath}`;
                }
            }
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async uploadDocument(recetteId, file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(
                `${API_URL}/${recetteId}/fichiers/documents`,
                formData,
                {
                    headers: {
                        ...this.getAuthHeader(),
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data?.urlTelechargement) {
                response.data.urlTelechargement = normalizeImageUrl(response.data.urlTelechargement);
            }
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async getAllFichiers(recetteId) {
        try {
            const response = await axios.get(`${API_URL}/${recetteId}/fichiers`, {
                headers: this.getAuthHeader()
            });

            return (response.data || []).map(fichier => ({
                ...fichier,
                urlTelechargement: fichier.urlTelechargement
                    ? normalizeImageUrl(fichier.urlTelechargement)
                    : fichier.urlTelechargement,
                urlStream: fichier.urlStream
                    ? `${API_URL}${fichier.urlStream}`
                    : fichier.urlStream
            }));
        } catch (error) {
            this.handleError(error);
        }
    }

    async getImages(recetteId) {
        try {
            if (this.imagesCache.has(recetteId)) {
                return this.imagesCache.get(recetteId);
            }

            const publicBase = process.env.REACT_APP_MINIO_PUBLIC_URL || 'http://localhost:9002';
            const response = await axios.get(`${API_URL}/${recetteId}/fichiers/images`, {
                headers: this.getAuthHeader()
            });

            const processed = (response.data || []).map(image => {
                let primaryUrl = null;
                let directUrl = null;

                if (image.urlTelechargement) {
                    const presignedMatch = image.urlTelechargement.match(/https?:\/\/([^/]+)\/(.*?)\?/);
                    if (presignedMatch) {
                        const objectPath = presignedMatch[2];
                        const normalizedPath = objectPath.includes('recettes-bucket')
                            ? objectPath
                            : objectPath.replace(/^recettes\//, 'recettes-bucket/');
                        directUrl = `${publicBase.replace(/\/$/, '')}/${normalizedPath}`;
                    }
                    primaryUrl = normalizeImageUrl(image.urlTelechargement);
                }

                if (!directUrl && image.cheminFichier) {
                    const cleanedPath = image.cheminFichier.startsWith('/')
                        ? image.cheminFichier.slice(1)
                        : image.cheminFichier;
                    const normalizedPath = cleanedPath.startsWith('recettes-bucket')
                        ? cleanedPath
                        : cleanedPath.replace(/^recettes\//, 'recettes-bucket/');
                    directUrl = `${publicBase.replace(/\/$/, '')}/${normalizedPath}`;
                }

                let streamUrl = null;
                if (image.urlStream) {
                    streamUrl = `${API_URL}${image.urlStream}`;
                }

                return {
                    ...image,
                    directUrl,
                    urlTelechargement: primaryUrl,
                    urlStream: streamUrl,
                    url: image.url ? normalizeImageUrl(image.url) : image.url
                };
            });

            if (processed.length > 0) {
                this.imagesCache.set(recetteId, processed);
            }
            return processed;
        } catch (error) {
            console.warn('[RecipeService] getImages via ms-recette a échoué, tentative via ms-persistance...', error?.message);

            try {
                const publicBase = process.env.REACT_APP_MINIO_PUBLIC_URL || 'http://localhost:9002';
                const response2 = await axios.get(`${PERSISTENCE_URL}/${recetteId}/fichiers/images`, {
                    headers: this.getAuthHeader()
                });

                const processed2 = (response2.data || []).map(image => {
                    let directUrl = null;
                    let primaryUrl = null;

                    if (image.urlTelechargement) {
                        const presignedMatch = image.urlTelechargement.match(/https?:\/\/([^/]+)\/(.*?)\?/);
                        if (presignedMatch) {
                            const objectPath = presignedMatch[2];
                            const normalizedPath = objectPath.includes('recettes-bucket')
                                ? objectPath
                                : objectPath.replace(/^recettes\//, 'recettes-bucket/');
                            directUrl = `${publicBase.replace(/\/$/, '')}/${normalizedPath}`;
                        }
                        primaryUrl = normalizeImageUrl(image.urlTelechargement);
                    }

                    if (!directUrl && image.cheminFichier) {
                        const cleanedPath = image.cheminFichier.startsWith('/')
                            ? image.cheminFichier.slice(1)
                            : image.cheminFichier;
                        const normalizedPath = cleanedPath.startsWith('recettes-bucket')
                            ? cleanedPath
                            : cleanedPath.replace(/^recettes\//, 'recettes-bucket/');
                        directUrl = `${publicBase.replace(/\/$/, '')}/${normalizedPath}`;
                    }

                    const streamUrl = image.urlStream ? `${API_URL}${image.urlStream}` : null;

                    return {
                        ...image,
                        directUrl,
                        urlTelechargement: primaryUrl,
                        urlStream: streamUrl,
                        url: image.url ? normalizeImageUrl(image.url) : image.url
                    };
                });

                if (processed2.length > 0) {
                    this.imagesCache.set(recetteId, processed2);
                }
                return processed2;
            } catch (error2) {
                this.handleError(error2);
            }
        }
    }

    async getDocuments(recetteId) {
        try {
            const response = await axios.get(`${API_URL}/${recetteId}/fichiers/documents`, {
                headers: this.getAuthHeader()
            });

            return (response.data || []).map(document => ({
                ...document,
                urlTelechargement: document.urlTelechargement
                    ? normalizeImageUrl(document.urlTelechargement)
                    : document.urlTelechargement,
                urlStream: document.urlStream
                    ? `${API_URL}${document.urlStream}`
                    : document.urlStream
            }));
        } catch (error) {
            this.handleError(error);
        }
    }

    async downloadFichier(recetteId, fichierId) {
        try {
            const response = await axios.get(
                `${API_URL}/${recetteId}/fichiers/${fichierId}/download`,
                {
                    headers: this.getAuthHeader(),
                    responseType: 'blob'
                }
            );
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async getFichierMetadata(recetteId, fichierId) {
        try {
            const response = await axios.get(
                `${API_URL}/${recetteId}/fichiers/${fichierId}`,
                { headers: this.getAuthHeader() }
            );

            if (response.data?.urlTelechargement) {
                response.data.urlTelechargement = normalizeImageUrl(response.data.urlTelechargement);
            }
            if (response.data?.urlStream) {
                response.data.urlStream = `${API_URL}${response.data.urlStream}`;
            }
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async deleteFichier(recetteId, fichierId) {
        try {
            await axios.delete(`${API_URL}/${recetteId}/fichiers/${fichierId}`, {
                headers: this.getAuthHeader()
            });
        } catch (error) {
            this.handleError(error);
        }
    }

    // ============================================
    // GESTION DU CACHE
    // ============================================

    async getAllRecipesWithCache() {
        const now = Date.now();

        if (this.allRecipesCache && this.cacheTimestamp &&
            (now - this.cacheTimestamp) < this.CACHE_DURATION) {
            return this.allRecipesCache;
        }

        const response = await axios.get(`${PERSISTENCE_URL}/recettes`, {
            headers: this.getAuthHeader()
        });

        this.allRecipesCache = response.data || [];
        this.cacheTimestamp = now;

        return this.allRecipesCache;
    }

    invalidateCache() {
        this.allRecipesCache = null;
        this.cacheTimestamp = null;
    }

    // ============================================
    // WORKFLOW DE VALIDATION
    // ============================================

    async createDraftRecette(recetteData) {
        try {
            const payload = {
                ...recetteData,
                actif: false,
                statut: 'EN_ATTENTE'
            };
            const response = await axios.post(`${API_URL}`, payload, {
                headers: this.getAuthHeader()
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async getRecettesEnAttente() {
        try {
            const allRecipes = await this.getAllRecipesWithCache();
            const recettesEnAttente = allRecipes.filter(r => r.statut === 'EN_ATTENTE');
            console.log(`📋 Recettes en attente trouvées: ${recettesEnAttente.length}`);
            return normalizeRecipesImageUrls(recettesEnAttente);
        } catch (error) {
            this.handleError(error);
        }
    }

    async validerRecette(id) {
        try {
            const response = await axios.put(`${API_URL}/${id}/valider`, null, {
                headers: this.getAuthHeader()
            });
            this.invalidateCache();
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async rejeterRecette(id, motif) {
        try {
            const response = await axios.put(`${API_URL}/${id}/rejeter`,
                { motif: motif || 'Non conforme' },
                { headers: this.getAuthHeader() }
            );
            this.invalidateCache();
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async getRecettesValidees() {
        try {
            const allRecipes = await this.getAllRecipesWithCache();
            const recettesValidees = allRecipes.filter(r => r.statut === 'VALIDEE');
            console.log(`✅ Recettes validées trouvées: ${recettesValidees.length}`);
            return normalizeRecipesImageUrls(recettesValidees);
        } catch (error) {
            this.handleError(error);
        }
    }

    async getRecettesRejetees() {
        try {
            const allRecipes = await this.getAllRecipesWithCache();
            const recettesRejetees = allRecipes.filter(r => r.statut === 'REJETEE');
            console.log(`❌ Recettes rejetées trouvées: ${recettesRejetees.length}`);
            return normalizeRecipesImageUrls(recettesRejetees);
        } catch (error) {
            this.handleError(error);
        }
    }

    async getRecettesByUtilisateur(utilisateurId) {
        try {
            console.log(`🔍 [RecipeService] Récupération recettes pour utilisateur ${utilisateurId}`);

            const response = await axios.get(`${API_URL}`, {
                headers: this.getAuthHeader()
            });

            console.log(`📦 [RecipeService] Total recettes reçues:`, response.data?.length);

            const userRecipes = (response.data || []).filter(
                r => r.utilisateurId === parseInt(utilisateurId)
            );
            console.log(`✅ [RecipeService] Recettes filtrées pour utilisateur ${utilisateurId}:`, userRecipes.length);

            return normalizeRecipesImageUrls(userRecipes);
        } catch (error) {
            console.error(`❌ [RecipeService] Erreur récupération recettes utilisateur:`, error);
            this.handleError(error);
        }
    }

    // ============================================
    // ENRICHISSEMENT AVEC FEEDBACKS
    // ============================================

    async enrichWithFeedbacks(recipe) {
        if (!recipe || !recipe.id) return recipe;

        try {
            const feedbacks = await feedbackService.getFeedbacksByRecetteId(recipe.id);

            if (feedbacks && feedbacks.length > 0) {
                const total = feedbacks.reduce((sum, fb) => sum + (fb.evaluation || 0), 0);
                const moyenne = total / feedbacks.length;

                return {
                    ...recipe,
                    note: moyenne,
                    rating: moyenne,
                    nombreAvis: feedbacks.length,
                    reviews: feedbacks.length
                };
            }

            return {
                ...recipe,
                note: 0,
                rating: 0,
                nombreAvis: 0,
                reviews: 0
            };
        } catch (error) {
            console.warn(`Impossible de charger les feedbacks pour la recette ${recipe.id}:`, error);
            return {
                ...recipe,
                note: 0,
                rating: 0,
                nombreAvis: 0,
                reviews: 0
            };
        }
    }

    async enrichManyWithFeedbacks(recipes) {
        if (!recipes || recipes.length === 0) return recipes;

        try {
            const enrichedRecipes = await Promise.all(
                recipes.map(recipe => this.enrichWithFeedbacks(recipe))
            );
            return enrichedRecipes;
        } catch (error) {
            console.error('Erreur lors de l\'enrichissement des recettes:', error);
            return recipes;
        }
    }

    /**
     * Ajouter une recette aux favoris
     */
    async ajouterFavori(recetteId, utilisateurId) {
        try {
            const response = await axios.post(
                `${PERSISTENCE_URL}/recettes/${recetteId}/favoris`,
                null,
                {
                    params: { utilisateurId },
                    headers: this.getAuthHeader()
                }
            );
            // Invalider le cache des favoris
            this.favorisCache.delete(utilisateurId);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Retirer une recette des favoris
     */
    async retirerFavori(recetteId, utilisateurId) {
        try {
            const response = await axios.delete(
                `${PERSISTENCE_URL}/recettes/${recetteId}/favoris`,
                {
                    params: { utilisateurId },
                    headers: this.getAuthHeader()
                }
            );
            // Invalider le cache des favoris
            this.favorisCache.delete(utilisateurId);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Basculer le statut favori (ajouter/retirer)
     */
    async toggleFavori(recetteId, utilisateurId) {
        try {
            const response = await axios.put(
                `${PERSISTENCE_URL}/recettes/${recetteId}/favoris/toggle`,
                null,
                {
                    params: { utilisateurId },
                    headers: this.getAuthHeader()
                }
            );
            // Invalider le cache des favoris
            this.favorisCache.delete(utilisateurId);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Vérifier si une recette est en favori
     */
    async checkFavori(recetteId, utilisateurId) {
        try {
            const response = await axios.get(
                `${PERSISTENCE_URL}/recettes/${recetteId}/favoris/check`,
                {
                    params: { utilisateurId },
                    headers: this.getAuthHeader()
                }
            );
            return response.data.favori;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Récupérer toutes les recettes favorites d'un utilisateur
     */
    async getRecettesFavorites(utilisateurId) {
        try {
            const response = await axios.get(
                `${PERSISTENCE_URL}/recettes/favoris`,
                {
                    params: { utilisateurId },
                    headers: this.getAuthHeader()
                }
            );
            return normalizeRecipesImageUrls(response.data || []);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Récupérer le nombre de favoris d'une recette
     */
    async getNombreFavoris(recetteId) {
        try {
            const response = await axios.get(
                `${PERSISTENCE_URL}/recettes/${recetteId}/favoris/count`,
                { headers: this.getAuthHeader() }
            );
            return response.data.count;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Récupérer les recettes favorites enrichies avec les feedbacks
     */
    async getRecettesFavoritesEnriched(utilisateurId) {
        try {
            const favorites = await this.getRecettesFavorites(utilisateurId);
            return await this.enrichManyWithFeedbacks(favorites);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Vérifier les statuts favoris pour plusieurs recettes
     */
    async checkFavorisMultiple(recetteIds, utilisateurId) {
        try {
            const results = await Promise.all(
                recetteIds.map(async (id) => {
                    try {
                        const isFavori = await this.checkFavori(id, utilisateurId);
                        return { recetteId: id, favori: isFavori };
                    } catch {
                        return { recetteId: id, favori: false };
                    }
                })
            );

            return results.reduce((acc, item) => {
                acc[item.recetteId] = item.favori;
                return acc;
            }, {});
        } catch (error) {
            console.error('Erreur lors de la vérification des favoris:', error);
            return {};
        }
    }
}

const recipesService = new RecipesService();
export default recipesService;