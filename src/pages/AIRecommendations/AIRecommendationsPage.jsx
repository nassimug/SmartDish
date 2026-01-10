import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
    Clock, Star, Users, ChefHat, Heart, Sparkles,
    ArrowLeft, CheckCircle2, AlertCircle, Flame
} from 'lucide-react';
import recipesService from '../../services/api/recipe.service';
import feedbackService from '../../services/api/feedback.service';
import { RECIPE_PLACEHOLDER_URL } from '../../utils/RecipePlaceholder';
import './AIRecommendationsPage.css';

const DIFFICULTY_COLORS = {
    FACILE: "difficulty-easy",
    MOYEN: "difficulty-medium",
    DIFFICILE: "difficulty-hard",
};

export default function AIRecommendationsPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [favorites, setFavorites] = useState([]);

    useEffect(() => {
        const loadAIRecommendations = async () => {
            try {
                setLoading(true);
                setError(null);

                const ingredientsParam = searchParams.get('ingredients');
                if (!ingredientsParam) {
                    setError('Aucun ingrédient sélectionné');
                    return;
                }

                const ingredients = JSON.parse(decodeURIComponent(ingredientsParam));
                setSelectedIngredients(ingredients);

                const recommendationResponse = await recipesService.generateRecommendations(ingredients, 3);

                if (recommendationResponse && recommendationResponse.recommended_recipe_ids) {
                    const recommendedIds = recommendationResponse.recommended_recipe_ids;

                    const recommendedRecipes = await Promise.all(
                        recommendedIds.map(async (recipeId) => {
                            try {
                                const recipeData = await recipesService.getRecetteById(parseInt(recipeId));

                                let note = 0;
                                let nombreAvis = 0;
                                let feedbacks = [];

                                try {
                                    feedbacks = await feedbackService.getFeedbacksByRecetteId(recipeData.id);
                                    feedbacks = feedbacks || [];

                                    const enrichedFeedbacks = await Promise.all(
                                        feedbacks.map(async (feedback) => {
                                            if (feedback.utilisateur?.prenom && feedback.utilisateur?.nom) {
                                                return feedback;
                                            }

                                            if (feedback.utilisateurId) {
                                                try {
                                                    const token = localStorage.getItem('token');
                                                    const response = await fetch(
                                                        `http://localhost:8090/api/persistance/utilisateurs/${feedback.utilisateurId}`,
                                                        {
                                                            headers: {
                                                                'Authorization': `Bearer ${token}`,
                                                                'Content-Type': 'application/json'
                                                            }
                                                        }
                                                    );

                                                    if (response.ok) {
                                                        const userData = await response.json();
                                                        return {
                                                            ...feedback,
                                                            utilisateur: {
                                                                id: userData.id,
                                                                prenom: userData.prenom || 'Utilisateur',
                                                                nom: userData.nom || 'Anonyme'
                                                            }
                                                        };
                                                    }
                                                } catch (error) {
                                                    console.error(`Erreur récupération utilisateur ${feedback.utilisateurId}:`, error);
                                                }
                                            }

                                            return {
                                                ...feedback,
                                                utilisateur: {
                                                    id: feedback.utilisateurId,
                                                    prenom: 'Utilisateur',
                                                    nom: `#${feedback.utilisateurId}`
                                                }
                                            };
                                        })
                                    );

                                    if (enrichedFeedbacks.length > 0) {
                                        const totalRating = enrichedFeedbacks.reduce(
                                            (sum, fb) => sum + (fb.evaluation || fb.note || 0),
                                            0
                                        );
                                        note = totalRating / enrichedFeedbacks.length;
                                        nombreAvis = enrichedFeedbacks.length;
                                    }

                                    feedbacks = enrichedFeedbacks;
                                } catch (feedbackError) {
                                    console.log(`Pas de feedbacks pour recette ${recipeData.id}`);
                                }

                                if (!note || note === 0) {
                                    note = recipeData.noteMoyenne || 0;
                                    nombreAvis = recipeData.nombreFeedbacks || 0;
                                }

                                return {
                                    id: recipeData.id,
                                    title: recipeData.titre,
                                    description: recipeData.description || 'Délicieuse recette recommandée par notre IA !',
                                    image: recipeData.imageUrl || RECIPE_PLACEHOLDER_URL,
                                    cookTime: recipeData.tempsTotal || 0,
                                    cookTimeDisplay: recipeData.tempsTotal ? `${recipeData.tempsTotal} min` : 'N/A',
                                    difficulty: recipeData.difficulte || 'FACILE',
                                    rating: note,
                                    reviews: nombreAvis,
                                    ingredients: recipeData.ingredients?.map(ing => ing.alimentNom) || [],
                                    tags: [recipeData.categorie || 'Recette', recipeData.difficulte || 'FACILE'],
                                    calories: recipeData.kcal || 0,
                                    servings: 4,
                                    categorie: recipeData.categorie,
                                    dateCreation: recipeData.dateCreation,
                                    instructions: recipeData.instructions || [],
                                    feedbacks: feedbacks
                                };
                            } catch (err) {
                                console.error(`Erreur pour recette ${recipeId}:`, err);
                                return null;
                            }
                        })
                    );

                    setRecipes(recommendedRecipes.filter(r => r !== null));
                } else {
                    setError('Aucune recommandation reçue de l\'IA');
                }
            } catch (error) {
                console.error('Erreur génération IA:', error);
                setError(error.message || 'Erreur lors de la génération des recommandations');
            } finally {
                setLoading(false);
            }
        };

        loadAIRecommendations();
    }, [searchParams]);

    const toggleFavorite = (recipeId) => {
        setFavorites((prev) =>
            prev.includes(recipeId)
                ? prev.filter((id) => id !== recipeId)
                : [...prev, recipeId]
        );
    };

    if (loading) {
        return (
            <div className="ai-page">
                <div className="ai-container">
                    <div className="loading-state">
                        <div className="loader-animation">
                            <Sparkles className="sparkle-icon" />
                            <div className="loader-spinner" />
                        </div>
                        <h2 className="loading-heading">Analyse en cours</h2>
                        <p className="loading-subtext">
                            Notre IA sélectionne les meilleures recettes pour vos ingrédients
                        </p>
                        <div className="ingredient-tags">
                            {selectedIngredients.map((ingredient, index) => (
                                <span key={index} className="ingredient-tag">{ingredient}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="ai-page">
                <div className="ai-container">
                    <div className="error-state">
                        <AlertCircle className="error-icon-lg" />
                        <h2 className="error-heading">Une erreur s'est produite</h2>
                        <p className="error-subtext">{error}</p>
                        <div className="error-actions-group">
                            <button onClick={() => navigate('/ingredients')} className="btn-main">
                                <ArrowLeft size={18} />
                                Retour
                            </button>
                            <button onClick={() => window.location.reload()} className="btn-secondary">
                                Réessayer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="ai-page">
            <div className="ai-container">
                {/* Hero Header */}
                <header className="hero-header">
                    <button onClick={() => navigate('/ingredients')} className="back-link">
                        <ArrowLeft size={20} />
                        <span>Ingrédients</span>
                    </button>

                    <div className="hero-content">
                        <div className="ai-stamp">
                            <Sparkles size={20} />
                            <span>IA Culinaire</span>
                        </div>

                        <h1 className="hero-title">
                            Vos recettes
                            <span className="hero-accent"> sur mesure</span>
                        </h1>

                        <p className="hero-description">
                            Trois créations sélectionnées avec soin pour sublimer vos ingrédients
                        </p>

                        <div className="ingredients-showcase">
                            <div className="showcase-label">
                                <ChefHat size={18} />
                                <span>Dans votre frigo</span>
                            </div>
                            <div className="showcase-list">
                                {selectedIngredients.map((ingredient, index) => (
                                    <span key={index} className="showcase-item">{ingredient}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </header>

                {recipes.length > 0 ? (
                    <>
                        <div className="success-banner">
                            <CheckCircle2 size={24} />
                            <span>{recipes.length} recette{recipes.length > 1 ? 's' : ''} sélectionnée{recipes.length > 1 ? 's' : ''}</span>
                        </div>

                        <div className="bento-grid">
                            {recipes.map((recipe, index) => (
                                <article key={recipe.id} className={`recipe-card card-${index + 1}`}>
                                    <div className="rank-badge">
                                        <span className="rank-position">#{index + 1}</span>
                                    </div>

                                    <div className="card-image-section">
                                        <img
                                            src={recipe.image}
                                            alt={recipe.title}
                                            className="card-image"
                                            onError={(e) => { e.target.src = RECIPE_PLACEHOLDER_URL; }}
                                        />

                                        <div className="image-overlay">
                                            <button
                                                className="favorite-button"
                                                onClick={() => toggleFavorite(recipe.id)}
                                            >
                                                <Heart
                                                    size={20}
                                                    className={favorites.includes(recipe.id) ? 'is-favorite' : ''}
                                                    fill={favorites.includes(recipe.id) ? 'currentColor' : 'none'}
                                                />
                                            </button>
                                        </div>

                                        <div className="image-badges">
                                            <span className={`difficulty-tag ${DIFFICULTY_COLORS[recipe.difficulty]}`}>
                                                {recipe.difficulty}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="card-content-section">
                                        <div className="card-header">
                                            <h3 className="card-title">{recipe.title}</h3>
                                        </div>

                                        <div className="stats-grid">
                                            <div className="stat-item">
                                                <Clock size={16} />
                                                <span>{recipe.cookTimeDisplay}</span>
                                            </div>
                                            <div className="stat-item">
                                                <Users size={16} />
                                                <span>{recipe.servings} pers.</span>
                                            </div>
                                            <div className="stat-item">
                                                <Flame size={16} />
                                                <span>{recipe.calories} kcal</span>
                                            </div>
                                        </div>

                                        <div className="card-rating">
                                            <Star size={18} fill="#D97706" color="#D97706" />
                                            <span className="rating-value">
                                                {recipe.rating > 0 ? recipe.rating.toFixed(1) : '—'}
                                            </span>
                                            <span className="rating-count">
                                                {recipe.reviews > 0 ? `${recipe.reviews} avis` : 'Pas encore d\'avis'}
                                            </span>
                                        </div>

                                        <div className="ingredients-preview">
                                            <p className="preview-label">Ingrédients clés</p>
                                            <div className="preview-tags">
                                                {recipe.ingredients.slice(0, 4).map((ing, idx) => (
                                                    <span key={idx} className="preview-tag">{ing}</span>
                                                ))}
                                                {recipe.ingredients.length > 4 && (
                                                    <span className="preview-more">+{recipe.ingredients.length - 4}</span>
                                                )}
                                            </div>
                                        </div>

                                        <Link to={`/recette/${recipe.id}`} className="card-cta">
                                            <span>Découvrir la recette</span>
                                            <ArrowLeft size={18} className="cta-arrow" />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <footer className="page-footer">
                            <div className="footer-content">
                                <Sparkles size={32} className="footer-icon" />
                                <h3 className="footer-title">Envie d'explorer davantage ?</h3>
                                <p className="footer-text">
                                    Changez vos ingrédients ou parcourez notre collection complète
                                </p>
                                <div className="footer-actions">
                                    <button onClick={() => navigate('/ingredients')} className="btn-secondary">
                                        <ChefHat size={18} />
                                        Nouveaux ingrédients
                                    </button>
                                    <Link to="/suggestions" className="btn-main">
                                        Toutes les recettes
                                    </Link>
                                </div>
                            </div>
                        </footer>
                    </>
                ) : (
                    <div className="no-results-state">
                        <AlertCircle size={64} className="no-results-icon" />
                        <h2 className="no-results-heading">Aucune correspondance</h2>
                        <p className="no-results-text">
                            Notre IA n'a pas trouvé de recettes pour cette combinaison d'ingrédients.
                        </p>
                        <div className="no-results-actions">
                            <button onClick={() => navigate('/ingredients')} className="btn-main">
                                <ArrowLeft size={18} />
                                Changer d'ingrédients
                            </button>
                            <Link to="/suggestions" className="btn-secondary">
                                Voir toutes les recettes
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}