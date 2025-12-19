import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Clock, Star, Users, ChefHat, Heart, Search, Filter,
    Sparkles, ArrowRight, Utensils, Flame
} from 'lucide-react';
import './SuggestionsPage.css';

const SAMPLE_RECIPES = [
    {
        id: 1,
        title: "Risotto crémeux aux champignons",
        description: "Un risotto onctueux préparé avec des champignons de saison et du parmesan",
        image: "/risotto-champignons-plat-cuisine.jpg",
        cookTime: "25 min",
        difficulty: "Moyen",
        rating: 4.8,
        reviews: 124,
        ingredients: ["Riz arborio", "Champignons", "Parmesan", "Bouillon", "Vin blanc"],
        tags: ["Végétarien", "Crémeux", "Italien"],
        calories: 380,
        servings: 4,
    },
    {
        id: 2,
        title: "Salade de quinoa arc-en-ciel",
        description: "Une salade colorée et nutritive avec quinoa, légumes frais et vinaigrette citronnée",
        image: "/salade-quinoa-coloree-healthy.jpg",
        cookTime: "15 min",
        difficulty: "Facile",
        rating: 4.6,
        reviews: 89,
        ingredients: ["Quinoa", "Tomates cerises", "Concombre", "Avocat", "Feta"],
        tags: ["Healthy", "Végétarien", "Sans gluten"],
        calories: 320,
        servings: 2,
    },
    {
        id: 3,
        title: "Curry de légumes épicé",
        description: "Un curry parfumé aux épices indiennes avec légumes de saison et lait de coco",
        image: "/curry-legumes-epice-indien.jpg",
        cookTime: "30 min",
        difficulty: "Moyen",
        rating: 4.9,
        reviews: 156,
        ingredients: ["Courgettes", "Poivrons", "Lait de coco", "Épices curry", "Gingembre"],
        tags: ["Vegan", "Épicé", "Indien"],
        calories: 280,
        servings: 4,
    },
    {
        id: 4,
        title: "Saumon grillé aux herbes",
        description: "Filet de saumon grillé avec un mélange d'herbes fraîches et légumes vapeur",
        image: "/saumon-grill--herbes-fra-ches.jpg",
        cookTime: "20 min",
        difficulty: "Facile",
        rating: 4.7,
        reviews: 98,
        ingredients: ["Saumon", "Herbes fraîches", "Citron", "Brocolis", "Huile d'olive"],
        tags: ["Protéiné", "Healthy", "Poisson"],
        calories: 420,
        servings: 2,
    },
    {
        id: 5,
        title: "Pâtes carbonara authentique",
        description: "La vraie recette italienne avec œufs, pecorino, guanciale et poivre noir",
        image: "/p-tes-carbonara-authentique-italienne.jpg",
        cookTime: "18 min",
        difficulty: "Moyen",
        rating: 4.5,
        reviews: 203,
        ingredients: ["Pâtes", "Œufs", "Pecorino", "Guanciale", "Poivre noir"],
        tags: ["Italien", "Traditionnel", "Crémeux"],
        calories: 520,
        servings: 4,
    },
    {
        id: 6,
        title: "Bowl Buddha végétarien",
        description: "Un bol complet avec légumes rôtis, avocat, graines et sauce tahini",
        image: "/buddha-bowl-v-g-tarien-color-.jpg",
        cookTime: "35 min",
        difficulty: "Facile",
        rating: 4.4,
        reviews: 67,
        ingredients: ["Patate douce", "Avocat", "Quinoa", "Graines", "Tahini"],
        tags: ["Vegan", "Healthy", "Complet"],
        calories: 450,
        servings: 2,
    },
];

const DIFFICULTY_COLORS = {
    Facile: "difficulty-easy",
    Moyen: "difficulty-medium",
    Difficile: "difficulty-hard",
};

export default function SuggestionsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [favorites, setFavorites] = useState([]);

    const toggleFavorite = (recipeId) => {
        setFavorites((prev) =>
            prev.includes(recipeId)
                ? prev.filter((id) => id !== recipeId)
                : [...prev, recipeId]
        );
    };

    const filteredRecipes = SAMPLE_RECIPES.filter((recipe) => {
        const matchesSearch =
            recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            recipe.ingredients.some((ing) => ing.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesFilter =
            selectedFilter === "all" ||
            recipe.tags.some((tag) => tag.toLowerCase().includes(selectedFilter.toLowerCase()));

        return matchesSearch && matchesFilter;
    });

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
                        </div>
                        <button className="btn btn-outline">
                            <Filter className="icon-sm" />
                            Filtres avancés
                        </button>
                    </div>

                    {/* Filter Tags */}
                    <div className="filter-tags">
                        <button
                            className={`filter-tag ${selectedFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setSelectedFilter('all')}
                        >
                            Toutes les recettes
                        </button>
                        {["Végétarien", "Vegan", "Healthy", "Rapide", "Italien", "Épicé"].map((filter) => (
                            <button
                                key={filter}
                                className={`filter-tag ${selectedFilter === filter.toLowerCase() ? 'active' : ''}`}
                                onClick={() => setSelectedFilter(filter.toLowerCase())}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Count */}
                <div className="results-count">
                    <p>
                        {filteredRecipes.length} recette{filteredRecipes.length > 1 ? 's' : ''} trouvée
                        {filteredRecipes.length > 1 ? 's' : ''}
                    </p>
                </div>

                {/* Recipe Grid */}
                {filteredRecipes.length > 0 ? (
                    <div className="recipes-grid">
                        {filteredRecipes.map((recipe) => (
                            <div key={recipe.id} className="recipe-card">
                                <div className="recipe-image-wrapper">
                                    <img
                                        src={recipe.image}
                                        alt={recipe.title}
                                        className="recipe-image"
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/400x300?text=Recipe';
                                        }}
                                    />

                                    {/* Badges en haut */}
                                    <div className="recipe-badges">
                    <span className={`difficulty-badge ${DIFFICULTY_COLORS[recipe.difficulty]}`}>
                      {recipe.difficulty}
                    </span>
                                        <button
                                            className="btn-favorite"
                                            onClick={() => toggleFavorite(recipe.id)}
                                        >
                                            <Heart className={`icon-sm ${favorites.includes(recipe.id) ? 'favorite-active' : ''}`} />
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
                                        <p className="recipe-description">{recipe.description}</p>
                                    </div>

                                    <div className="recipe-meta">
                                        <div className="recipe-rating">
                                            <Star className="star-icon star-filled" />
                                            <span className="rating-value">{recipe.rating}</span>
                                            <span className="rating-count">({recipe.reviews})</span>
                                        </div>
                                        <div className="recipe-calories">
                                            <Flame className="icon-sm" />
                                            <span>{recipe.calories} cal</span>
                                        </div>
                                    </div>

                                    <div className="recipe-tags">
                                        {recipe.tags.slice(0, 3).map((tag) => (
                                            <span key={tag} className="tag">
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
                ) : (
                    <div className="empty-state">
                        <ChefHat className="empty-icon" />
                        <h3 className="empty-title">Aucune recette trouvée</h3>
                        <p className="empty-description">
                            Essayez de modifier vos critères de recherche ou vos filtres.
                        </p>
                        <Link to="/ingredients" className="btn btn-outline">
                            <ArrowRight className="icon-sm" />
                            Modifier mes ingrédients
                        </Link>
                    </div>
                )}

                {/* CTA Section */}
                <div className="cta-section">
                    <h2 className="cta-title">Pas encore trouvé votre bonheur ?</h2>
                    <p className="cta-description">
                        Ajoutez plus d'ingrédients pour obtenir des suggestions encore plus personnalisées,
                        ou explorez notre planificateur de repas.
                    </p>
                    <div className="cta-buttons">
                        <Link to="/ingredients" className="btn btn-primary">
                            <ChefHat className="icon-sm" />
                            Ajouter des ingrédients
                        </Link>
                        <Link to="/planificateur" className="btn btn-outline">
                            Planifier mes repas
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}