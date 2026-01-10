import { AlertCircle, Calendar, ChefHat, Clock, Plus, Search, ShoppingCart, Star, Trash2, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LazyImage } from '../../hooks/useLazyLoad';
import plannerService from '../../services/api/planner.service';
import recipeService from '../../services/api/recipe.service';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import { RECIPE_PLACEHOLDER_URL } from '../../utils/RecipePlaceholder';
import './PlannerPage.css';

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MEALS = ["Petit-déjeuner", "Déjeuner", "Dîner"];

export default function PlannerPage() {
    const { user } = useAuth();
    const [plannedMeals, setPlannedMeals] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentWeek, setCurrentWeek] = useState(null);
    const [currentYear, setCurrentYear] = useState(null);
    const selectedWeek = "Cette semaine";

    // Modal de sélection de recette
    const [showRecipeModal, setShowRecipeModal] = useState(false);
    const [modalDay, setModalDay] = useState(null);
    const [modalMeal, setModalMeal] = useState(null);
    const [availableRecipes, setAvailableRecipes] = useState([]);
    const [loadingRecipes, setLoadingRecipes] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Charger la planification au montage du composant
    useEffect(() => {
        loadPlanification();
    }, [user]);

    const loadPlanification = async () => {
        if (!user?.id) {
            console.log('[PlannerPage] Pas d\'utilisateur connecté');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError('');

            const { semaine, annee } = plannerService.getCurrentWeekAndYear();
            console.log('[PlannerPage] Chargement planification:', { utilisateurId: user.id, semaine, annee });
            setCurrentWeek(semaine);
            setCurrentYear(annee);

            const planification = await plannerService.getPlanification(user.id, semaine, annee);
            console.log('[PlannerPage] Planification reçue:', planification);

            const mealsData = await convertPlanificationToUI(planification);
            console.log('[PlannerPage] Données converties:', mealsData);
            setPlannedMeals(mealsData);
        } catch (err) {
            console.error('[PlannerPage] Erreur lors du chargement de la planification:', err);

            let errorMessage = 'Impossible de charger la planification';
            if (err.message.includes('contacter le serveur')) {
                errorMessage = 'Le serveur de planification n\'est pas disponible. Vérifiez que ms-persistance est démarré sur le port 8090.';
            } else if (err.response?.status === 404) {
                errorMessage = 'Aucune planification trouvée pour cette semaine.';
                setError('');
            } else if (err.response?.status === 500) {
                errorMessage = '⚠️ Erreur serveur (500) : Le backend a rencontré un problème. Vérifiez les logs Java de ms-persistance pour plus de détails.';
            } else {
                errorMessage = err.message || 'Impossible de charger la planification';
            }

            if (err.response?.status !== 404) {
                setError(errorMessage);
            }
            setPlannedMeals({
                Lundi: {},
                Mardi: {},
                Mercredi: {},
                Jeudi: {},
                Vendredi: {},
                Samedi: {},
                Dimanche: {},
            });
        } finally {
            setLoading(false);
        }
    };

    const convertPlanificationToUI = async (planification) => {
        const meals = {
            Lundi: {},
            Mardi: {},
            Mercredi: {},
            Jeudi: {},
            Vendredi: {},
            Samedi: {},
            Dimanche: {},
        };

        if (!planification || !planification.jours) return meals;

        const recipePromises = [];
        const recipeMap = new Map();

        Object.entries(planification.jours).forEach(([jourIndex, jourData]) => {
            const dayName = DAYS[parseInt(jourIndex)];
            if (!dayName || !jourData.repas) return;

            Object.entries(jourData.repas).forEach(([mealIndex, repasData]) => {
                const actualMealIndex = repasData.typeRepas !== undefined ? repasData.typeRepas : parseInt(mealIndex);
                const mealName = MEALS[actualMealIndex];
                if (!mealName) return;

                if (repasData.recetteId) {
                    if (!recipeMap.has(repasData.recetteId)) {
                        recipeMap.set(repasData.recetteId, []);
                        recipePromises.push(
                            recipeService.getRecetteById(repasData.recetteId)
                                .then(recipe => ({ id: repasData.recetteId, recipe }))
                                .catch(err => {
                                    console.error(`Erreur chargement recette ${repasData.recetteId}:`, err);
                                    return { id: repasData.recetteId, recipe: null };
                                })
                        );
                    }
                    recipeMap.get(repasData.recetteId).push({ dayName, mealName });
                } else if (repasData.noteLibre) {
                    meals[dayName][mealName] = {
                        title: repasData.noteLibre,
                        isNote: true,
                        image: RECIPE_PLACEHOLDER_URL,
                        cookTime: null,
                        servings: null,
                    };
                }
            });
        });

        if (recipePromises.length > 0) {
            const recipes = await Promise.all(recipePromises);

            const recipesWithImages = await Promise.all(
                recipes.map(async ({ id, recipe }) => {
                    if (!recipe) return { id, recipe: null, image: RECIPE_PLACEHOLDER_URL };

                    let imageUrl = RECIPE_PLACEHOLDER_URL;

                    try {
                        const images = await recipeService.getImages(recipe.id);

                        if (images && images.length > 0) {
                            const firstImage = images[0];
                            const bestUrl = firstImage.directUrl || firstImage.urlStream || firstImage.urlTelechargement || firstImage.url;
                            if (bestUrl) {
                                imageUrl = normalizeImageUrl(bestUrl);
                            }
                        } else if (recipe.imageUrl) {
                            imageUrl = normalizeImageUrl(recipe.imageUrl);
                        }
                    } catch (err) {
                        console.error(`Erreur chargement image recette ${id}:`, err);
                        if (recipe.imageUrl) {
                            imageUrl = normalizeImageUrl(recipe.imageUrl);
                        }
                    }

                    return { id, recipe, image: imageUrl };
                })
            );

            recipesWithImages.forEach(({ id, recipe, image }) => {
                const positions = recipeMap.get(id);
                if (!positions) return;

                positions.forEach(({ dayName, mealName }) => {
                    if (recipe) {
                        meals[dayName][mealName] = {
                            id: recipe.id,
                            title: recipe.titre,
                            image: image,
                            cookTime: recipe.tempsTotal ? `${recipe.tempsTotal} min` : null,
                            servings: recipe.nbPersonnes ? `${recipe.nbPersonnes} pers.` : null,
                        };
                    } else {
                        meals[dayName][mealName] = {
                            id: id,
                            title: 'Recette supprimée',
                            image: RECIPE_PLACEHOLDER_URL,
                            cookTime: null,
                            servings: null,
                        };
                    }
                });
            });
        }

        return meals;
    };

    const removeMeal = async (day, meal) => {
        if (!user?.id || !currentWeek || !currentYear) return;

        try {
            const dayIndex = plannerService.getDayIndex(day);
            const mealIndex = plannerService.getMealIndex(meal);

            await plannerService.deleteRepas(user.id, currentWeek, currentYear, dayIndex, mealIndex);

            setPlannedMeals((prev) => ({
                ...prev,
                [day]: {
                    ...prev[day],
                    [meal]: undefined,
                },
            }));
        } catch (err) {
            console.error('Erreur lors de la suppression du repas:', err);
            alert('Impossible de supprimer le repas: ' + err.message);
        }
    };

    const addMeal = async (day, meal) => {
        setModalDay(day);
        setModalMeal(meal);
        setShowRecipeModal(true);
        await loadAvailableRecipes();
    };

    const loadAvailableRecipes = async () => {
        try {
            setLoadingRecipes(true);
            let recipes = await recipeService.getAllRecipesWithCache();

            recipes = await recipeService.enrichManyWithFeedbacks(recipes);

            const recipesWithImages = await Promise.all(
                recipes.map(async (recipe) => {
                    try {
                        const images = await recipeService.getImages(recipe.id);
                        let imageUrl = RECIPE_PLACEHOLDER_URL;

                        if (images && images.length > 0) {
                            const firstImage = images[0];
                            const bestUrl = firstImage.directUrl || firstImage.urlStream || firstImage.urlTelechargement || firstImage.url;
                            if (bestUrl) {
                                imageUrl = normalizeImageUrl(bestUrl);
                            }
                        } else if (recipe.imageUrl) {
                            imageUrl = normalizeImageUrl(recipe.imageUrl);
                        }

                        return {
                            ...recipe,
                            imagePrincipale: imageUrl
                        };
                    } catch (err) {
                        console.error(`Erreur chargement image recette ${recipe.id}:`, err);
                        return {
                            ...recipe,
                            imagePrincipale: RECIPE_PLACEHOLDER_URL
                        };
                    }
                })
            );

            setAvailableRecipes(recipesWithImages);
        } catch (err) {
            console.error('Erreur chargement recettes:', err);
            setAvailableRecipes([]);
        } finally {
            setLoadingRecipes(false);
        }
    };

    const selectRecipe = async (recipe) => {
        if (!user?.id || !currentWeek || !currentYear || !modalDay || !modalMeal) {
            console.error('Données manquantes:', { userId: user?.id, currentWeek, currentYear, modalDay, modalMeal });
            alert('Données manquantes pour ajouter le repas');
            return;
        }

        try {
            const dayIndex = plannerService.getDayIndex(modalDay);
            const mealIndex = plannerService.getMealIndex(modalMeal);

            await plannerService.addOrUpdateRepas({
                utilisateurId: user.id,
                semaine: currentWeek,
                annee: currentYear,
                jour: dayIndex,
                typeRepas: mealIndex,
                recetteId: recipe.id,
                noteLibre: null
            });

            setPlannedMeals((prev) => ({
                ...prev,
                [modalDay]: {
                    ...prev[modalDay],
                    [modalMeal]: {
                        id: recipe.id,
                        title: recipe.titre,
                        image: recipe.imagePrincipale || RECIPE_PLACEHOLDER_URL,
                        cookTime: recipe.tempsTotal ? `${recipe.tempsTotal} min` : null,
                        servings: recipe.nbPersonnes ? `${recipe.nbPersonnes} pers.` : null,
                    },
                },
            }));

            closeRecipeModal();
        } catch (err) {
            console.error('Erreur lors de l\'ajout du repas:', err);
            alert('Impossible d\'ajouter le repas: ' + err.message);
        }
    };

    const closeRecipeModal = () => {
        setShowRecipeModal(false);
        setModalDay(null);
        setModalMeal(null);
        setSearchTerm('');
    };

    const filteredRecipes = availableRecipes.filter(recipe =>
        recipe.titre?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const generateShoppingList = () => {
        console.log("Génération de la liste de courses...");
        alert("Fonctionnalité de liste de courses à venir !");
    };

    const totalMeals = Object.values(plannedMeals).reduce((total, dayMeals) => {
        return total + Object.values(dayMeals).filter((meal) => meal).length;
    }, 0);

    return (
        <div className="planner-page">
            <div className="planner-container">
                {/* Header */}
                <div className="planner-header">
                    <div className="planner-badge">
                        <Calendar className="icon-sm" />
                        <span>Planificateur</span>
                    </div>

                    <h1 className="planner-title">Organisez vos <span className="title-accent">repas</span></h1>
                    <p className="planner-subtitle">
                        Planifiez votre semaine et simplifiez vos courses
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="error-banner">
                        <AlertCircle className="icon-sm" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Chargement de votre planification...</p>
                    </div>
                ) : (
                    <>
                        {/* Week Selector and Stats */}
                        <div className="planner-controls">
                            <div className="controls-left">
                                <button className="btn btn-week">
                                    <Calendar className="icon-sm" />
                                    {selectedWeek}
                                </button>
                                <span className="badge-meals">
                                    {totalMeals} repas planifié{totalMeals > 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="controls-right">
                                <button
                                    onClick={generateShoppingList}
                                    disabled={totalMeals === 0}
                                    className="btn btn-primary"
                                >
                                    <ShoppingCart className="icon-sm" />
                                    Liste de courses
                                </button>
                                <Link to="/suggestions" className="btn btn-outline">
                                    <Plus className="icon-sm" />
                                    Recettes
                                </Link>
                            </div>
                        </div>

                        {/* Weekly Planner Grid */}
                        <div className="planner-grid">
                            {DAYS.map((day) => (
                                <div key={day} className="day-card">
                                    <div className="day-header">
                                        <h3 className="day-title">{day}</h3>
                                    </div>
                                    <div className="day-content">
                                        <div className="meals-grid">
                                            {MEALS.map((meal) => {
                                                const plannedMeal = plannedMeals[day]?.[meal];

                                                return (
                                                    <div key={meal} className="meal-slot">
                                                        <h4 className="meal-label">{meal}</h4>

                                                        {plannedMeal ? (
                                                            <div className="meal-card">
                                                                <div className="meal-image">
                                                                    <LazyImage
                                                                        src={plannedMeal.image || RECIPE_PLACEHOLDER_URL}
                                                                        alt={plannedMeal.title}
                                                                        className="meal-image-img"
                                                                    />
                                                                </div>
                                                                <div className="meal-info">
                                                                    <h5 className="meal-title">{plannedMeal.title}</h5>
                                                                    <div className="meal-meta">
                                                                        {plannedMeal.cookTime && (
                                                                            <div className="meta-item">
                                                                                <Clock className="icon-xs" />
                                                                                <span>{plannedMeal.cookTime}</span>
                                                                            </div>
                                                                        )}
                                                                        {plannedMeal.servings && (
                                                                            <div className="meta-item">
                                                                                <Users className="icon-xs" />
                                                                                <span>{plannedMeal.servings}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    className="btn-remove-meal"
                                                                    onClick={() => removeMeal(day, meal)}
                                                                    title="Retirer ce repas"
                                                                >
                                                                    <Trash2 className="icon-xs" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="meal-empty">
                                                                <button
                                                                    className="btn-add-meal"
                                                                    onClick={() => addMeal(day, meal)}
                                                                    type="button"
                                                                >
                                                                    <Plus className="icon-md" />
                                                                    <span className="add-text">Ajouter</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Empty State */}
                        {totalMeals === 0 && (
                            <div className="empty-state">
                                <Calendar className="empty-icon" />
                                <h3 className="empty-title">Votre planificateur est vide</h3>
                                <p className="empty-description">
                                    Commencez à planifier vos repas pour la semaine
                                </p>
                                <Link to="/suggestions" className="btn btn-primary">
                                    <ChefHat className="icon-sm" />
                                    Découvrir des recettes
                                </Link>
                            </div>
                        )}

                        {/* Tips Card */}
                        <div className="tips-card">
                            <div className="tips-header">
                                <ChefHat className="icon-sm" />
                                <h3 className="tips-title">Astuce</h3>
                            </div>
                            <div className="tips-content">
                                <p>Planifiez vos repas selon votre emploi du temps et variez les types de cuisine pour éviter la monotonie.</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
            {/* Modal de sélection de recette */}
            {showRecipeModal && (
                <div className="modal-overlay" onClick={closeRecipeModal}>
                    <div className="modal-content recipe-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">Ajouter un repas</h2>
                                <p className="modal-subtitle">{modalDay} - {modalMeal}</p>
                            </div>
                            <button className="btn-close" onClick={closeRecipeModal}>
                                <X className="icon-sm" />
                            </button>
                        </div>

                        <div className="modal-search">
                            <Search className="search-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher une recette..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <div className="modal-body">
                            {loadingRecipes ? (
                                <div className="loading-state">
                                    <div className="spinner"></div>
                                    <p>Chargement des recettes...</p>
                                </div>
                            ) : filteredRecipes.length === 0 ? (
                                <div className="empty-state">
                                    <ChefHat className="empty-icon" />
                                    <p>Aucune recette trouvée</p>
                                </div>
                            ) : (
                                <div className="recipes-grid">
                                    {filteredRecipes.map((recipe) => (
                                        <div
                                            key={recipe.id}
                                            className="recipe-card-modal"
                                            onClick={() => selectRecipe(recipe)}
                                        >
                                            <div className="recipe-image-modal">
                                                <LazyImage
                                                    src={recipe.imagePrincipale || RECIPE_PLACEHOLDER_URL}
                                                    alt={recipe.titre}
                                                    className="recipe-image-modal-img"
                                                />
                                                {recipe.averageRating > 0 && (
                                                    <div className="recipe-rating-badge">
                                                        <Star className="icon-xs" fill="currentColor" />
                                                        <span>{recipe.averageRating.toFixed(1)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="recipe-info-modal">
                                                <h3 className="recipe-title-modal">{recipe.titre}</h3>
                                                <div className="recipe-meta-modal">
                                                    {recipe.tempsTotal && (
                                                        <div className="meta-item">
                                                            <Clock className="icon-xs" />
                                                            <span>{recipe.tempsTotal} min</span>
                                                        </div>
                                                    )}
                                                    {recipe.nbPersonnes && (
                                                        <div className="meta-item">
                                                            <Users className="icon-xs" />
                                                            <span>{recipe.nbPersonnes} pers.</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {recipe.feedbackCount > 0 && (
                                                    <div className="recipe-feedback-count">
                                                        {recipe.feedbackCount} avis
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}        </div>
    );
}