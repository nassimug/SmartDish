import axios from 'axios';

const API_URL = process.env.REACT_APP_RECIPE_SERVICE_URL || 'http://localhost:8093/api/recettes';

class RecipesService {
    // Helper pour obtenir le token
    getAuthHeader() {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    // Helper pour gérer les erreurs
    handleError(error) {
        if (error.response) {
            const message = error.response.data?.error || error.response.data?.message || 'Une erreur est survenue';
            throw new Error(message);
        } else if (error.request) {
            throw new Error('Impossible de contacter le serveur');
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
     * Supprimer tous les fichiers d'une recette
     */
    async deleteAllFichiers(recetteId) {
        try {
            await axios.delete(`${API_URL}/${recetteId}/fichiers`, {
                headers: this.getAuthHeader()
            });
        } catch (error) {
            this.handleError(error);
        }
    }
}

export default new RecipesService();