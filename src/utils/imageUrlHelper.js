/**
 * Utility functions for handling image URLs from MinIO
 */

/**
 * Normalise les URLs d'images en corrigeant le chemin du bucket MinIO
 * Transforme http(s)://minio:9000/... ou http://localhost:9002/recettes/... en URL publique consommable
 * IMPORTANT: Préserve les URLs externes (images d'autres utilisateurs/serveurs)
 * @param {string} imageUrl - L'URL d'image à normaliser
 * @returns {string} - L'URL normalisée
 */
export const normalizeImageUrl = (imageUrl) => {
    if (!imageUrl) return imageUrl;
    
    // IMPORTANT: Préserver les URLs de streaming backend (ms-persistance)
    // Ces URLs sont déjà correctes et gèrent l'auth + CORS
    if (imageUrl.includes('/api/persistance/') || imageUrl.includes('/stream')) {
        return imageUrl;
    }
    
    const publicBase = process.env.REACT_APP_MINIO_PUBLIC_URL || 'http://localhost:9002/';
    
    // Si c'est déjà une URL externe complète (pas localhost, pas minio interne), la retourner telle quelle
    // Cela permet d'afficher les images d'autres utilisateurs/serveurs
    if (/^https?:\/\//.test(imageUrl)) {
        // URLs internes MinIO à normaliser (remplacer minio:9000 ou localhost par l'URL publique)
        if (imageUrl.includes('minio:9000') || imageUrl.includes('localhost:9000') || imageUrl.includes('localhost:9002')) {
            // Utiliser l'URL publique MinIO depuis les variables d'environnement
            const minioPublicUrl = publicBase.replace(/\/$/, '');
            let url = imageUrl
                .replace(/https?:\/\/minio:9000\//g, `${minioPublicUrl}/`)
                .replace(/https?:\/\/localhost:9000\//g, `${minioPublicUrl}/`)
                .replace(/https?:\/\/localhost:9002\//g, `${minioPublicUrl}/`);
            
            // Nettoyer les double-slashes dans le chemin
            url = url.replace(/([^:])(\/\/+)/g, '$1/');
            
            // Remplace /recettes/ par /recettes-bucket/ si nécessaire
            if (!/\/recettes-bucket\//.test(url) && /\/recettes\//.test(url)) {
                url = url.replace(/\/recettes\//, '/recettes-bucket/');
            }
            return url;
        }
        
        // URLs externes (autres serveurs, CDN, etc.) - retourner tel quel
        return imageUrl;
    }

    // Si c'est un chemin relatif sans protocole, construire l'URL publique locale
    const cleaned = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    const normalizedPath = cleaned.startsWith('recettes-bucket')
        ? cleaned
        : cleaned.replace(/^recettes\//, 'recettes-bucket/');
    return `${publicBase.replace(/\/$/, '')}/${normalizedPath}`;
};

/**
 * Construit une URL stream en utilisant le path backend
 * Pour les uploads récents qui ont un urlStream
 * @param {string} urlStream - Le chemin stream du backend (ex: /api/persistance/recettes/...)
 * @param {string} apiBaseUrl - L'URL de base de l'API (ex: http://localhost:8093)
 * @returns {string} - L'URL absolue pour le streaming
 */
export const buildStreamUrl = (urlStream, apiBaseUrl) => {
    if (!urlStream || !apiBaseUrl) return null;
    // Si c'est déjà une URL absolue, retourner as-is
    if (urlStream.startsWith('http')) return urlStream;
    // Sinon construire l'URL via ms-recette
    const baseUrl = apiBaseUrl.replace('/api/recettes', '');
    return baseUrl + '/api/recettes' + urlStream.replace('/api/persistance/recettes', '');
};

/**
 * Normalise un objet recette en corrigeant son imageUrl
 * @param {object} recipe - L'objet recette
 * @returns {object} - La recette avec imageUrl normalisée
 */
export const normalizeRecipeImageUrl = (recipe) => {
    if (!recipe) return recipe;
    
    return {
        ...recipe,
        imageUrl: recipe.imageUrl ? normalizeImageUrl(recipe.imageUrl) : recipe.imageUrl,
        image: recipe.image ? normalizeImageUrl(recipe.image) : recipe.image
    };
};

/**
 * Normalise un tableau de recettes
 * @param {array} recipes - Tableau de recettes
 * @returns {array} - Tableau de recettes avec URLs normalisées
 */
export const normalizeRecipesImageUrls = (recipes) => {
    if (!Array.isArray(recipes)) return recipes;
    return recipes.map(normalizeRecipeImageUrl);
};