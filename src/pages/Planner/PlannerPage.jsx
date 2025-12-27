import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus, ShoppingCart, Clock, Users, ChefHat, Trash2 } from 'lucide-react';
import { RECIPE_PLACEHOLDER_URL } from '../../utils/RecipePlaceholder';
import './PlannerPage.css';

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MEALS = ["Petit-déjeuner", "Déjeuner", "Dîner"];

// Démarre sans recettes par défaut
const PLANNED_MEALS = {
    Lundi: {},
    Mardi: {},
    Mercredi: {},
    Jeudi: {},
    Vendredi: {},
    Samedi: {},
    Dimanche: {},
};

export default function PlannerPage() {
    const [plannedMeals, setPlannedMeals] = useState(PLANNED_MEALS);
    const selectedWeek = "Cette semaine";

    const removeMeal = (day, meal) => {
        setPlannedMeals((prev) => ({
            ...prev,
            [day]: {
                ...prev[day],
                [meal]: undefined,
            },
        }));
    };

    const generateShoppingList = () => {
        // Logique pour générer la liste de courses
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
                        <span>Planificateur de repas</span>
                    </div>

                    <h1 className="planner-title">Planifiez vos repas de la semaine</h1>
                    <p className="planner-subtitle">
                        Organisez vos repas à l'avance et générez automatiquement votre liste de courses.
                    </p>
                </div>

                {/* Week Selector and Stats */}
                <div className="planner-controls">
                    <div className="controls-left">
                        <button className="btn btn-outline">
                            <Calendar className="icon-sm" />
                            {selectedWeek}
                        </button>
                        <span className="badge badge-secondary">
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
                            Ajouter des recettes
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
                                                            <img
                                                                src={plannedMeal.image || RECIPE_PLACEHOLDER_URL}
                                                                alt={plannedMeal.title}
                                                                onError={(e) => {
                                                                    e.target.src = RECIPE_PLACEHOLDER_URL;
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="meal-info">
                                                            <h5 className="meal-title">{plannedMeal.title}</h5>
                                                            <div className="meal-meta">
                                                                <div className="meta-item">
                                                                    <Clock className="icon-xs" />
                                                                    <span>{plannedMeal.cookTime}</span>
                                                                </div>
                                                                <div className="meta-item">
                                                                    <Users className="icon-xs" />
                                                                    <span>{plannedMeal.servings}</span>
                                                                </div>
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
                                                        <button className="btn-add-meal">
                                                            <Plus className="icon-md" />
                                                            <span className="add-text">Ajouter un repas</span>
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
                            Commencez à planifier vos repas pour la semaine en ajoutant des recettes.
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
                        <h3 className="tips-title">
                            <ChefHat className="icon-sm text-accent" />
                            Conseils pour bien planifier
                        </h3>
                    </div>
                    <div className="tips-content">
                        <ul className="tips-list">
                            <li>• Planifiez vos repas en fonction de votre emploi du temps</li>
                            <li>• Variez les types de cuisine pour éviter la monotonie</li>
                            <li>• Préparez certains ingrédients à l'avance le weekend</li>
                            <li>• Utilisez la liste de courses générée pour optimiser vos achats</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}