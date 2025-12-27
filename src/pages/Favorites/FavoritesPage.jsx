import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star, Users, Heart, Search, Filter, Trash2, ChefHat } from 'lucide-react';
import { RECIPE_PLACEHOLDER_URL } from '../../utils/RecipePlaceholder';
import './FavoritesPage.css';

const FAVORITE_RECIPES = [
    {
        id: 1,
        title: "Risotto crémeux aux champignons",
        image: "/risotto-champignons-plat-cuisine.jpg",
        cookTime: "25 min",
        rating: 4.8,
        servings: 4,
        tags: ["Végétarien", "Italien"],
        addedDate: "Il y a 2 jours",
    },
    {
        id: 2,
        title: "Salade de quinoa colorée",
        image: "/salade-quinoa-coloree-healthy.jpg",
        cookTime: "15 min",
        rating: 4.6,
        servings: 2,
        tags: ["Healthy", "Vegan"],
        addedDate: "Il y a 3 jours",
    },
    {
        id: 4,
        title: "Saumon grillé aux herbes",
        image: "/saumon-grill--herbes-fra-ches.jpg",
        cookTime: "20 min",
        rating: 4.7,
        servings: 2,
        tags: ["Protéiné", "Healthy"],
        addedDate: "Il y a 1 semaine",
    },
];

export default function FavoritesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [favorites, setFavorites] = useState(FAVORITE_RECIPES);

    const removeFavorite = (recipeId) => {
        setFavorites(favorites.filter((recipe) => recipe.id !== recipeId));
    };

    const filteredFavorites = favorites.filter(
        (recipe) =>
            recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            recipe.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="favorites-page">
            <div className="favorites-container">
                {/* Header */}
                <div className="favorites-header">
                    <div className="favorites-badge">
                        <Heart className="icon-sm" />
                        <span>Mes favoris</span>
                    </div>

                    <h1 className="favorites-title">Mes recettes favorites</h1>
                    <p className="favorites-subtitle">
                        Retrouvez toutes vos recettes préférées sauvegardées pour plus tard.
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="favorites-controls">
                    <div className="search-filter-group">
                        <div className="search-wrapper">
                            <Search className="search-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher dans mes favoris..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <button className="btn btn-outline">
                            <Filter className="icon-sm" />
                            Filtrer
                        </button>
                    </div>
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

                                    {/* Bouton supprimer */}
                                    <div className="recipe-actions">
                                        <button
                                            className="btn-icon btn-delete"
                                            onClick={() => removeFavorite(recipe.id)}
                                            title="Retirer des favoris"
                                        >
                                            <Trash2 className="icon-sm" />
                                        </button>
                                    </div>

                                    {/* Infos sur l'image */}
                                    <div className="recipe-image-info">
                                        <div className="info-badge">
                                            <Clock className="icon-xs" />
                                            <span>{recipe.cookTime}</span>
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
                                        <p className="recipe-added-date">Ajouté {recipe.addedDate}</p>
                                    </div>

                                    <div className="recipe-rating">
                                        <Star className="icon-sm star-filled" />
                                        <span className="rating-value">{recipe.rating}</span>
                                    </div>

                                    <div className="recipe-tags">
                                        {recipe.tags.map((tag) => (
                                            <span key={tag} className="tag">
                        {tag}
                      </span>
                                        ))}
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
                                ? "Essayez de modifier votre recherche."
                                : "Commencez à ajouter des recettes à vos favoris pour les retrouver ici."}
                        </p>
                        <Link to="/suggestions" className="btn btn-outline">
                            <ChefHat className="icon-sm" />
                            Découvrir des recettes
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}