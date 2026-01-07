import {
    ArrowRight,
    Calendar,
    ChefHat,
    ChevronLeft, ChevronRight,
    Clock,
    Flame,
    Heart, Search,
    SlidersHorizontal,
    Sparkles,
    Star, Users,
    Utensils,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import recipesService from '../../services/api/recipe.service';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import { RECIPE_PLACEHOLDER_URL } from '../../utils/RecipePlaceholder';
import './SuggestionsPage.css';

const DIFFICULTY_COLORS = {
    FACILE: "difficulty-easy",
    MOYEN: "difficulty-medium",
    DIFFICILE: "difficulty-hard",
};

const ITEMS_PER_PAGE = 12;

export default function SuggestionsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [favorites, setFavorites] = useState([]);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Filtres avancés
    const [advancedFilters, setAdvancedFilters] = useState({
        difficulty: '',
        maxTime: '',
        minRating: 0,
        maxCalories: '',
        sortBy: 'popular' // popular, rating, time, recent, name
    });

    // Charger les recettes depuis l'API
    useEffect(() => {
        const loadRecipes = async () => {
            try {
                setLoading(true);

                // Appel direct ms-persistance avec fallback pour éviter 503 de ms-recette
                const data = await recipesService.getAllRecipesWithCache();

                // Enrichir avec les notes
                const recipesWithRatings = await Promise.all(
                    data.map(async (recipe) => {
                        try {
                            // Enrichir avec feedbacks pour avoir la vraie moyenne
                            const enriched = await recipesService.enrichWithFeedbacks(recipe);
                            
                            let note = enriched.note || 0;
                            let nombreAvis = enriched.nombreAvis || 0;

                            // Choisir la meilleure image disponible (urlStream > directUrl > presigned > fallback)
                            let imageUrl = recipe.imageUrl ? normalizeImageUrl(recipe.imageUrl) : null;
                            console.log('[Suggestions] Base imageUrl', recipe.id, recipe.imageUrl);
                            try {
                                const imgs = await recipesService.getImages(recipe.id);
                                if (imgs && imgs.length > 0) {
                                    // PRIORITÉ: urlStream (backend) > directUrl (MinIO) > presigned > fallback
                                    const best = imgs[0].urlStream || imgs[0].directUrl || imgs[0].urlTelechargement || imgs[0].url;
                                    if (best) {
                                        imageUrl = normalizeImageUrl(best);
                                        console.log('[Suggestions] Using images[0]', recipe.id, 'via', imgs[0].urlStream ? 'urlStream' : 'directUrl', imageUrl?.substring(0, 80));
                                    }
                                }
                            } catch (e) {
                                console.warn('[Suggestions] getImages failed', recipe.id, e);
                            }

                            if (!imageUrl) {
                                imageUrl = RECIPE_PLACEHOLDER_URL;
                                console.warn('[Suggestions] Fallback placeholder', recipe.id);
                            }

                            return {
                                id: recipe.id,
                                title: recipe.titre,
                                description: recipe.description || 'Délicieuse recette à découvrir !',
                                image: imageUrl || RECIPE_PLACEHOLDER_URL,
                                cookTime: recipe.tempsTotal || 0,
                                cookTimeDisplay: recipe.tempsTotal ? `${recipe.tempsTotal} min` : 'N/A',
                                difficulty: recipe.difficulte || 'FACILE',
                                rating: note,
                                reviews: nombreAvis,
                                ingredients: recipe.ingredients?.map(ing => ing.alimentNom) || [],
                                tags: [recipe.categorie || 'Recette', recipe.difficulte || 'FACILE'],
                                calories: recipe.kcal || 0,
                                servings: 4,
                                categorie: recipe.categorie,
                                dateCreation: recipe.dateCreation,
                                statut: recipe.statut,
                                actif: recipe.actif
                            };
                        } catch (err) {
                            console.error(`Erreur pour recette ${recipe.id}:`, err);
                            return null;
                        }
                    })
                );

                const validRecipes = recipesWithRatings.filter(r => r !== null);
                // Filtrer pour n'afficher QUE les recettes VALIDEES; afficher aussi celles sans flag actif (true par défaut)
                const filteredByStatus = validRecipes.filter(r => r.statut === 'VALIDEE' && r.actif !== false);
                setRecipes(filteredByStatus);
            } catch (err) {
                console.error('Erreur chargement recettes:', err);
            } finally {
                setLoading(false);
            }
        };

        loadRecipes();
    }, []);

    const toggleFavorite = (recipeId) => {
        setFavorites((prev) =>
            prev.includes(recipeId)
                ? prev.filter((id) => id !== recipeId)
                : [...prev, recipeId]
        );
    };

    // Appliquer tous les filtres
    const filteredRecipes = recipes.filter((recipe) => {
        // Filtre de recherche
        const matchesSearch =
            recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            recipe.ingredients.some((ing) => ing.toLowerCase().includes(searchTerm.toLowerCase()));

        // Filtre par catégorie
        const matchesFilter =
            selectedFilter === "all" ||
            recipe.tags.some((tag) => tag.toLowerCase().includes(selectedFilter.toLowerCase())) ||
            recipe.categorie?.toLowerCase().includes(selectedFilter.toLowerCase());

        // Filtre par difficulté
        const matchesDifficulty =
            !advancedFilters.difficulty ||
            recipe.difficulty === advancedFilters.difficulty;

        // Filtre par temps maximum
        const matchesMaxTime =
            !advancedFilters.maxTime ||
            recipe.cookTime <= parseInt(advancedFilters.maxTime);

        // Filtre par note minimale
        const matchesMinRating =
            recipe.rating >= advancedFilters.minRating;

        // Filtre par calories maximum
        const matchesMaxCalories =
            !advancedFilters.maxCalories ||
            recipe.calories <= parseInt(advancedFilters.maxCalories);

        return matchesSearch && matchesFilter && matchesDifficulty &&
            matchesMaxTime && matchesMinRating && matchesMaxCalories;
    });

    // Tri
    const sortedRecipes = [...filteredRecipes].sort((a, b) => {
        switch (advancedFilters.sortBy) {
            case 'rating':
                return b.rating - a.rating;
            case 'time':
                return a.cookTime - b.cookTime;
            case 'recent':
                return new Date(b.dateCreation) - new Date(a.dateCreation);
            case 'name':
                return a.title.localeCompare(b.title);
            case 'popular':
            default:
                return b.reviews - a.reviews;
        }
    });

    // Pagination
    const totalPages = Math.ceil(sortedRecipes.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedRecipes = sortedRecipes.slice(startIndex, endIndex);

    // Réinitialiser à la page 1 quand les filtres changent
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedFilter, advancedFilters]);

    // Extraire les catégories uniques
    const categories = [...new Set(recipes.map(r => r.categorie).filter(Boolean))];

    // Réinitialiser les filtres avancés
    const resetAdvancedFilters = () => {
        setAdvancedFilters({
            difficulty: '',
            maxTime: '',
            minRating: 0,
            maxCalories: '',
            sortBy: 'popular'
        });
    };

    if (loading) {
        return (
            <div className="suggestions-page">
                <div className="suggestions-container">
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Chargement des recettes...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="suggestions-page">
            <div className="suggestions-container">
                {/* Header */}
                <div className="suggestions-header">
                    <div className="suggestions-badge">
                        <Sparkles className="icon-sm" />
                        <span>Suggestions personnalisées</span>
                    </div>

                    <h1 className="suggestions-title">Vos recettes suggérées par l'IA</h1>
                    <p className="suggestions-subtitle">
                        Découvrez des recettes créées spécialement pour vous à partir de vos ingrédients disponibles.
                    </p>
                </div>

                {/* Filters and Search */}
                <div className="filters-section">
                    <div className="search-filter-row">
                        <div className="search-wrapper">
                            <Search className="search-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher une recette, un ingrédient..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            {searchTerm && (
                                <button
                                    className="search-clear"
                                    onClick={() => setSearchTerm('')}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        <button
                            className={`btn-advanced-filters ${showAdvancedFilters ? 'active' : ''}`}
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        >
                            <SlidersHorizontal className="icon-sm" />
                            Filtres avancés
                        </button>
                    </div>

                    {/* Advanced Filters Panel */}
                    {showAdvancedFilters && (
                        <div className="advanced-filters-panel">
                            <div className="filters-grid">
                                {/* Difficulté */}
                                <div className="filter-group">
                                    <label className="filter-label">Difficulté</label>
                                    <select
                                        value={advancedFilters.difficulty}
                                        onChange={(e) => setAdvancedFilters({...advancedFilters, difficulty: e.target.value})}
                                        className="filter-select"
                                    >
                                        <option value="">Toutes</option>
                                        <option value="FACILE">Facile</option>
                                        <option value="MOYEN">Moyen</option>
                                        <option value="DIFFICILE">Difficile</option>
                                    </select>
                                </div>

                                {/* Temps maximum */}
                                <div className="filter-group">
                                    <label className="filter-label">Temps max</label>
                                    <select
                                        value={advancedFilters.maxTime}
                                        onChange={(e) => setAdvancedFilters({...advancedFilters, maxTime: e.target.value})}
                                        className="filter-select"
                                    >
                                        <option value="">Tous</option>
                                        <option value="15">15 min</option>
                                        <option value="30">30 min</option>
                                        <option value="60">1 heure</option>
                                        <option value="120">2 heures</option>
                                    </select>
                                </div>

                                {/* Note minimale */}
                                <div className="filter-group">
                                    <label className="filter-label">Note min</label>
                                    <select
                                        value={advancedFilters.minRating}
                                        onChange={(e) => setAdvancedFilters({...advancedFilters, minRating: parseFloat(e.target.value)})}
                                        className="filter-select"
                                    >
                                        <option value="0">Toutes</option>
                                        <option value="3">3+ ⭐</option>
                                        <option value="4">4+ ⭐</option>
                                        <option value="4.5">4.5+ ⭐</option>
                                    </select>
                                </div>

                                {/* Calories max */}
                                <div className="filter-group">
                                    <label className="filter-label">Calories max</label>
                                    <select
                                        value={advancedFilters.maxCalories}
                                        onChange={(e) => setAdvancedFilters({...advancedFilters, maxCalories: e.target.value})}
                                        className="filter-select"
                                    >
                                        <option value="">Toutes</option>
                                        <option value="300">300 kcal</option>
                                        <option value="500">500 kcal</option>
                                        <option value="700">700 kcal</option>
                                    </select>
                                </div>

                                {/* Tri */}
                                <div className="filter-group">
                                    <label className="filter-label">Trier par</label>
                                    <select
                                        value={advancedFilters.sortBy}
                                        onChange={(e) => setAdvancedFilters({...advancedFilters, sortBy: e.target.value})}
                                        className="filter-select"
                                    >
                                        <option value="popular">Popularité</option>
                                        <option value="rating">Note</option>
                                        <option value="time">Temps</option>
                                        <option value="recent">Plus récentes</option>
                                        <option value="name">Nom (A-Z)</option>
                                    </select>
                                </div>
                            </div>

                            <button className="btn-reset-filters" onClick={resetAdvancedFilters}>
                                <X className="icon-sm" />
                                Réinitialiser
                            </button>
                        </div>
                    )}

                    {/* Filter Tags */}
                    <div className="filter-tags">
                        <button
                            className={`filter-tag ${selectedFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setSelectedFilter('all')}
                        >
                            Toutes
                        </button>
                        {categories.slice(0, 6).map((cat) => (
                            <button
                                key={cat}
                                className={`filter-tag ${selectedFilter === cat.toLowerCase() ? 'active' : ''}`}
                                onClick={() => setSelectedFilter(cat.toLowerCase())}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Count */}
                <div className="results-count">
                    <p>
                        {sortedRecipes.length} recette{sortedRecipes.length > 1 ? 's' : ''} trouvée{sortedRecipes.length > 1 ? 's' : ''}
                        {totalPages > 1 && ` • Page ${currentPage} sur ${totalPages}`}
                    </p>
                </div>

                {/* Recipe Grid */}
                {paginatedRecipes.length > 0 ? (
                    <>
                        <div className="recipes-grid">
                            {paginatedRecipes.map((recipe) => (
                                <div key={recipe.id} className="recipe-card">
                                    <div className="recipe-image-wrapper">
                                        <img
                                            src={recipe.image || RECIPE_PLACEHOLDER_URL}
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
                                            {isAdmin && recipe.statut === 'EN_ATTENTE' && (
                                                <span className="status-badge status-pending">
                                                    EN ATTENTE
                                                </span>
                                            )}
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
                                                <span className="rating-value">
                                                    {recipe.rating > 0 ? recipe.rating.toFixed(1) : '-'}
                                                </span>
                                                <span className="rating-count">
                                                    {recipe.reviews > 0 ? `(${recipe.reviews})` : '(Aucun avis)'}
                                                </span>
                                            </div>
                                            {recipe.calories > 0 && (
                                                <div className="recipe-calories">
                                                    <Flame className="icon-sm" />
                                                    <span>{recipe.calories} cal</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="recipe-tags">
                                            {recipe.tags.slice(0, 3).map((tag, index) => (
                                                <span key={index} className="tag">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <Link to={`/recette/${recipe.id}`} className="btn btn-primary btn-full">
                                            <Utensils className="icon-sm" />
                                            Voir la recette
                                            <ArrowRight className="icon-sm" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="pagination-btn"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft size={20} />
                                    Précédent
                                </button>

                                <div className="pagination-numbers">
                                    {[...Array(totalPages)].map((_, index) => {
                                        const pageNum = index + 1;
                                        // Afficher seulement quelques pages autour de la page actuelle
                                        if (
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (
                                            pageNum === currentPage - 2 ||
                                            pageNum === currentPage + 2
                                        ) {
                                            return <span key={pageNum} className="pagination-ellipsis">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    className="pagination-btn"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Suivant
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="empty-state">
                        <ChefHat className="empty-icon" />
                        <h3 className="empty-title">Aucune recette trouvée</h3>
                        <p className="empty-description">
                            Essayez de modifier vos critères de recherche ou vos filtres.
                        </p>
                        <button className="btn btn-outline" onClick={() => {
                            setSearchTerm('');
                            setSelectedFilter('all');
                            resetAdvancedFilters();
                        }}>
                            <X className="icon-sm" />
                            Réinitialiser tous les filtres
                        </button>
                    </div>
                )}

                {/* CTA Section - Design moderne */}
                <div className="cta-section-modern">
                    <div className="cta-decoration-circles">
                        <div className="cta-circle cta-circle-1"></div>
                        <div className="cta-circle cta-circle-2"></div>
                        <div className="cta-circle cta-circle-3"></div>
                    </div>
                    
                    <div className="cta-content">
                        <div className="cta-icon-badge">
                            <Sparkles className="icon-sparkles" />
                        </div>
                        
                        <h2 className="cta-title-modern">Pas encore trouvé votre bonheur ?</h2>
                        <p className="cta-description-modern">
                            Ajoutez plus d'ingrédients pour obtenir des suggestions encore plus personnalisées,
                            ou explorez notre planificateur de repas hebdomadaire.
                        </p>
                        
                        <div className="cta-buttons-modern">
                            <Link to="/ingredients" className="cta-btn cta-btn-primary">
                                <ChefHat className="icon-sm" />
                                <span>Ajouter des ingrédients</span>
                                <ArrowRight className="icon-sm cta-arrow" />
                            </Link>
                            <Link to="/planificateur" className="cta-btn cta-btn-secondary">
                                <Calendar className="icon-sm" />
                                <span>Planifier mes repas</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}