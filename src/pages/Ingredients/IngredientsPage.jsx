import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, X, ChefHat, Sparkles, ArrowRight } from 'lucide-react';
import './IngredientsPage.css';

const POPULAR_INGREDIENTS = [
    "Tomates", "Oignons", "Ail", "Poulet", "Bœuf", "Porc", "Saumon", "Thon",
    "Pâtes", "Riz", "Pommes de terre", "Carottes", "Courgettes", "Poivrons",
    "Champignons", "Épinards", "Brocolis", "Fromage", "Œufs", "Lait",
    "Huile d'olive", "Beurre", "Crème", "Basilic", "Persil", "Thym",
];

const CATEGORIES = [
    {
        name: "Légumes",
        items: ["Tomates", "Oignons", "Carottes", "Courgettes", "Poivrons", "Champignons", "Épinards", "Brocolis"],
    },
    { name: "Viandes", items: ["Poulet", "Bœuf", "Porc", "Agneau", "Canard"] },
    { name: "Poissons", items: ["Saumon", "Thon", "Cabillaud", "Sole", "Crevettes"] },
    { name: "Féculents", items: ["Pâtes", "Riz", "Pommes de terre", "Quinoa", "Lentilles"] },
    { name: "Produits laitiers", items: ["Fromage", "Œufs", "Lait", "Yaourt", "Crème"] },
    { name: "Herbes & Épices", items: ["Basilic", "Persil", "Thym", "Romarin", "Paprika"] },
];

export default function IngredientsPage() {
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [customIngredient, setCustomIngredient] = useState("");

    const addIngredient = (ingredient) => {
        if (!selectedIngredients.includes(ingredient)) {
            setSelectedIngredients([...selectedIngredients, ingredient]);
        }
    };

    const removeIngredient = (ingredient) => {
        setSelectedIngredients(selectedIngredients.filter((item) => item !== ingredient));
    };

    const addCustomIngredient = () => {
        if (customIngredient.trim() && !selectedIngredients.includes(customIngredient.trim())) {
            setSelectedIngredients([...selectedIngredients, customIngredient.trim()]);
            setCustomIngredient("");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            addCustomIngredient();
        }
    };

    const clearAll = () => {
        setSelectedIngredients([]);
    };

    const filteredIngredients = POPULAR_INGREDIENTS.filter((ingredient) =>
        ingredient.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="ingredients-page">
            <div className="ingredients-container">
                {/* Header */}
                <div className="ingredients-header">
                    <div className="step-badge">
                        <ChefHat className="icon-sm" />
                        <span>Étape 1 sur 3</span>
                    </div>

                    <h1 className="ingredients-title">Quels ingrédients avez-vous ?</h1>
                    <p className="ingredients-subtitle">
                        Sélectionnez ou ajoutez les ingrédients disponibles dans votre cuisine. Plus vous en ajoutez, plus nos
                        suggestions seront précises !
                    </p>
                </div>

                <div className="ingredients-layout">
                    {/* Left Column - Ingredient Selection */}
                    <div className="ingredients-main">
                        {/* Search Bar */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">
                                    <Search className="icon-sm text-primary" />
                                    Rechercher un ingrédient
                                </h3>
                            </div>
                            <div className="card-content">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder="Tapez le nom d'un ingrédient..."
                                        value={customIngredient}
                                        onChange={(e) => setCustomIngredient(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        className="input-custom"
                                    />
                                    <button
                                        onClick={addCustomIngredient}
                                        disabled={!customIngredient.trim()}
                                        className="btn btn-primary btn-icon"
                                    >
                                        <Plus className="icon-sm" />
                                    </button>
                                </div>

                                <div className="search-wrapper">
                                    <Search className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Filtrer les ingrédients populaires..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="search-input"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Search Results */}
                        {searchTerm && (
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Résultats de recherche</h3>
                                </div>
                                <div className="card-content">
                                    <div className="ingredients-badges">
                                        {filteredIngredients.map((ingredient) => (
                                            <button
                                                key={ingredient}
                                                className={`ingredient-badge ${selectedIngredients.includes(ingredient) ? 'selected' : ''}`}
                                                onClick={() => addIngredient(ingredient)}
                                            >
                                                {ingredient}
                                                {selectedIngredients.includes(ingredient) && <span className="check-mark">✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Categories */}
                        {!searchTerm && (
                            <div className="categories-list">
                                {CATEGORIES.map((category) => (
                                    <div key={category.name} className="card">
                                        <div className="card-header">
                                            <h3 className="card-title">{category.name}</h3>
                                        </div>
                                        <div className="card-content">
                                            <div className="ingredients-badges">
                                                {category.items.map((ingredient) => (
                                                    <button
                                                        key={ingredient}
                                                        className={`ingredient-badge ${selectedIngredients.includes(ingredient) ? 'selected' : ''}`}
                                                        onClick={() => addIngredient(ingredient)}
                                                    >
                                                        {ingredient}
                                                        {selectedIngredients.includes(ingredient) && <span className="check-mark">✓</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column - Selected Ingredients */}
                    <div className="ingredients-sidebar">
                        <div className="card sticky-card">
                            <div className="card-header">
                                <h3 className="card-title">
                                    <span>Mes ingrédients</span>
                                    <span className="badge badge-secondary">{selectedIngredients.length}</span>
                                </h3>
                            </div>
                            <div className="card-content">
                                {selectedIngredients.length === 0 ? (
                                    <div className="empty-state">
                                        <ChefHat className="empty-icon" />
                                        <p className="empty-text">Aucun ingrédient sélectionné</p>
                                        <p className="empty-hint">Cliquez sur les ingrédients ci-contre pour les ajouter</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="selected-list">
                                            {selectedIngredients.map((ingredient) => (
                                                <div key={ingredient} className="selected-item">
                                                    <span className="selected-name">{ingredient}</span>
                                                    <button
                                                        onClick={() => removeIngredient(ingredient)}
                                                        className="btn-remove"
                                                    >
                                                        <X className="icon-xs" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="selected-actions">
                                            <Link
                                                to="/suggestions"
                                                className={`btn btn-primary btn-full btn-lg ${selectedIngredients.length === 0 ? 'disabled' : ''}`}
                                            >
                                                <Sparkles className="icon-sm" />
                                                Générer des recettes
                                                <ArrowRight className="icon-sm" />
                                            </Link>

                                            <button
                                                onClick={clearAll}
                                                disabled={selectedIngredients.length === 0}
                                                className="btn btn-outline btn-full"
                                            >
                                                Tout effacer
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Tips Card */}
                        <div className="card tips-card">
                            <div className="card-header">
                                <h3 className="card-title">
                                    <Sparkles className="icon-sm text-accent" />
                                    Conseil de chef
                                </h3>
                            </div>
                            <div className="card-content">
                                <p className="tips-text">
                                    N'hésitez pas à ajouter vos condiments, épices et herbes ! Ils peuvent transformer une recette simple
                                    en plat extraordinaire.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}