/**
 * Utility functions for handling image URLs from MinIO
 */

/**
 * Normalise les URLs d'images en corrigeant le chemin du bucket MinIO
 * Transforme http(s)://minio:9000/... ou http://localhost:9002/recettes/... en URL publique consommable
 * @param {string} imageUrl - L'URL d'image à normaliser
 * @returns {string} - L'URL normalisée
 */
export const normalizeImageUrl = (imageUrl) => {
    if (!imageUrl) return imageUrl;
     const publicBase = process.env.REACT_APP_MINIO_PUBLIC_URL || 'http://localhost:9002/';
    // Normaliser l'hôte MinIO interne vers l'hôte accessible depuis le navigateur
     // minio:9000 (dans le réseau Docker) -> publicBase (port publié)
    let url = imageUrl
        .replace(/^https?:\/\/minio:9000\//, publicBase)
        .replace(/^https?:\/\/localhost:9000\//, publicBase);

    // Si c'est un chemin relatif sans protocole, construire l'URL publique
    if (!/^https?:\/\//.test(url)) {
        const cleaned = url.startsWith('/') ? url.slice(1) : url;
        const normalizedPath = cleaned.startsWith('recettes-bucket')
            ? cleaned
            : cleaned.replace(/^recettes\//, 'recettes-bucket/');
        return `${publicBase.replace(/\/$/, '')}/${normalizedPath}`;
    }

    // Remplace /recettes/ par /recettes-bucket/ uniquement si le chemin n'a pas déjà 'recettes-bucket'
    // Exemple: http://localhost:9002/recettes/... -> http://localhost:9002/recettes-bucket/...
    // Ne pas doubler: http://localhost:9002/recettes-bucket/recettes/... doit rester tel quel
    if (!/\/recettes-bucket\//.test(url) && /\/recettes\//.test(url)) {
        url = url.replace(/\/recettes\//, '/recettes-bucket/');
    }

    return url;
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