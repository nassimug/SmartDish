import axios from 'axios';
import { normalizeImageUrl, normalizeRecipeImageUrl, normalizeRecipesImageUrls } from '../../utils/imageUrlHelper';
import feedbackService from './feedback.service';

// URLs des services - utilisent les variables d'environnement pour Railway
const API_URL = process.env.REACT_APP_RECIPE_SERVICE_URL || 'http://localhost:8093/api/recettes';
const PERSISTENCE_URL = process.env.REACT_APP_PERSISTENCE_SERVICE_URL || 'https://ms-persistance-production.up.railway.app/api/persistance';
const RECOMMENDATION_URL = process.env.REACT_APP_RECOMMENDATION_SERVICE_URL || 'http://localhost:8095/api';
const USER_URL = process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:8092/api/utilisateurs';
const FEEDBACK_URL = process.env.REACT_APP_FEEDBACK_SERVICE_URL || 'http://localhost:8091/api/feedbacks';


class RecipesService {
    constructor() {
        this.imagesCache = new Map();
    }
    
    // Vider le cache des images (utile pour forcer le rechargement)
    clearImageCache(recetteId = null) {
        if (recetteId) {
            this.imagesCache.delete(recetteId);
            console.log('🗑️ Cache images vidé pour recette', recetteId);
        } else {
            this.imagesCache.clear();
            console.log('🗑️ Cache images complètement vidé');
        }
    }
    
    // Helper pour obtenir le token
    getAuthHeader() {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    // Helper pour construire les URLs de streaming de manière robuste
    _buildStreamUrl(urlStream) {
        if (!urlStream) {
            return null;
        }
        
        // Si c'est déjà une URL absolue, la retourner comme-est
        if (urlStream.startsWith('http://') || urlStream.startsWith('https://')) {
            return urlStream;
        }
        
        // Extraire la base URL (sans /api/persistance)
        // PERSISTENCE_URL = https://ms-persistance-production.up.railway.app/api/persistance
        const baseUrl = PERSISTENCE_URL.replace(/\/api\/persistance.*$/, '');
        
        // Le backend retourne /api/persistance/recettes/... ou /recettes/...
        // On doit l'ajouter directement au baseUrl
        if (!urlStream.startsWith('/api/persistance/')) {
            // Si ce n'est pas /api/persistance/..., on ajoute le préfixe
            urlStream = `/api/persistance${urlStream.startsWith('/') ? '' : '/'}${urlStream}`;
        }
        
        return `${baseUrl}${urlStream}`;
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
            
            // Vérifier que la réponse est bien un tableau
            if (!Array.isArray(response.data)) {
                console.error('[RecipeService] Réponse inattendue (pas un tableau):', response.data);
                return [];
            }
            
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
            console.log('📝 Mise à jour recette:', { id, updateData });
            console.log('📡 URL appelée:', `${API_URL}/${id}`);
            
            const response = await axios.put(`${API_URL}/${id}`, updateData, {
                headers: this.getAuthHeader()
            });
            
            console.log('✅ Recette mise à jour avec succès');
            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                message: error.message,
                data: error.response?.data,
                url: error.config?.url
            });
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
            console.log('📤 Upload image:', {
                recetteId,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                persistenceUrl: PERSISTENCE_URL,
                minioPublicUrl: process.env.REACT_APP_MINIO_PUBLIC_URL
            });

            const formData = new FormData();
            formData.append('file', file);

            // Appeler directement ms-persistance pour éviter CORS et timeout de ms-recette
            const response = await axios.post(
                `${PERSISTENCE_URL}/recettes/${recetteId}/fichiers/images`,
                formData,
                {
                    headers: {
                        ...this.getAuthHeader(),
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            console.log('✅ Réponse upload backend:', response.data);
            
            // Normaliser urlTelechargement si présent
            if (response.data?.urlTelechargement) {
                response.data.urlTelechargement = normalizeImageUrl(response.data.urlTelechargement);

                // Générer une directUrl (sans signature) depuis le chemin objet
                const presignedMatch = response.data.urlTelechargement.match(/https?:\/\/([^/]+)\/(.*?)\?/);
                if (presignedMatch) {
                    // Le chemin dans MinIO est : recettes-bucket/recettes/ID/images/...
                    // Garder tel quel, c'est le bon chemin
                    const objectPath = presignedMatch[2];
                    
                    // Utiliser l'URL publique MinIO depuis les variables d'environnement
                    const minioPublicUrl = process.env.REACT_APP_MINIO_PUBLIC_URL || 'http://localhost:9002';
                    response.data.directUrl = `${minioPublicUrl}/${objectPath}`;
                    
                    console.log('📸 Upload image - URL générée:', {
                        objectPath,
                        minioPublicUrl,
                        directUrl: response.data.directUrl
                    });
                }
            }
            
            console.log('✅ Upload final result:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur upload image:', error);
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

            // Appeler directement ms-persistance pour éviter CORS et timeout
            const response = await axios.post(
                `${PERSISTENCE_URL}/recettes/${recetteId}/fichiers/documents`,
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
            const response = await axios.get(`${PERSISTENCE_URL}/recettes/${recetteId}/fichiers`, {
                headers: this.getAuthHeader()
            });
            return (response.data || []).map(fichier => ({
                ...fichier,
                urlTelechargement: fichier.urlTelechargement ? normalizeImageUrl(fichier.urlTelechargement) : fichier.urlTelechargement,
                urlStream: this._buildStreamUrl(fichier.urlStream)
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
            console.log('🔍 Récupération images pour recette', recetteId);
            console.log('📡 PERSISTENCE_URL:', PERSISTENCE_URL);
            
            // Cache pour éviter des appels répétés et améliorer la réactivité
            if (this.imagesCache.has(recetteId)) {
                console.log('✅ Images trouvées dans cache');
                return this.imagesCache.get(recetteId);
            }
            
            const response = await axios.get(`${PERSISTENCE_URL}/recettes/${recetteId}/fichiers/images`, {
                headers: this.getAuthHeader()
            });
            
            console.log('📥 Réponse brute backend images:', JSON.stringify(response.data, null, 2));
            
            const processed = (response.data || []).map(image => {
                // Construire l'URL de streaming en utilisant le helper
                const streamUrl = this._buildStreamUrl(image.urlStream);

                // Conserver l'URL de téléchargement mais ne pas la réécrire (signature présignée dépend de l'hôte)
                const presignedUrl = image.urlTelechargement || null;

                // Générer une URL publique directe (si bucket public) à partir de l'URL MinIO
                // normalizeImageUrl s'occupe de remplacer minio:9000 -> Railway et de retirer la query string
                const directPublicUrl = presignedUrl ? normalizeImageUrl(presignedUrl) : null;

                // Préférer le streaming via backend pour éviter les problèmes d'hôte minio:9000
                const displayUrl = streamUrl || directPublicUrl || presignedUrl || null;

                console.log('📸 Image processée:', {
                    id: image.id,
                    nom: image.nom,
                    urlStreamRaw: image.urlStream,
                    streamUrl,
                    presignedUrl: presignedUrl?.substring(0, 100) + '...',
                    directPublicUrl,
                    displayUrl: displayUrl?.substring(0, 100) + '...',
                    cheminFichier: image.cheminFichier
                });

                return {
                    ...image,
                    directUrl: directPublicUrl,
                    urlStream: streamUrl,
                    urlTelechargement: presignedUrl,
                    displayUrl
                };
            });
            
            if (processed.length > 0) {
                this.imagesCache.set(recetteId, processed);
                console.log('✅', processed.length, 'image(s) mise(s) en cache');
            } else {
                console.warn('⚠️ Aucune image trouvée pour cette recette');
            }
            
            return processed;
        } catch (error) {
            console.error('[RecipeService] Erreur getImages:', error);
            return [];
        }
    }

    /**
     * Récupérer les documents d'une recette
     */
    async getDocuments(recetteId) {
        try {
            const response = await axios.get(`${API_URL}/${recetteId}/fichiers/documents`, {
                headers: this.getAuthHeader()
            });
            return (response.data || []).map(document => ({
                ...document,
                urlTelechargement: document.urlTelechargement ? normalizeImageUrl(document.urlTelechargement) : document.urlTelechargement,
                urlStream: this._buildStreamUrl(document.urlStream)
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
            if (response.data?.urlTelechargement) {
                response.data.urlTelechargement = normalizeImageUrl(response.data.urlTelechargement);
            }
            if (response.data?.urlStream) {
                response.data.urlStream = this._buildStreamUrl(response.data.urlStream);
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
            console.log('🗑️ Suppression fichier:', { recetteId, fichierId });
            console.log('📡 URL appelée:', `${API_URL}/${recetteId}/fichiers/${fichierId}`);
            
            // Appelle via ms-recette (API_URL) qui proxie vers ms-persistance
            await axios.delete(`${API_URL}/${recetteId}/fichiers/${fichierId}`, {
                headers: this.getAuthHeader()
            });
            
            console.log('✅ Fichier supprimé avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de la suppression:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                message: error.message,
                data: error.response?.data,
                url: error.config?.url
            });
            this.handleError(error);
        }
    }

    /**
     * Récupérer tous les aliments depuis MS-Persistance
     */
    async getAllAliments() {
        try {
            // Appeler directement ms-persistance (docker-compose expose l'API sous /api/persistance)
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
        // Hoist variables for use in catch fallback
        let allAliments = [];
        let user = null;
        let aliments_exclus_ids = [];
        let feedbacks_user = [];
        let global_averages = {};
        let ingredientIds = [];
        try {
            // 1. Récupérer tous les aliments pour mapper noms -> IDs
            allAliments = await this.getAllAliments();
            // 3. Appeler MS-Recommandation
            user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                throw new Error('Utilisateur non connecté');
            }
            aliments_exclus_ids = await this.getUserExclusions(user.id);
            feedbacks_user = await this.getUserFeedbacks(user.id);
            global_averages = {};
            // 2. Convertir les noms d'ingrédients en IDs avec une recherche flexible
            ingredientIds = ingredientNames.map(name => {
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
            // Si aucune recette candidate (422), tenter un fallback plus permissif
            if (error?.response?.status === 422 &&
                (error.response.data?.detail?.includes('Aucune recette candidate') ||
                 error.response.data?.detail?.includes('aucune recette'))) {
                console.warn('[RecipeService] Fallback recommandations: retrait des exclusions et élargissement du pool');
                try {
                    const retry = await axios.post(`${RECOMMENDATION_URL}/recommend/suggestions`, {
                        user_id: user.id.toString(),
                        ingredients_inclus: ingredientIds,
                        top_k: topK,
                        limit_candidates: 500,
                        aliments_exclus_ids: [], // enlever les exclusions pour élargir
                        feedbacks_user,
                        global_averages
                    }, {
                        headers: this.getAuthHeader()
                    });
                    return retry.data;
                } catch (retryErr) {
                    console.warn('[RecipeService] Fallback 1 échoué, tentative de suggestions populaires/récentes');
                    try {
                        const popular = await this.getPopularRecettes(topK * 2);
                        const list = Array.isArray(popular) && popular.length > 0
                            ? popular
                            : await this.getRecentRecettes(topK * 2);

                        if (Array.isArray(list) && list.length > 0) {
                            return { recommended_recipe_ids: list.map(r => r.id).slice(0, topK) };
                        }
                    } catch (altErr) {
                        console.warn('[RecipeService] Fallback 2 échoué:', altErr?.message);
                    }
                    // Dernier recours: message utilisateur
                    throw new Error(error.response.data?.detail || 'Aucune recette candidate après filtrage. Ajoutez des ingrédients plus courants ou réduisez les exclusions.');
                }
            }
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
     * Charger toutes les recettes
     */
    /**
     * Récupérer toutes les recettes avec cache et pagination
     * @param {number} page - Numéro de page (0-indexed)
     * @param {number} size - Taille de page (max 100)
     * @returns {Promise<Array>} Liste des recettes
     */
    async getAllRecipesWithCache(page = 0, size = 50) {
        try {
            console.log(`[RecipeService] Appel getAllRecipesWithCache vers ms-persistance (page=${page}, size=${size})`);
            const response = await axios.get(`${PERSISTENCE_URL}/recettes`, {
                params: { page, size },
                headers: this.getAuthHeader(),
                timeout: 30000 // Cache backend (Caffeine) réduit le temps à ~50ms après 1er appel
            });
            
            console.log('[RecipeService] Recettes reçues de ms-persistance (DTO léger, sans images):', response.data?.length || 0);
            return response.data || [];
        } catch (error) {
            console.error('[RecipeService] Erreur ms-persistance:', error.message);
            throw new Error('Impossible de charger les recettes depuis ms-persistance. Vérifiez la connexion à la base de données.');
        }
    }

    /**
     * Récupérer toutes les recettes (toutes pages confondues)
     * Utilise la pagination en boucle pour tout charger
     * @returns {Promise<Array>} Liste complète des recettes
     */
    async getAllRecettesComplete() {
        try {
            let allRecipes = [];
            let page = 0;
            const size = 100; // Max autorisé
            let hasMore = true;

            while (hasMore) {
                const recipes = await this.getAllRecipesWithCache(page, size);
                if (recipes.length === 0) {
                    hasMore = false;
                } else {
                    allRecipes = [...allRecipes, ...recipes];
                    hasMore = recipes.length === size; // Continue si page pleine
                    page++;
                }
            }

            console.log('[RecipeService] Total recettes chargées:', allRecipes.length);
            return allRecipes;
        } catch (error) {
            console.error('[RecipeService] Erreur getAllRecettesComplete:', error.message);
            throw error;
        }
    }

    /**
     * Récupérer les recettes en attente de validation
     * Utilise l'endpoint backend dédié (plus rapide avec index DB)
     */
    async getRecettesEnAttente() {
        try {
            console.log('[RecipeService] Appel /en-attente (endpoint optimisé backend)');
            const response = await axios.get(`${API_URL}/en-attente`, {
                headers: this.getAuthHeader(),
                timeout: 10000
            });
            console.log(`📋 Recettes en attente reçues: ${response.data?.length || 0}`);
            return normalizeRecipesImageUrls(response.data || []);
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
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Récupérer les recettes validées
     * Utilise l'endpoint backend dédié avec cache et index composite DB
     */
    async getRecettesValidees() {
        try {
            console.log('[RecipeService] Appel /validees (endpoint optimisé backend)');
            const response = await axios.get(`${API_URL}/validees`, {
                headers: this.getAuthHeader(),
                timeout: 10000
            });
            console.log(`✅ Recettes validées reçues: ${response.data?.length || 0}`);
            return normalizeRecipesImageUrls(response.data || []);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Récupérer les recettes rejetées
     * Utilise l'endpoint backend dédié avec cache et index composite DB
     */
    async getRecettesRejetees() {
        try {
            console.log('[RecipeService] Appel /rejetees (endpoint optimisé backend)');
            const response = await axios.get(`${API_URL}/rejetees`, {
                headers: this.getAuthHeader(),
                timeout: 10000
            });
            console.log(`❌ Recettes rejetées reçues: ${response.data?.length || 0}`);
            return normalizeRecipesImageUrls(response.data || []);
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
