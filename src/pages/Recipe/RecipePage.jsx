import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
    Clock, Users, Star, Heart, Share2, ChefHat, Flame,
    CheckCircle2, ArrowLeft, Lightbulb, AlertCircle, Timer, Scale
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import recipesService from '../../services/api/recipe.service';
import './RecipePage.css';

// Données de fallback (au cas où l'API ne répond pas)
const FALLBACK_RECIPE = {
    1: {
        id: 1,
        title: "Risotto crémeux aux champignons",
        description: "Un risotto onctueux préparé avec des champignons de saison et du parmesan. Cette recette traditionnelle italienne vous garantit un plat réconfortant et savoureux.",
        image: "/risotto-champignons-plat-cuisine.jpg",
        cookTime: "25 min",
        prepTime: "10 min",
        difficulty: "Moyen",
        rating: 4.8,
        reviews: 124,
        servings: 4,
        calories: 380,
        tags: ["Végétarien", "Crémeux", "Italien"],
        ingredients: [
            { name: "Riz arborio", quantity: "300g", essential: true },
            { name: "Champignons de Paris", quantity: "400g", essential: true },
            { name: "Parmesan râpé", quantity: "100g", essential: true },
            { name: "Bouillon de légumes", quantity: "1L", essential: true },
            { name: "Vin blanc sec", quantity: "150ml", essential: false },
            { name: "Oignon", quantity: "1 pièce", essential: true },
            { name: "Ail", quantity: "2 gousses", essential: true },
            { name: "Beurre", quantity: "50g", essential: true },
            { name: "Huile d'olive", quantity: "2 cuillères à soupe", essential: true },
            { name: "Persil frais", quantity: "1 bouquet", essential: false },
        ],
        steps: [
            {
                step: 1,
                title: "Préparation des ingrédients",
                instruction: "Émincez finement l'oignon et l'ail. Nettoyez et coupez les champignons en lamelles. Faites chauffer le bouillon dans une casserole.",
                duration: "5 min",
                tips: "Gardez le bouillon chaud pendant toute la cuisson pour un risotto parfait.",
            },
            {
                step: 2,
                title: "Cuisson des champignons",
                instruction: "Dans une grande poêle, faites revenir les champignons avec un peu d'huile d'olive jusqu'à ce qu'ils soient dorés. Réservez.",
                duration: "5 min",
                tips: "Ne salez pas les champignons pendant la cuisson pour éviter qu'ils rendent trop d'eau.",
            },
            {
                step: 3,
                title: "Préparation du risotto",
                instruction: "Dans la même poêle, faites revenir l'oignon et l'ail dans le beurre. Ajoutez le riz et nacrez-le pendant 2 minutes.",
                duration: "3 min",
                tips: "Le riz doit devenir translucide sur les bords, c'est le signe qu'il est bien nacré.",
            },
            {
                step: 4,
                title: "Déglacage",
                instruction: "Versez le vin blanc et laissez-le s'évaporer en remuant constamment.",
                duration: "2 min",
                tips: "Cette étape peut être omise si vous n'avez pas de vin blanc.",
            },
            {
                step: 5,
                title: "Cuisson du risotto",
                instruction: "Ajoutez le bouillon chaud louche par louche, en remuant constamment. Attendez que le liquide soit absorbé avant d'ajouter la louche suivante.",
                duration: "15 min",
                tips: "La patience est la clé d'un bon risotto. Ne versez jamais tout le bouillon d'un coup.",
            },
            {
                step: 6,
                title: "Finition",
                instruction: "Incorporez les champignons réservés et le parmesan. Rectifiez l'assaisonnement et servez immédiatement avec du persil frais.",
                duration: "2 min",
                tips: "Le risotto doit avoir une consistance crémeuse, ni trop liquide ni trop ferme.",
            },
        ],
        nutrition: {
            calories: 380,
            proteins: 12,
            carbs: 58,
            fats: 14,
            fiber: 3,
            sodium: 890,
        },
        substitutions: [
            {
                original: "Riz arborio",
                alternatives: ["Riz carnaroli", "Riz rond"],
                note: "Le riz arborio est idéal pour sa texture crémeuse",
            },
            {
                original: "Champignons de Paris",
                alternatives: ["Champignons shiitake", "Champignons portobello", "Mélange de champignons"],
                note: "Variez les champignons selon vos goûts",
            },
            {
                original: "Parmesan",
                alternatives: ["Grana Padano", "Pecorino Romano"],
                note: "Utilisez un fromage à pâte dure bien affiné",
            },
        ],
    },
};

export default function RecipePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const recipeId = parseInt(id);

    // États
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [isFavorite, setIsFavorite] = useState(false);
    const [activeTab, setActiveTab] = useState('ingredients');

    // États pour la gestion des images (admin)
    const [images, setImages] = useState([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [showImageManager, setShowImageManager] = useState(false);

    // Vérifier si l'utilisateur est admin
    const isAdmin = user?.role === 'ADMIN';

    // Charger la recette depuis l'API
    useEffect(() => {
        const loadRecipe = async () => {
            try {
                setLoading(true);
                setError(null);

                // Utiliser la version async pour de meilleures performances
                const data = await recipesService.getRecetteByIdAsync(recipeId);
                setRecipe(data);

                // Si admin, charger aussi les images
                if (isAdmin) {
                    loadImages();
                }
            } catch (err) {
                console.error('Erreur lors du chargement de la recette:', err);
                setError(err.message || 'Impossible de charger la recette');

                // Utiliser les données de fallback si disponibles
                if (FALLBACK_RECIPE[recipeId]) {
                    setRecipe(FALLBACK_RECIPE[recipeId]);
                    setError(null);
                }
            } finally {
                setLoading(false);
            }
        };

        if (recipeId) {
            loadRecipe();
        }
    }, [recipeId, isAdmin]);

    // Charger les images (admin uniquement)
    const loadImages = async () => {
        try {
            const data = await recipesService.getImages(recipeId);
            setImages(data || []);
        } catch (err) {
            console.error('Erreur chargement images:', err);
        }
    };

    // Upload d'image (admin uniquement)
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Vérifier le type de fichier
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            alert('Format non supporté. Utilisez JPG, PNG, WEBP ou GIF.');
            return;
        }

        // Vérifier la taille (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert('Le fichier est trop volumineux (max 5MB).');
            return;
        }

        try {
            setUploadingImage(true);

            const result = await recipesService.uploadImage(recipeId, file);

            // Recharger les images
            await loadImages();

            // Si c'est la première image OU si pas d'image principale, la définir automatiquement
            if (!recipe.image || recipe.image === 'https://via.placeholder.com/600x400?text=Recipe') {
                const imageUrl = result.url || result.cheminFichier;
                setRecipe({ ...recipe, image: imageUrl });

                // Mettre à jour aussi dans la base de données
                try {
                    await recipesService.updateRecette(recipeId, {
                        ...recipe,
                        image: imageUrl
                    });
                } catch (err) {
                    console.error('Erreur mise à jour image principale:', err);
                }
            }

            alert('Image ajoutée avec succès !');

            // Reset input
            event.target.value = '';
        } catch (err) {
            console.error('Erreur upload:', err);
            alert('Erreur lors de l\'upload: ' + err.message);
        } finally {
            setUploadingImage(false);
        }
    };

    // Supprimer une image (admin uniquement)
    const handleDeleteImage = async (imageId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
            return;
        }

        try {
            await recipesService.deleteFichier(recipeId, imageId);

            // Recharger les images
            await loadImages();

            alert('Image supprimée avec succès !');
        } catch (err) {
            console.error('Erreur suppression:', err);
            alert('Erreur lors de la suppression: ' + err.message);
        }
    };

    // Définir une image comme image principale (admin uniquement)
    const handleSetMainImage = async (imageUrl) => {
        try {
            // Mettre à jour l'état local immédiatement pour un feedback visuel instantané
            setRecipe({ ...recipe, image: imageUrl });

            // Mettre à jour la recette dans la base de données
            await recipesService.updateRecette(recipeId, {
                ...recipe,
                image: imageUrl
            });

            alert('Image principale mise à jour !');
        } catch (err) {
            console.error('Erreur mise à jour:', err);
            alert('Erreur lors de la mise à jour: ' + err.message);

            // Recharger la recette en cas d'erreur pour revenir à l'état précédent
            try {
                const data = await recipesService.getRecetteByIdAsync(recipeId);
                setRecipe(data);
            } catch (reloadErr) {
                console.error('Erreur rechargement:', reloadErr);
            }
        }
    };

    // État de chargement
    if (loading) {
        return (
            <div className="recipe-loading">
                <div className="loading-spinner"></div>
                <p>Chargement de la recette...</p>
            </div>
        );
    }

    // Gestion d'erreur
    if (error && !recipe) {
        return (
            <div className="recipe-not-found">
                <div className="not-found-content">
                    <h1 className="not-found-title">Erreur</h1>
                    <p className="error-message">{error}</p>
                    <Link to="/suggestions" className="btn btn-primary">
                        Retour aux suggestions
                    </Link>
                </div>
            </div>
        );
    }

    // Recette non trouvée
    if (!recipe) {
        return (
            <div className="recipe-not-found">
                <div className="not-found-content">
                    <h1 className="not-found-title">Recette non trouvée</h1>
                    <Link to="/suggestions" className="btn btn-primary">
                        Retour aux suggestions
                    </Link>
                </div>
            </div>
        );
    }

    const toggleStep = (stepNumber) => {
        setCompletedSteps((prev) =>
            prev.includes(stepNumber)
                ? prev.filter((s) => s !== stepNumber)
                : [...prev, stepNumber]
        );
    };

    // Calculer le progress de manière sécurisée
    const totalSteps = recipe?.steps?.length || 0;
    const progress = totalSteps > 0 ? (completedSteps.length / totalSteps) * 100 : 0;

    return (
        <div className="recipe-page">
            <div className="recipe-container">
                {/* Back Button */}
                <Link to="/suggestions" className="btn btn-back">
                    <ArrowLeft className="icon-sm" />
                    Retour aux suggestions
                </Link>

                {/* Recipe Header */}
                <div className="recipe-header-grid">
                    <div className="recipe-image-container">
                        <img
                            src={recipe.image || recipe.imageUrl}
                            alt={recipe.title || recipe.titre}
                            className="recipe-main-image"
                            onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/600x400?text=Recipe';
                            }}
                        />

                        {/* Bouton gestion images (Admin uniquement) */}
                        {isAdmin && (
                            <button
                                className="btn-manage-images"
                                onClick={() => setShowImageManager(!showImageManager)}
                                title="Gérer les images"
                            >
                                📷 Gérer les images
                            </button>
                        )}
                    </div>

                    <div className="recipe-header-content">
                        <div className="recipe-tags">
                            {recipe.tags?.map((tag) => (
                                <span key={tag} className="tag tag-secondary">
                  {tag}
                </span>
                            )) || <span className="tag tag-secondary">Non catégorisé</span>}
                        </div>

                        <h1 className="recipe-main-title">{recipe.title || recipe.titre || 'Recette sans titre'}</h1>
                        <p className="recipe-description">{recipe.description || 'Aucune description disponible'}</p>

                        {/* Recipe Stats */}
                        <div className="recipe-stats-grid">
                            <div className="stat-box">
                                <Clock className="stat-icon" />
                                <div className="stat-label">Temps total</div>
                                <div className="stat-value">{recipe.cookTime || recipe.tempsPreparation + ' min' || 'N/A'}</div>
                            </div>
                            <div className="stat-box">
                                <Users className="stat-icon" />
                                <div className="stat-label">Portions</div>
                                <div className="stat-value">{recipe.servings || recipe.nombrePortions || 'N/A'}</div>
                            </div>
                            <div className="stat-box">
                                <ChefHat className="stat-icon" />
                                <div className="stat-label">Difficulté</div>
                                <div className="stat-value">{recipe.difficulty || recipe.difficulte || 'N/A'}</div>
                            </div>
                            <div className="stat-box">
                                <Flame className="stat-icon" />
                                <div className="stat-label">Calories</div>
                                <div className="stat-value">{recipe.calories || 'N/A'}</div>
                            </div>
                        </div>

                        {/* Rating and Actions */}
                        <div className="recipe-actions-row">
                            <div className="recipe-rating">
                                <Star className="star-icon star-filled" />
                                <span className="rating-value">{recipe.rating || recipe.note || 0}</span>
                                <span className="rating-count">({recipe.reviews || recipe.nombreAvis || 0} avis)</span>
                            </div>

                            <div className="action-buttons">
                                <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => setIsFavorite(!isFavorite)}
                                >
                                    <Heart className={`icon-sm ${isFavorite ? 'heart-filled' : ''}`} />
                                    {isFavorite ? 'Retiré' : 'Favoris'}
                                </button>
                                <button className="btn btn-outline btn-sm">
                                    <Share2 className="icon-sm" />
                                    Partager
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Image Manager Panel (Admin uniquement) */}
                {isAdmin && showImageManager && (
                    <div className="image-manager-panel">
                        <div className="image-manager-header">
                            <h3>Gestion des images</h3>
                            <button
                                className="btn-close"
                                onClick={() => setShowImageManager(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="image-manager-content">
                            {/* Upload section */}
                            <div className="upload-section">
                                <label htmlFor="image-upload" className="upload-label">
                                    <input
                                        id="image-upload"
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage}
                                        style={{ display: 'none' }}
                                    />
                                    <div className="upload-button">
                                        {uploadingImage ? (
                                            <>
                                                <div className="mini-spinner"></div>
                                                <span>Upload en cours...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="upload-icon">📤</span>
                                                <span>Ajouter une image</span>
                                                <span className="upload-hint">JPG, PNG, WEBP, GIF (max 5MB)</span>
                                            </>
                                        )}
                                    </div>
                                </label>
                            </div>

                            {/* Images grid */}
                            <div className="images-grid">
                                {images.length > 0 ? (
                                    images.map((img) => {
                                        const imageUrl = img.url || img.cheminFichier;
                                        const isMainImage = recipe.image === imageUrl || recipe.imageUrl === imageUrl;

                                        return (
                                            <div key={img.id} className={`image-item ${isMainImage ? 'is-main' : ''}`}>
                                                <img
                                                    src={imageUrl}
                                                    alt={img.nom || 'Image recette'}
                                                    className="thumbnail"
                                                />

                                                {/* Badge "Image principale" */}
                                                {isMainImage && (
                                                    <div className="main-badge">
                                                        <span>⭐ Principale</span>
                                                    </div>
                                                )}

                                                <div className="image-actions">
                                                    {!isMainImage && (
                                                        <button
                                                            className="btn-image-action btn-set-main"
                                                            onClick={() => handleSetMainImage(imageUrl)}
                                                            title="Définir comme image principale"
                                                        >
                                                            ⭐
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn-image-action btn-delete-img"
                                                        onClick={() => handleDeleteImage(img.id)}
                                                        title="Supprimer"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                                <div className="image-info">
                                                    <span className="image-name">{img.nom || 'Sans nom'}</span>
                                                    <span className="image-size">
                            {img.taille ? (img.taille / 1024).toFixed(0) + ' KB' : ''}
                          </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="no-images">
                                        <p>Aucune image</p>
                                        <p className="hint">Ajoutez des images pour cette recette</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress Bar */}
                {completedSteps.length > 0 && (
                    <div className="progress-card">
                        <div className="progress-header">
                            <span className="progress-label">Progression</span>
                            <span className="progress-text">
                {completedSteps.length}/{recipe.steps.length} étapes
              </span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="recipe-tabs-section">
                    <div className="tabs-buttons">
                        <button
                            className={`tab-btn ${activeTab === 'ingredients' ? 'active' : ''}`}
                            onClick={() => setActiveTab('ingredients')}
                        >
                            <Scale className="icon-sm" />
                            Ingrédients
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'steps' ? 'active' : ''}`}
                            onClick={() => setActiveTab('steps')}
                        >
                            <Timer className="icon-sm" />
                            Étapes
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'nutrition' ? 'active' : ''}`}
                            onClick={() => setActiveTab('nutrition')}
                        >
                            <Flame className="icon-sm" />
                            Nutrition
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'substitutions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('substitutions')}
                        >
                            <Lightbulb className="icon-sm" />
                            Substitutions
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="tabs-content-grid">
                        <div className="tabs-main-content">
                            {/* Ingrédients Tab */}
                            {activeTab === 'ingredients' && (
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">
                                            Ingrédients ({recipe.servings || recipe.nombrePortions || 1} portions)
                                        </h3>
                                    </div>
                                    <div className="card-content">
                                        {recipe.ingredients && recipe.ingredients.length > 0 ? (
                                            <div className="ingredients-list">
                                                {recipe.ingredients.map((ingredient, index) => (
                                                    <div key={index} className="ingredient-item">
                                                        <div className="ingredient-left">
                                                            <div className={`ingredient-dot ${ingredient.essential ? 'essential' : 'optional'}`}></div>
                                                            <span className="ingredient-name">{ingredient.name || ingredient.nom || 'Ingrédient'}</span>
                                                            {!ingredient.essential && (
                                                                <span className="ingredient-badge">Optionnel</span>
                                                            )}
                                                        </div>
                                                        <span className="ingredient-quantity">{ingredient.quantity || ingredient.quantite || ''}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="empty-text">Aucun ingrédient disponible</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Étapes Tab */}
                            {activeTab === 'steps' && (
                                <div className="steps-list">
                                    {recipe.steps && recipe.steps.length > 0 ? (
                                        recipe.steps.map((step) => (
                                            <div
                                                key={step.step}
                                                className={`step-card ${completedSteps.includes(step.step) ? 'completed' : ''}`}
                                            >
                                                <div className="step-content">
                                                    <button
                                                        className={`step-number-btn ${completedSteps.includes(step.step) ? 'checked' : ''}`}
                                                        onClick={() => toggleStep(step.step)}
                                                    >
                                                        {completedSteps.includes(step.step) ? (
                                                            <CheckCircle2 className="icon-sm" />
                                                        ) : (
                                                            step.step
                                                        )}
                                                    </button>

                                                    <div className="step-details">
                                                        <div className="step-header">
                                                            <h3 className="step-title">{step.title}</h3>
                                                            <span className="step-duration">
                              <Timer className="icon-xs" />
                                                                {step.duration}
                            </span>
                                                        </div>

                                                        <p className="step-instruction">{step.instruction}</p>

                                                        {step.tips && (
                                                            <div className="step-tip">
                                                                <Lightbulb className="tip-icon" />
                                                                <p className="tip-text">{step.tips}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="card">
                                            <div className="card-content">
                                                <p className="empty-text">Aucune étape disponible</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Nutrition Tab */}
                            {activeTab === 'nutrition' && (
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">
                                            Informations nutritionnelles (par portion)
                                        </h3>
                                    </div>
                                    <div className="card-content">
                                        {recipe.nutrition ? (
                                            <div className="nutrition-grid">
                                                {[
                                                    { label: "Calories", value: recipe.nutrition.calories || 0, unit: "kcal", color: "red" },
                                                    { label: "Protéines", value: recipe.nutrition.proteins || recipe.nutrition.proteines || 0, unit: "g", color: "blue" },
                                                    { label: "Glucides", value: recipe.nutrition.carbs || recipe.nutrition.glucides || 0, unit: "g", color: "green" },
                                                    { label: "Lipides", value: recipe.nutrition.fats || recipe.nutrition.lipides || 0, unit: "g", color: "yellow" },
                                                    { label: "Fibres", value: recipe.nutrition.fiber || recipe.nutrition.fibres || 0, unit: "g", color: "purple" },
                                                    { label: "Sodium", value: recipe.nutrition.sodium || 0, unit: "mg", color: "orange" },
                                                ].map((item) => (
                                                    <div key={item.label} className="nutrition-item">
                                                        <span className="nutrition-label">{item.label}</span>
                                                        <span className={`nutrition-value ${item.color}`}>
                              {item.value}{item.unit}
                            </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="empty-text">Informations nutritionnelles non disponibles</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Substitutions Tab */}
                            {activeTab === 'substitutions' && (
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">Substitutions intelligentes</h3>
                                    </div>
                                    <div className="card-content">
                                        {recipe.substitutions && recipe.substitutions.length > 0 ? (
                                            <div className="substitutions-list">
                                                {recipe.substitutions.map((sub, index) => (
                                                    <div key={index} className="substitution-item">
                                                        <AlertCircle className="substitution-icon" />
                                                        <div className="substitution-content">
                                                            <div className="substitution-text">
                                                                <span className="substitution-original">{sub.original}</span>
                                                                <span className="substitution-label"> peut être remplacé par :</span>
                                                            </div>
                                                            <div className="substitution-alternatives">
                                                                {sub.alternatives?.map((alt) => (
                                                                    <span key={alt} className="tag tag-outline">{alt}</span>
                                                                )) || <span className="tag tag-outline">Non disponible</span>}
                                                            </div>
                                                            <p className="substitution-note">{sub.note || 'Aucune note'}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="empty-text">Aucune substitution disponible</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="recipe-sidebar">
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title-sm">Actions rapides</h3>
                                </div>
                                <div className="card-content quick-actions">
                                    <button className="btn btn-primary btn-full">
                                        <Timer className="icon-sm" />
                                        Démarrer la cuisson
                                    </button>
                                    <button className="btn btn-outline btn-full">
                                        <Scale className="icon-sm" />
                                        Ajuster les portions
                                    </button>
                                    <button className="btn btn-outline btn-full">
                                        <ChefHat className="icon-sm" />
                                        Ajouter au planificateur
                                    </button>
                                </div>
                            </div>

                            <div className="card tips-card-accent">
                                <div className="card-header">
                                    <h3 className="card-title-sm">
                                        <Lightbulb className="icon-sm text-accent" />
                                        Conseil du chef
                                    </h3>
                                </div>
                                <div className="card-content">
                                    <p className="chef-tip-text">
                                        Pour un risotto parfait, utilisez toujours du bouillon chaud et remuez constamment.
                                        La texture finale doit être crémeuse mais pas liquide.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}