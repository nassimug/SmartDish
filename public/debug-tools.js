/**
 * OUTIL DE DIAGNOSTIC DES IMAGES SMARTDISH
 * 
 * Copiez-collez ce code dans la console du navigateur (F12)
 * pour diagnostiquer les problèmes d'images
 */

window.SmartDishDebug = {
    /**
     * Test 1: Vérifier la configuration
     */
    checkConfig: function() {
        console.group('🔧 Configuration MinIO');
        console.log('REACT_APP_MINIO_PUBLIC_URL:', process.env.REACT_APP_MINIO_PUBLIC_URL);
        console.log('REACT_APP_PERSISTENCE_SERVICE_URL:', process.env.REACT_APP_PERSISTENCE_SERVICE_URL);
        console.log('REACT_APP_RECIPE_SERVICE_URL:', process.env.REACT_APP_RECIPE_SERVICE_URL);
        console.groupEnd();
    },

    /**
     * Test 2: Vérifier les images d'une recette
     */
    checkRecipeImages: async function(recetteId) {
        console.group('🖼️ Images Recette ' + recetteId);
        try {
            const token = localStorage.getItem('token');
            const persistenceUrl = process.env.REACT_APP_PERSISTENCE_SERVICE_URL || 'http://localhost:8090/api/persistance';
            
            const response = await fetch(`${persistenceUrl}/recettes/${recetteId}/fichiers/images`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const images = await response.json();
            console.log('Nombre d\'images:', images.length);
            
            images.forEach((img, index) => {
                console.group(`Image ${index + 1}: ${img.nom}`);
                console.log('ID:', img.id);
                console.log('Nom:', img.nom);
                console.log('Type MIME:', img.typeMime);
                console.log('Taille:', (img.taille / 1024).toFixed(2), 'KB');
                console.log('Chemin fichier:', img.cheminFichier);
                console.log('URL Téléchargement:', img.urlTelechargement);
                console.log('URL Stream:', img.urlStream);
                
                // Tester l'accès à l'image
                if (img.urlTelechargement) {
                    console.log('🔗 Test URL présignée...');
                    this.testImageUrl(img.urlTelechargement);
                }
                
                if (img.urlStream) {
                    const streamUrl = img.urlStream.startsWith('http') 
                        ? img.urlStream 
                        : `${persistenceUrl}/${img.urlStream.replace(/^\/+/, '')}`;
                    console.log('🔗 Test URL stream:', streamUrl);
                    this.testImageUrl(streamUrl);
                }
                
                console.groupEnd();
            });
            
            return images;
        } catch (error) {
            console.error('❌ Erreur:', error);
        } finally {
            console.groupEnd();
        }
    },

    /**
     * Test 3: Tester une URL d'image
     */
    testImageUrl: function(url) {
        const img = new Image();
        img.onload = function() {
            console.log('✅ Image chargée:', url.substring(0, 100) + '...');
            console.log('   Dimensions:', img.width, 'x', img.height);
        };
        img.onerror = function() {
            console.error('❌ Échec chargement:', url.substring(0, 100) + '...');
        };
        img.src = url;
    },

    /**
     * Test 4: Tester l'accès au bucket MinIO
     */
    testMinIOAccess: async function() {
        console.group('🪣 Test Accès MinIO');
        const minioUrl = process.env.REACT_APP_MINIO_PUBLIC_URL || 'http://localhost:9002';
        
        const testUrls = [
            `${minioUrl}/minio/health/live`,
            `${minioUrl}/recettes-bucket/`,
            `${minioUrl}/`
        ];
        
        for (const url of testUrls) {
            try {
                console.log('Test:', url);
                const response = await fetch(url, { method: 'HEAD' });
                console.log('   Status:', response.status, response.statusText);
            } catch (error) {
                console.error('   Erreur:', error.message);
            }
        }
        console.groupEnd();
    },

    /**
     * Test 5: Lister les buckets (nécessite authentification MinIO)
     */
    testBucketAccess: async function() {
        console.group('🪣 Test Bucket recettes-bucket');
        const minioUrl = process.env.REACT_APP_MINIO_PUBLIC_URL || 'http://localhost:9002';
        const bucketUrl = `${minioUrl}/recettes-bucket/`;
        
        try {
            const response = await fetch(bucketUrl);
            console.log('Status:', response.status);
            console.log('Headers:', [...response.headers.entries()]);
            
            if (response.ok) {
                const text = await response.text();
                console.log('Contenu:', text.substring(0, 500));
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
        console.groupEnd();
    },

    /**
     * Test 6: Vérifier toutes les recettes avec images manquantes
     */
    findBrokenImages: async function() {
        console.group('🔍 Recherche d\'images cassées');
        try {
            const token = localStorage.getItem('token');
            const recipeUrl = process.env.REACT_APP_RECIPE_SERVICE_URL || 'https://ms-recette-production.up.railway.app/api/recettes';
            
            const response = await fetch(`${recipeUrl}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const recipes = await response.json();
            console.log('Nombre total de recettes:', recipes.length);
            
            const broken = [];
            for (const recipe of recipes) {
                if (recipe.imageUrl) {
                    const img = new Image();
                    img.src = recipe.imageUrl;
                    await new Promise(resolve => {
                        img.onload = resolve;
                        img.onerror = () => {
                            broken.push({ id: recipe.id, titre: recipe.titre, url: recipe.imageUrl });
                            resolve();
                        };
                        setTimeout(resolve, 3000); // Timeout 3s
                    });
                }
            }
            
            console.log('Images cassées:', broken.length);
            console.table(broken);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            console.groupEnd();
        }
    },

    /**
     * Lancer tous les tests
     */
    runAll: async function(recetteId = 68) {
        this.checkConfig();
        await this.testMinIOAccess();
        await this.testBucketAccess();
        await this.checkRecipeImages(recetteId);
    }
};

// Message d'aide
console.log('%c🚀 SmartDish Debug Tools chargé!', 'color: #4CAF50; font-size: 16px; font-weight: bold');
console.log('%cUtilisation:', 'color: #2196F3; font-weight: bold');
console.log('SmartDishDebug.checkConfig()          - Vérifier la configuration');
console.log('SmartDishDebug.checkRecipeImages(68)  - Vérifier les images de la recette 68');
console.log('SmartDishDebug.testMinIOAccess()      - Tester l\'accès à MinIO');
console.log('SmartDishDebug.testBucketAccess()     - Tester l\'accès au bucket');
console.log('SmartDishDebug.runAll(68)             - Lancer tous les tests');
