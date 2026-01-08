import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
    Clock, Star, Users, ChefHat, Heart, Sparkles,
    ArrowLeft, CheckCircle2, AlertCircle, Loader2
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

    // Charger les recommandations IA
    useEffect(() => {
        const loadAIRecommendations = async () => {
            try {
                setLoading(true);
                setError(null);

                // Récupérer les ingrédients depuis les params URL
                const ingredientsParam = searchParams.get('ingredients');
                if (!ingredientsParam) {
                    setError('Aucun ingrédient sélectionné');
                    return;
                }

                const ingredients = JSON.parse(decodeURIComponent(ingredientsParam));
                setSelectedIngredients(ingredients);

                // Appeler l'IA pour générer des recommandations
                const recommendationResponse = await recipesService.generateRecommendations(ingredients, 3);

                if (recommendationResponse && recommendationResponse.recommended_recipe_ids) {
                    // Récupérer les détails des recettes recommandées
                    const recommendedIds = recommendationResponse.recommended_recipe_ids;

                    const recommendedRecipes = await Promise.all(
                        recommendedIds.map(async (recipeId) => {
                            try {
                                const recipeData = await recipesService.getRecetteById(parseInt(recipeId));

                                let note = recipeData.noteMoyenne || 0;
                                let nombreAvis = recipeData.nombreFeedbacks || 0;

                                if (!note || note === 0) {
                                    try {
                                        const ratingData = await feedbackService.getAverageRatingByRecetteId(recipeData.id);
                                        note = ratingData?.moyenneNote || 0;
                                        nombreAvis = ratingData?.nombreAvis || 0;
                                    } catch (ratingError) {
                                        console.log(`Pas de note pour recette ${recipeData.id}`);
                                    }
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
                                    instructions: recipeData.instructions || []
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
            <div className="ai-recommendations-page">
                <div className="ai-recommendations-container">
                    <div className="loading-state">
                        <div className="loading-animation">
                            <Sparkles className="loading-sparkle" />
                            <Loader2 className="loading-spinner" />
                        </div>
                        <h2 className="loading-title">L'IA analyse vos ingrédients...</h2>
                        <p className="loading-subtitle">
                            Notre intelligence artificielle recherche les meilleures recettes pour vous
                        </p>
                        <div className="loading-ingredients">
                            {selectedIngredients.map((ingredient, index) => (
                                <span key={index} className="ingredient-chip">
                                    {ingredient}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="ai-recommendations-page">
                <div className="ai-recommendations-container">
                    <div className="error-state">
                        <AlertCircle className="error-icon" />
                        <h2 className="error-title">Erreur de génération</h2>
                        <p className="error-message">{error}</p>
                        <div className="error-actions">
                            <button
                                onClick={() => navigate('/ingredients')}
                                className="btn btn-primary"
                            >
                                <ArrowLeft className="icon-sm" />
                                Retour aux ingrédients
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn btn-outline"
                            >
                                Réessayer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="ai-recommendations-page">
            <div className="ai-recommendations-container">
                {/* Header */}
                <div className="ai-recommendations-header">
                    <div className="header-navigation">
                        <button
                            onClick={() => navigate('/ingredients')}
                            className="btn-back"
                        >
                            <ArrowLeft className="icon-sm" />
                            Retour aux ingrédients
                        </button>
                    </div>

                    <div className="header-content">
                        <div className="ai-badge">
                            <Sparkles className="icon-lg" />
                            <span>Intelligence Artificielle</span>
                        </div>

                        <h1 className="page-title">Vos recettes personnalisées</h1>
                        <p className="page-subtitle">
                            Découvrez les 3 meilleures recettes créées spécialement pour vos ingrédients
                        </p>

                        <div className="selected-ingredients-display">
                            <h3 className="ingredients-title">
                                <ChefHat className="icon-sm" />
                                Ingrédients sélectionnés ({selectedIngredients.length})
                            </h3>
                            <div className="ingredients-chips">
                                {selectedIngredients.map((ingredient, index) => (
                                    <span key={index} className="ingredient-chip">
                                        {ingredient}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {recipes.length > 0 ? (
                    <>
                        <div className="results-summary">
                            <CheckCircle2 className="success-icon" />
                            <p className="success-message">
                                {recipes.length} recette{recipes.length > 1 ? 's' : ''} trouvée{recipes.length > 1 ? 's' : ''} !
                            </p>
                        </div>

                        <div className="ai-recommendations-grid">
                            {recipes.map((recipe, index) => (
                                <div key={recipe.id} className="ai-recipe-card">
                                    <div className="recipe-rank">
                                        <span className="rank-number">#{index + 1}</span>
                                        <span className="rank-label">Top</span>
                                    </div>

                                    <div className="recipe-image-wrapper">
                                        <img
                                            src={recipe.image}
                                            alt={recipe.title}
                                            className="recipe-image"
                                            onError={(e) => {
                                                e.target.src = RECIPE_PLACEHOLDER_URL;
                                            }}
                                        />

                                        <div className="recipe-badges">
                                            <span className={`difficulty-badge ${DIFFICULTY_COLORS[recipe.difficulty]}`}>
                                                {recipe.difficulty}
                                            </span>
                                            <span className="ai-recommendation-badge">
                                                <Sparkles className="icon-xs" />
                                                IA
                                            </span>
                                            <button
                                                className="btn-favorite"
                                                onClick={() => toggleFavorite(recipe.id)}
                                            >
                                                <Heart className={`icon-sm ${favorites.includes(recipe.id) ? 'favorite-active' : ''}`} />
                                            </button>
                                        </div>

                                        <div className="recipe-image-info">
                                            <div className="info-badge">
                                                <Clock className="icon-xs" />
                                                <span>{recipe.cookTimeDisplay}</span>
                                            </div>
                                            <div className="info-badge">
                                                <Users className="icon-xs" />
                                                <span>{recipe.servings}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="recipe-content">
                                        <div className="recipe-header">
                                            <h3 className="recipe-title">{recipe.title}</h3>
                                            <p className="recipe-description">{recipe.description}</p>
                                        </div>

                                        <div className="recipe-meta">
                                            <div className="recipe-rating">
                                                <Star className="star-icon star-filled" />
                                                <span className="rating-text">
                                                    {recipe.rating.toFixed(1)} ({recipe.reviews} avis)
                                                </span>
                                            </div>
                                            <div className="recipe-calories">
                                                {recipe.calories} kcal
                                            </div>
                                        </div>

                                        <div className="recipe-ingredients">
                                            <h4 className="ingredients-section-title">Ingrédients utilisés :</h4>
                                            <div className="ingredients-list">
                                                {recipe.ingredients.slice(0, 5).map((ingredient, idx) => (
                                                    <span key={idx} className="ingredient-item">
                                                        {ingredient}
                                                    </span>
                                                ))}
                                                {recipe.ingredients.length > 5 && (
                                                    <span className="ingredient-more">
                                                        +{recipe.ingredients.length - 5} autres
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="recipe-actions">
                                            <Link
                                                to={`/recette/${recipe.id}`}
                                                className="btn btn-primary btn-full"
                                            >
                                                Voir la recette complète
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="ai-recommendations-footer">
                            <div className="footer-content">
                                <Sparkles className="footer-icon" />
                                <h3 className="footer-title">Pas convaincu ?</h3>
                                <p className="footer-text">
                                    Essayez avec d'autres ingrédients ou explorez toutes nos recettes
                                </p>
                                <div className="footer-actions">
                                    <button
                                        onClick={() => navigate('/ingredients')}
                                        className="btn btn-outline"
                                    >
                                        <ChefHat className="icon-sm" />
                                        Changer d'ingrédients
                                    </button>
                                    <Link
                                        to="/suggestions"
                                        className="btn btn-primary"
                                    >
                                        Voir toutes les recettes
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="no-results">
                        <AlertCircle className="no-results-icon" />
                        <h2 className="no-results-title">Aucune recette trouvée</h2>
                        <p className="no-results-text">
                            L'IA n'a pas pu trouver de recettes correspondant à vos ingrédients.
                            Essayez avec d'autres ingrédients ou explorez notre catalogue complet.
                        </p>
                        <div className="no-results-actions">
                            <button
                                onClick={() => navigate('/ingredients')}
                                className="btn btn-primary"
                            >
                                <ArrowLeft className="icon-sm" />
                                Retour aux ingrédients
                            </button>
                            <Link
                                to="/suggestions"
                                className="btn btn-outline"
                            >
                                Voir toutes les recettes
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}