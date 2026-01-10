import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Clock, Star, Users, Heart, Search, Trash2, ChefHat,
    SlidersHorizontal, X, Flame
} from 'lucide-react';
import { RECIPE_PLACEHOLDER_URL } from '../../utils/RecipePlaceholder';
import './FavoritesPage.css';

const FAVORITE_RECIPES = [
    {
        id: 1,
        title: "Risotto crémeux aux champignons",
        image: "/risotto-champignons-plat-cuisine.jpg",
        cookTime: 25,
        cookTimeDisplay: "25 min",
        rating: 4.8,
        reviews: 12,
        servings: 4,
        tags: ["Végétarien", "Italien"],
        addedDate: "Il y a 2 jours",
        difficulty: "MOYEN",
        calories: 450,
    },
    {
        id: 2,
        title: "Salade de quinoa colorée",
        image: "/salade-quinoa-coloree-healthy.jpg",
        cookTime: 15,
        cookTimeDisplay: "15 min",
        rating: 4.6,
        reviews: 8,
        servings: 2,
        tags: ["Healthy", "Vegan"],
        addedDate: "Il y a 3 jours",
        difficulty: "FACILE",
        calories: 320,
    },
    {
        id: 4,
        title: "Saumon grillé aux herbes",
        image: "/saumon-grill--herbes-fra-ches.jpg",
        cookTime: 20,
        cookTimeDisplay: "20 min",
        rating: 4.7,
        reviews: 15,
        servings: 2,
        tags: ["Protéiné", "Healthy"],
        addedDate: "Il y a 1 semaine",
        difficulty: "FACILE",
        calories: 380,
    },
];

export default function FavoritesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [favorites, setFavorites] = useState(FAVORITE_RECIPES);
    const [loading] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Filtres avancés
    const [advancedFilters, setAdvancedFilters] = useState({
        difficulty: '',
        maxTime: 120,
        minRating: 0,
        maxCalories: 1000,
    });

    const removeFavorite = (recipeId) => {
        setFavorites(favorites.filter((recipe) => recipe.id !== recipeId));
    };

    // Réinitialiser les filtres avancés
    const resetAdvancedFilters = () => {
        setAdvancedFilters({
            difficulty: '',
            maxTime: 120,
            minRating: 0,
            maxCalories: 1000,
        });
    };

    // Appliquer tous les filtres
    const filteredFavorites = favorites.filter((recipe) => {
        const matchesSearch =
            recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            recipe.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesDifficulty =
            !advancedFilters.difficulty ||
            recipe.difficulty === advancedFilters.difficulty;

        const matchesMaxTime = recipe.cookTime <= advancedFilters.maxTime;
        const matchesMinRating = recipe.rating >= advancedFilters.minRating;
        const matchesMaxCalories = recipe.calories <= advancedFilters.maxCalories;

        return matchesSearch && matchesDifficulty && matchesMaxTime &&
            matchesMinRating && matchesMaxCalories;
    });

    return (
        <div className="favorites-page">
            <div className="favorites-container">
                {/* Header */}
                <div className="favorites-header">
                    <div className="favorites-badge">
                        <Heart className="icon-sm" />
                        <span>Mes favoris</span>
                    </div>

                    <h1 className="favorites-title">Vos recettes <span className="title-accent">favorites</span></h1>
                    <p className="favorites-subtitle">
                        Retrouvez toutes vos recettes préférées sauvegardées
                    </p>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Chargement de vos favoris...</p>
                    </div>
                ) : (
                    <>
                        {/* Search and Filters */}
                        <div className="filters-section">
                            <div className="search-filter-row">
                                <div className="search-wrapper">
                                    <Search className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher dans mes favoris..."
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
                                    Filtres
                                </button>
                            </div>

                            {/* Advanced Filters Panel */}
                            {showAdvancedFilters && (
                                <div className="advanced-filters-panel">
                                    <div className="filters-grid">
                                        {/* Difficulté */}
                                        <div className="filter-group filter-group-full">
                                            <label className="filter-label">
                                                <ChefHat className="filter-icon" />
                                                Difficulté
                                            </label>
                                            <div className="difficulty-options">
                                                <button
                                                    className={`difficulty-btn difficulty-easy ${advancedFilters.difficulty === 'FACILE' ? 'active' : ''}`}
                                                    onClick={() => setAdvancedFilters({...advancedFilters, difficulty: 'FACILE'})}
                                                >
                                                    Facile
                                                </button>
                                                <button
                                                    className={`difficulty-btn difficulty-medium ${advancedFilters.difficulty === 'MOYEN' ? 'active' : ''}`}
                                                    onClick={() => setAdvancedFilters({...advancedFilters, difficulty: 'MOYEN'})}
                                                >
                                                    Moyen
                                                </button>
                                                <button
                                                    className={`difficulty-btn difficulty-hard ${advancedFilters.difficulty === 'DIFFICILE' ? 'active' : ''}`}
                                                    onClick={() => setAdvancedFilters({...advancedFilters, difficulty: 'DIFFICILE'})}
                                                >
                                                    Difficile
                                                </button>
                                                <button
                                                    className={`difficulty-btn-reset ${!advancedFilters.difficulty ? 'active' : ''}`}
                                                    onClick={() => setAdvancedFilters({...advancedFilters, difficulty: ''})}
                                                    title="Réinitialiser le filtre"
                                                >
                                                    <X className="icon-xs" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Temps maximum */}
                                        <div className="filter-group">
                                            <label className="filter-label">
                                                <Clock className="filter-icon" />
                                                Temps maximum
                                            </label>
                                            <div className="slider-container">
                                                <input
                                                    type="range"
                                                    min="15"
                                                    max="180"
                                                    step="15"
                                                    value={advancedFilters.maxTime}
                                                    onChange={(e) => setAdvancedFilters({...advancedFilters, maxTime: parseInt(e.target.value)})}
                                                    className="slider"
                                                    style={{
                                                        background: `linear-gradient(to right, var(--basilic) 0%, var(--basilic) ${((advancedFilters.maxTime - 15) / (180 - 15)) * 100}%, #E8EAED ${((advancedFilters.maxTime - 15) / (180 - 15)) * 100}%, #E8EAED 100%)`
                                                    }}
                                                />
                                                <div className="slider-value">
                                                    {advancedFilters.maxTime} min
                                                </div>
                                            </div>
                                        </div>

                                        {/* Note minimale */}
                                        <div className="filter-group">
                                            <label className="filter-label">
                                                <Star className="filter-icon" />
                                                Note minimale
                                            </label>
                                            <div className="stars-filter">
                                                {[1, 2, 3, 4, 5].map((rating) => (
                                                    <button
                                                        key={rating}
                                                        className={`star-btn ${advancedFilters.minRating >= rating ? 'active' : ''}`}
                                                        onClick={() => setAdvancedFilters({...advancedFilters, minRating: rating})}
                                                        title={`${rating}+ étoiles`}
                                                    >
                                                        <Star className="star-icon" size={20} />
                                                    </button>
                                                ))}
                                                <button
                                                    className={`star-btn-reset ${advancedFilters.minRating === 0 ? 'active' : ''}`}
                                                    onClick={() => setAdvancedFilters({...advancedFilters, minRating: 0})}
                                                    title="Réinitialiser le filtre"
                                                >
                                                    <X className="icon-xs" />
                                                </button>
                                            </div>
                                            <div className="slider-value">
                                                {advancedFilters.minRating > 0 ? `${advancedFilters.minRating}+ ⭐` : 'Toutes les notes'}
                                            </div>
                                        </div>

                                        {/* Calories maximum */}
                                        <div className="filter-group">
                                            <label className="filter-label">
                                                <Flame className="filter-icon" />
                                                Calories maximum
                                            </label>
                                            <div className="slider-container">
                                                <input
                                                    type="range"
                                                    min="200"
                                                    max="1500"
                                                    step="50"
                                                    value={advancedFilters.maxCalories}
                                                    onChange={(e) => setAdvancedFilters({...advancedFilters, maxCalories: parseInt(e.target.value)})}
                                                    className="slider slider-calories"
                                                    style={{
                                                        background: `linear-gradient(to right, var(--carotte) 0%, var(--carotte) ${((advancedFilters.maxCalories - 200) / (1500 - 200)) * 100}%, #E8EAED ${((advancedFilters.maxCalories - 200) / (1500 - 200)) * 100}%, #E8EAED 100%)`
                                                    }}
                                                />
                                                <div className="slider-value">
                                                    {advancedFilters.maxCalories} kcal
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reset button */}
                                    <div className="filter-cta">
                                        <button
                                            onClick={resetAdvancedFilters}
                                            className="btn-reset-filters"
                                        >
                                            <X className="icon-xs" />
                                            Réinitialiser les filtres
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Results Count */}
                        <div className="results-count">
                            <p>
                                {filteredFavorites.length} recette{filteredFavorites.length > 1 ? "s" : ""} favorite
                                {filteredFavorites.length > 1 ? "s" : ""}
                            </p>
                        </div>

                        {/* Favorites Grid */}
                        {filteredFavorites.length > 0 ? (
                            <div className="favorites-grid">
                                {filteredFavorites.map((recipe) => (
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

                                            {/* Badges */}
                                            <div className="recipe-badges">
                                                <span className={`difficulty-badge difficulty-${recipe.difficulty.toLowerCase()}`}>
                                                    {recipe.difficulty === 'FACILE' ? 'Facile' : recipe.difficulty === 'MOYEN' ? 'Moyen' : 'Difficile'}
                                                </span>
                                                <button
                                                    className="btn-favorite"
                                                    onClick={() => removeFavorite(recipe.id)}
                                                    title="Retirer des favoris"
                                                >
                                                    <Trash2 className="icon-xs" />
                                                </button>
                                            </div>

                                            {/* Infos sur l'image */}
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
                                            </div>

                                            <div className="recipe-meta">
                                                <div className="recipe-rating">
                                                    <Star className="star-icon star-filled" />
                                                    <span className="rating-value">{recipe.rating}</span>
                                                    <span className="rating-count">({recipe.reviews})</span>
                                                </div>
                                                <div className="recipe-calories">
                                                    <Flame className="icon-xs" />
                                                    <span>{recipe.calories} kcal</span>
                                                </div>
                                            </div>

                                            <Link to={`/recette/${recipe.id}`} className="btn btn-primary btn-full">
                                                Voir la recette
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <Heart className="empty-icon" />
                                <h3 className="empty-title">
                                    {searchTerm ? "Aucun favori trouvé" : "Aucune recette favorite"}
                                </h3>
                                <p className="empty-description">
                                    {searchTerm
                                        ? "Essayez de modifier votre recherche ou vos filtres."
                                        : "Commencez à ajouter des recettes à vos favoris pour les retrouver ici."}
                                </p>
                                <Link to="/suggestions" className="btn btn-primary">
                                    <ChefHat className="icon-sm" />
                                    Découvrir des recettes
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}