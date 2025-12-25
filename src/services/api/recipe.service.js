import axios from 'axios';

const API_URL = process.env.REACT_APP_RECIPE_SERVICE_URL || 'http://localhost:8093/api/recettes';
const PERSISTENCE_URL = process.env.REACT_APP_PERSISTENCE_SERVICE_URL || 'http://localhost:8090/api/persistance';
const RECOMMENDATION_URL = process.env.REACT_APP_RECOMMENDATION_SERVICE_URL || 'http://localhost:8095/api';

class RecipesService {
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
            return response.data;
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
            return response.data;
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
            return response.data;
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
            return response.data;
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
            return response.data;
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
            return response.data;
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
            return response.data;
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
            return response.data;
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
            const response = await axios.get(`${API_URL}/${recetteId}/fichiers`, {
                headers: this.getAuthHeader()
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Récupérer les images d'une recette
     */
    async getImages(recetteId) {
        try {
            const response = await axios.get(`${API_URL}/${recetteId}/fichiers/images`, {
                headers: this.getAuthHeader()
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
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
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Télécharger un fichier
     */
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

    /**
     * Récupérer les métadonnées d'un fichier
     */
    async getFichierMetadata(recetteId, fichierId) {
        try {
            const response = await axios.get(
                `${API_URL}/${recetteId}/fichiers/${fichierId}`,
                {
                    headers: this.getAuthHeader()
                }
            );
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
                        a.nom && this.removeAccents(a.nom.toLowerCase()).startsWith(withoutAccents) ||
                        withoutAccents.startsWith(this.removeAccents(a.nom.toLowerCase()))
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

            // 3. Appeler MS-Recommandation
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
     * Supprimer les accents d'une chaîne
     */
    removeAccents(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
}

export default new RecipesService();