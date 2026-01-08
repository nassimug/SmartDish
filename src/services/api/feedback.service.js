import axios from 'axios';

// ms-feedback est en local, donc on utilise localhost directement
const API_URL = process.env.REACT_APP_FEEDBACK_SERVICE_URL || 'http://localhost:8091/api/feedbacks';

class FeedbackService {
    // Helper pour obtenir le token
    getAuthHeader() {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    // Helper pour gérer les erreurs
    handleError(error) {
        if (error.response) {
            // Erreur du serveur avec message personnalisé
            const message = error.response.data?.error || error.response.data?.message || 'Une erreur est survenue';
            throw new Error(message);
        } else if (error.request) {
            // Erreur de requête (pas de réponse du serveur)
            throw new Error('Impossible de contacter le serveur');
        } else {
            // Autre erreur
            throw new Error(error.message || 'Une erreur inconnue est survenue');
        }
    }

    /**
     * Créer un nouveau feedback (avis/commentaire)
     */
    async createFeedback(feedbackData) {
        try {
            const response = await axios.post(`${API_URL}`, feedbackData, {
                headers: this.getAuthHeader()
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Récupérer tous les feedbacks (Admin)
     */
    async getAllFeedbacks() {
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
     * Récupérer un feedback par son ID
     */
    async getFeedbackById(id) {
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
     * Récupérer tous les feedbacks d'un utilisateur
     */
    async getFeedbacksByUtilisateurId(utilisateurId) {
        try {
            const response = await axios.get(`${API_URL}/utilisateur/${utilisateurId}`, {
                headers: this.getAuthHeader()
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Récupérer tous les feedbacks (avis) d'une recette
     */
    async getFeedbacksByRecetteId(recetteId) {
        try {
            const response = await axios.get(`${API_URL}/recette/${recetteId}`, {
                headers: this.getAuthHeader()
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Récupérer la note moyenne d'une recette
     */
    async getAverageRatingByRecetteId(recetteId) {
        try {
            const response = await axios.get(`${API_URL}/recette/${recetteId}/average`, {
                headers: this.getAuthHeader()
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Mettre à jour un feedback
     */
    async updateFeedback(id, updateData) {
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
     * Supprimer un feedback
     */
    async deleteFeedback(id) {
        try {
            await axios.delete(`${API_URL}/${id}`, {
                headers: this.getAuthHeader()
            });
        } catch (error) {
            this.handleError(error);
        }
    }

    // ==========================================
    // MÉTHODES UTILITAIRES SUPPLÉMENTAIRES
    // ==========================================

    /**
     * Vérifier si un utilisateur a déjà commenté une recette
     */
    async hasUserReviewedRecipe(utilisateurId, recetteId) {
        try {
            const feedbacks = await this.getFeedbacksByUtilisateurId(utilisateurId);
            return feedbacks.some(fb => fb.recetteId === String(recetteId));
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Récupérer le feedback d'un utilisateur pour une recette spécifique
     */
    async getUserFeedbackForRecipe(utilisateurId, recetteId) {
        try {
            const feedbacks = await this.getFeedbacksByUtilisateurId(utilisateurId);
            return feedbacks.find(fb => fb.recetteId === String(recetteId)) || null;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Créer ou mettre à jour le feedback d'un utilisateur pour une recette
     */
    async createOrUpdateFeedback(utilisateurId, recetteId, note, commentaire) {
        try {
            // Vérifier si un feedback existe déjà
            const existingFeedback = await this.getUserFeedbackForRecipe(utilisateurId, recetteId);

            if (existingFeedback) {
                // Mettre à jour le feedback existant
                return await this.updateFeedback(existingFeedback.id, { note, commentaire });
            } else {
                // Créer un nouveau feedback
                return await this.createFeedback({
                    utilisateurId,
                    recetteId: String(recetteId),
                    note,
                    commentaire
                });
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Obtenir les statistiques de notation d'une recette
     */
    async getRatingStatistics(recetteId) {
        try {
            const feedbacks = await this.getFeedbacksByRecetteId(recetteId);
            const average = await this.getAverageRatingByRecetteId(recetteId);

            // Compter les notes par étoile
            const ratingCounts = {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0
            };

            feedbacks.forEach(fb => {
                if (fb.note >= 1 && fb.note <= 5) {
                    ratingCounts[fb.note]++;
                }
            });

            return {
                moyenneNote: average.moyenneNote || 0,
                nombreAvis: average.nombreAvis || feedbacks.length,
                repartitionNotes: ratingCounts,
                feedbacks: feedbacks
            };
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Récupérer les feedbacks récents (avec pagination)
     */
    async getRecentFeedbacks(recetteId, limit = 10) {
        try {
            const feedbacks = await this.getFeedbacksByRecetteId(recetteId);

            // Trier par date de création (du plus récent au plus ancien)
            const sortedFeedbacks = feedbacks.sort((a, b) => {
                const dateA = new Date(a.dateCreation || a.createdAt);
                const dateB = new Date(b.dateCreation || b.createdAt);
                return dateB - dateA;
            });

            // Limiter le nombre de résultats
            return sortedFeedbacks.slice(0, limit);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Récupérer les feedbacks avec une note spécifique
     */
    async getFeedbacksByRating(recetteId, note) {
        try {
            const feedbacks = await this.getFeedbacksByRecetteId(recetteId);
            return feedbacks.filter(fb => fb.note === note);
        } catch (error) {
            this.handleError(error);
        }
    }
}

export default new FeedbackService();