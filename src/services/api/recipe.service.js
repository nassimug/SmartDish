import axios from 'axios';
import { normalizeImageUrl, normalizeRecipeImageUrl, normalizeRecipesImageUrls } from '../../utils/imageUrlHelper';
import feedbackService from './feedback.service';

const API_URL = process.env.REACT_APP_RECIPE_SERVICE_URL || 'http://localhost:8093/api/recettes';
const PERSISTENCE_URL = process.env.REACT_APP_PERSISTENCE_SERVICE_URL || 'http://localhost:8090/api/persistance';
const RECOMMENDATION_URL = process.env.REACT_APP_RECOMMENDATION_SERVICE_URL || 'http://localhost:8095/api';
const USER_URL = process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:8092/api/utilisateurs';
const FEEDBACK_URL = process.env.REACT_APP_FEEDBACK_SERVICE_URL || 'http://localhost:8091/api/feedbacks';

class RecipesService {
    constructor() {
        this.imagesCache = new Map();
        // Cache pour les recettes avec timestamp
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

    /**
     * Créer une nouvelle recette
     */
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

    /**
     * Récupérer toutes les recettes
     */
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

    /**
     * Récupérer une recette par ID
     */
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

    /**
     * Récupérer une recette de manière asynchrone (optimisée)
     */
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

    /**
     * Rechercher des recettes selon des critères
     */
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

    /**
     * Récupérer les recettes par catégorie
     */
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

    /**
     * Récupérer les statistiques d'une recette
     */
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

    /**
     * Mettre à jour une recette
     */
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

    /**
     * Supprimer une recette
     */
    async deleteRecette(id) {
        try {
            await axios.delete(`${API_URL}/${id}`, {
                headers: this.getAuthHeader()
            });
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Vérifier si une recette existe
     */
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

    /**
     * Récupérer les recettes populaires
     */
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

    /**
     * Récupérer les recettes récentes
     */
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

    /**
     * Upload une image pour une recette
     */
    async uploadImage(recetteId, file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            // Appelle via ms-recette (API_URL) qui proxie vers ms-persistance
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
            // Normaliser urlTelechargement si présent
            if (response.data?.urlTelechargement) {
                response.data.urlTelechargement = normalizeImageUrl(response.data.urlTelechargement);

                // Générer une directUrl (sans signature) depuis le chemin objet
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

    /**
     * Upload un document pour une recette
     */
    async uploadDocument(recetteId, file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            // Appelle via ms-recette (API_URL) qui proxie vers ms-persistance
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
            // Normaliser urlTelechargement si présent
            if (response.data?.urlTelechargement) {
                response.data.urlTelechargement = normalizeImageUrl(response.data.urlTelechargement);
            }
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Récupérer tous les fichiers d'une recette
     */
    async getAllFichiers(recetteId) {
        try {
            // Appelle via ms-recette (API_URL) qui proxie vers ms-persistance
            const response = await axios.get(`${API_URL}/${recetteId}/fichiers`, {
                headers: this.getAuthHeader()
            });
            // Normaliser les URLs téléchargement
            return (response.data || []).map(fichier => ({
                ...fichier,
                urlTelechargement: fichier.urlTelechargement ? normalizeImageUrl(fichier.urlTelechargement) : fichier.urlTelechargement,
                urlStream: fichier.urlStream ? `${API_URL}${fichier.urlStream}` : fichier.urlStream
            }));
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Récupérer les images d'une recette
     * 
     * Stratégie:
     * 1. directUrl: Extract bucket path from presigned URL and construct direct public URL
     * 2. urlTelechargement: Presigned URL (may fail due to hostname mismatch)
     * 3. urlStream: Backend stream endpoint
     */
    async getImages(recetteId) {
        try {
            // Cache pour éviter des appels répétés et améliorer la réactivité
            if (this.imagesCache.has(recetteId)) {
                return this.imagesCache.get(recetteId);
            }
            const publicBase = process.env.REACT_APP_MINIO_PUBLIC_URL || 'http://localhost:9002';
            // Appelle via ms-recette (API_URL) qui proxie vers ms-persistance
            const response = await axios.get(`${API_URL}/${recetteId}/fichiers/images`, {
                headers: this.getAuthHeader()
            });
            
            // Normaliser les URLs téléchargement (présignées) et stream
            const processed = (response.data || []).map(image => {
                let primaryUrl = null;
                let directUrl = null;
                
                // Stratégie 1: Construire URL directe depuis le bucket path à partir de l'URL presignée
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

                // Stratégie 1 bis: Construire directUrl depuis cheminFichier si pas trouvé
                if (!directUrl && image.cheminFichier) {
                    const cleanedPath = image.cheminFichier.startsWith('/')
                        ? image.cheminFichier.slice(1)
                        : image.cheminFichier;
                    const normalizedPath = cleanedPath.startsWith('recettes-bucket')
                        ? cleanedPath
                        : cleanedPath.replace(/^recettes\//, 'recettes-bucket/');
                    directUrl = `${publicBase.replace(/\/$/, '')}/${normalizedPath}`;
                }
                
                // Stratégie 2: urlStream (backend inline streaming)
                let streamUrl = null;
                if (image.urlStream) {
                    streamUrl = `${API_URL}${image.urlStream}`;
                }
                
                return {
                    ...image,
                    directUrl: directUrl,        // Direct MinIO URL without presigned params (PRIMARY)
                    urlTelechargement: primaryUrl,  // Presigned URL (fallback)
                    urlStream: streamUrl,        // Backend streaming endpoint (fallback)
                    url: image.url ? normalizeImageUrl(image.url) : image.url
                };
            });
            if (processed.length > 0) {
                this.imagesCache.set(recetteId, processed);
            }
            return processed;
        } catch (error) {
            console.warn('[RecipeService] getImages via ms-recette a échoué, tentative via ms-persistance...', error?.message);
            // Fallback: appeler directement ms-persistance si le proxy échoue
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

    /**
     * Récupérer les documents d'une recette
     */
    async getDocuments(recetteId) {
        try {
            // Appelle via ms-recette (API_URL) qui proxie vers ms-persistance
            const response = await axios.get(`${API_URL}/${recetteId}/fichiers/documents`, {
                headers: this.getAuthHeader()
            });
            // Normaliser les URLs téléchargement et stream
            return (response.data || []).map(document => ({
                ...document,
                urlTelechargement: document.urlTelechargement ? normalizeImageUrl(document.urlTelechargement) : document.urlTelechargement,
                urlStream: document.urlStream ? `${API_URL}${document.urlStream}` : document.urlStream
            }));
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Télécharger un fichier
     */
    async downloadFichier(recetteId, fichierId) {
        try {
            // Appelle via ms-recette (API_URL) qui proxie vers ms-persistance
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

    /**
     * Récupérer les métadonnées d'un fichier
     */
    async getFichierMetadata(recetteId, fichierId) {
        try {
            // Appelle via ms-recette (API_URL) qui proxie vers ms-persistance
            const response = await axios.get(
                `${API_URL}/${recetteId}/fichiers/${fichierId}`,
                {
                    headers: this.getAuthHeader()
                }
            );
            // Normaliser les URLs
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

    /**
     * Supprimer un fichier
     */
    async deleteFichier(recetteId, fichierId) {
        try {
            // Appelle via ms-recette (API_URL) qui proxie vers ms-persistance
            await axios.delete(`${API_URL}/${recetteId}/fichiers/${fichierId}`, {
                headers: this.getAuthHeader()
            });
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Récupérer tous les aliments depuis MS-Persistance
     */
    async getAllAliments() {
        try {
            const response = await axios.get(`${PERSISTENCE_URL}/aliments`, {
                headers: this.getAuthHeader()
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Générer des recommandations IA basées sur des ingrédients
     */
    async generateRecommendations(ingredientNames, topK = 3) {
        try {
            // 1. Récupérer tous les aliments pour mapper noms -> IDs
            const allAliments = await this.getAllAliments();
            // 3. Appeler MS-Recommandation
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                throw new Error('Utilisateur non connecté');
            }
const aliments_exclus_ids = await this.getUserExclusions(user.id);
const feedbacks_user = await this.getUserFeedbacks(user.id);
const global_averages = {};
// 2. Convertir les noms d'ingrédients en IDs avec une recherche flexible
            const ingredientIds = ingredientNames.map(name => {
                // Recherche insensible à la casse et au singulier/pluriel
                const normalizedName = name.toLowerCase().trim();
                
                // Essayer d'abord une correspondance exacte (insensible à la casse)
                let aliment = allAliments.find(a => 
                    a.nom && a.nom.toLowerCase() === normalizedName
                );
                
                // Si pas trouvé, essayer sans accents et singulier/pluriel
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
                        a.nom && (this.removeAccents(a.nom.toLowerCase()).startsWith(withoutAccents) ||
                        withoutAccents.startsWith(this.removeAccents(a.nom.toLowerCase())))
                    );
                }
                
                return aliment ? aliment.id : null;
            }).filter(id => id !== null);

            console.log('Ingrédients sélectionnés:', ingredientNames);
            console.log('IDs trouvés:', ingredientIds);
            console.log('Aliments disponibles:', allAliments.map(a => ({id: a.id, nom: a.nom})));

            if (ingredientIds.length === 0) {
                throw new Error('Aucun ingrédient valide trouvé dans la base de données. Ingrédients disponibles: ' + allAliments.map(a => a.nom).join(', '));
            }

            

            const response = await axios.post(`${RECOMMENDATION_URL}/recommend/suggestions`, {
  user_id: user.id.toString(),
  ingredients_inclus: ingredientIds,
  top_k: topK,
  limit_candidates: 200,

  // ✅ ajoutés
  aliments_exclus_ids,
  feedbacks_user,
  global_averages
}, {
  headers: this.getAuthHeader()
});

            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Supprimer les accents d'une chaîne
     */
    removeAccents(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    /**
     * Créer une recette en brouillon (non active, en attente de validation)
     */
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

    /**
     * Charger toutes les recettes une seule fois et les mettre en cache
     */
    async getAllRecipesWithCache() {
        const now = Date.now();

        // Utiliser le cache si valide
        if (this.allRecipesCache && this.cacheTimestamp && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
            return this.allRecipesCache;
        }

        // Sinon, recharger
        const response = await axios.get(`${PERSISTENCE_URL}/recettes`, {
            headers: this.getAuthHeader()
        });

        this.allRecipesCache = response.data || [];
        this.cacheTimestamp = now;

        return this.allRecipesCache;
    }

    /**
     * Invalider le cache (appelé après validation/rejet)
     */
    invalidateCache() {
        this.allRecipesCache = null;
        this.cacheTimestamp = null;
    }

    /**
     * Récupérer les recettes en attente de validation
     */
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

    /**
     * Valider une recette (la rendre active/publique)
     */
    async validerRecette(id) {
        try {
            const response = await axios.put(`${API_URL}/${id}/valider`, null, {
                headers: this.getAuthHeader()
            });
            // Invalider le cache pour forcer le rechargement
            this.invalidateCache();
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }
        

    /**
     * Rejeter une recette (avec motif)
     */
    async rejeterRecette(id, motif) {
        try {
            const response = await axios.put(`${API_URL}/${id}/rejeter`, { motif: motif || 'Non conforme' }, {
                headers: this.getAuthHeader()
            });
            // Invalider le cache pour forcer le rechargement
            this.invalidateCache();
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Récupérer les recettes validées
     */
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

    /**
     * Récupérer les recettes rejetées
     */
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

    /**
     * Récupérer les recettes d'un utilisateur (tous statuts)
     * Le backend retourne automatiquement les recettes de l'utilisateur connecté via JWT
     */
    async getRecettesByUtilisateur(utilisateurId) {
        try {
            console.log(`🔍 [RecipeService] Récupération recettes pour utilisateur ${utilisateurId}`);
            
            // Le backend filtre automatiquement par l'utilisateur connecté via JWT
            // donc on récupère simplement toutes les recettes
            const response = await axios.get(`${API_URL}`, {
                headers: this.getAuthHeader()
            });
            
            console.log(`📦 [RecipeService] Total recettes reçues:`, response.data?.length);
            
            // Filtrer par utilisateurId côté frontend (au cas où)
            const userRecipes = (response.data || []).filter(r => r.utilisateurId === parseInt(utilisateurId));
            console.log(`✅ [RecipeService] Recettes filtrées pour utilisateur ${utilisateurId}:`, userRecipes.length);
            
            return normalizeRecipesImageUrls(userRecipes);
        } catch (error) {
            console.error(`❌ [RecipeService] Erreur récupération recettes utilisateur:`, error);
            this.handleError(error);
        }
    }

    /**
     * Enrichir une recette avec sa moyenne de feedbacks
     * @param {Object} recipe - Recette à enrichir
     * @returns {Object} Recette enrichie avec note et nombreAvis
     */
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

    async getUserExclusions(userId) {
  try {
    const resp = await axios.get(`${USER_URL}/${userId}`, {
      headers: this.getAuthHeader()
    });
    return resp.data?.alimentsExclusIds || [];
  } catch (error) {
    console.warn('Impossible de récupérer alimentsExclusIds:', error);
    return [];
  }
}
async getUserFeedbacks(userId) {
  try {
    const resp = await axios.get(`${FEEDBACK_URL}/utilisateur/${userId}`, {
      headers: this.getAuthHeader()
    });
    return Array.isArray(resp.data) ? resp.data : [];
  } catch (error) {
    console.warn('Impossible de récupérer feedbacks_user:', error);
    return [];
  }
}

    /**
     * Enrichir plusieurs recettes avec leurs moyennes de feedbacks
     * @param {Array} recipes - Liste de recettes à enrichir
     * @returns {Array} Recettes enrichies
     */
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
}

const recipesService = new RecipesService();
export default recipesService;
