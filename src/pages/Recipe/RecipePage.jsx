import {
    ArrowLeft,
    CheckCircle2,
    ChefHat,
    Clock,
    Flame,
    Heart,
    Lightbulb,
    Scale,
    Share2,
    Star,
    Timer,
    Users
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import feedbackService from '../../services/api/feedback.service';
import recipesService from '../../services/api/recipe.service';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import { RECIPE_PLACEHOLDER_URL } from '../../utils/RecipePlaceholder';
import './RecipePage.css';

export default function RecipePage() {
    const { id } = useParams();
    // navigate non utilisé
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

    // Charger les images (admin uniquement)
    const loadImages = useCallback(async () => {
        try {
            const data = await recipesService.getImages(recipeId);
            const normalized = (data || []).map((img) => {
                const display = img.directUrl || img.urlStream || img.urlTelechargement || img.url || img.cheminFichier;
                const finalUrl = display ? normalizeImageUrl(display) : display;
                return { ...img, displayUrl: finalUrl };
            });
            setImages(normalized);
        } catch (err) {
            console.error('Erreur chargement images:', err);
        }
    }, [recipeId]);

    // Charger la recette depuis l'API
    useEffect(() => {
        const loadRecipe = async () => {
            try {
                setLoading(true);
                setError(null);

                // Récupérer la recette (version async optimisée)
                const data = await recipesService.getRecetteByIdAsync(recipeId);

                // Récupérer les feedbacks pour la note
                let note = data.noteMoyenne || 0;
                let nombreAvis = data.nombreFeedbacks || 0;

                if (!note || note === 0) {
                    try {
                        const ratingData = await feedbackService.getAverageRatingByRecetteId(recipeId);
                        note = ratingData?.moyenneNote || 0;
                        nombreAvis = ratingData?.nombreAvis || 0;
                    } catch (ratingError) {
                        console.log('Pas de note disponible');
                    }
                }

                // Mapper les données du serveur vers le format attendu
                const mappedRecipe = {
                    id: data.id,
                    title: data.titre,
                    titre: data.titre,
                    description: data.description || 'Délicieuse recette à découvrir !',
                    image: data.imageUrl ? normalizeImageUrl(data.imageUrl) : data.imageUrl,
                    imageUrl: data.imageUrl ? normalizeImageUrl(data.imageUrl) : data.imageUrl,
                    cookTime: data.tempsTotal ? `${data.tempsTotal} min` : 'N/A',
                    tempsPreparation: data.tempsTotal,
                    prepTime: data.tempsTotal ? `${data.tempsTotal} min` : 'N/A',
                    difficulty: data.difficulte || 'FACILE',
                    difficulte: data.difficulte || 'FACILE',
                    rating: note,
                    note: note,
                    reviews: nombreAvis,
                    nombreAvis: nombreAvis,
                    servings: 4, // Par défaut
                    nombrePortions: 4,
                    calories: data.kcal || 0,
                    kcal: data.kcal || 0,
                    tags: data.tags || [data.categorie || 'Recette'],
                    categorie: data.categorie,

                    // Mapper les ingrédients
                    // Utiliser nomAliment si disponible (nom personnalisé), sinon alimentNom (nom de la base)
                    ingredients: data.ingredients?.map(ing => ({
                        name: ing.nomAliment || ing.alimentNom,
                        nom: ing.nomAliment || ing.alimentNom,
                        quantity: `${ing.quantite} ${ing.unite?.toLowerCase() || ''}`.trim(),
                        quantite: `${ing.quantite} ${ing.unite?.toLowerCase() || ''}`.trim(),
                        essential: ing.principal !== false,
                        principal: ing.principal
                    })) || [],

                    // Mapper les étapes
                    steps: data.etapes?.sort((a, b) => a.ordre - b.ordre).map(etape => ({
                        step: etape.ordre,
                        ordre: etape.ordre,
                        title: `Étape ${etape.ordre}`,
                        instruction: etape.texte,
                        texte: etape.texte,
                        duration: etape.temps ? `${etape.temps} min` : 'Quelques minutes',
                        temps: etape.temps
                    })) || [],

                    // Informations nutritionnelles
                    nutrition: {
                        calories: data.kcal || 0,
                        proteins: 0,
                        carbs: 0,
                        fats: 0,
                        fiber: 0,
                        sodium: 0
                    },

                    substitutions: []
                };

                // Essayer de récupérer une image (préférence: directUrl > stream > presigned)
                try {
                    const imgs = await recipesService.getImages(recipeId);
                    if (imgs && imgs.length > 0) {
                        const candidate = imgs[0];
                        const chosen = candidate.directUrl || candidate.urlStream || candidate.urlTelechargement || candidate.url;
                        if (chosen) {
                            const normalized = normalizeImageUrl(chosen);
                            mappedRecipe.image = normalized;
                            mappedRecipe.imageUrl = normalized;
                        }
                    }
                } catch (e) {
                    // Ignorer si indisponible
                }

                setRecipe(mappedRecipe);

                // Si admin, charger aussi les images
                if (isAdmin) {
                    loadImages();
                }
            } catch (err) {
                console.error('Erreur lors du chargement de la recette:', err);
                setError(err.message || 'Impossible de charger la recette');
            } finally {
                setLoading(false);
            }
        };

        if (recipeId) {
            loadRecipe();
            if (isAdmin) {
                loadImages();
            }
        }
    }, [recipeId, isAdmin, loadImages]);

    // Upload d'image (admin uniquement)
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            alert('Format non supporté. Utilisez JPG, PNG, WEBP ou GIF.');
            return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('Le fichier est trop volumineux (max 5MB).');
            return;
        }

        try {
            setUploadingImage(true);
            const result = await recipesService.uploadImage(recipeId, file);
            await loadImages();

            if (!recipe.image || recipe.image.includes('placeholder')) {
                const chosen = result.directUrl || result.urlStream || result.urlTelechargement || result.url || result.cheminFichier;
                const imageUrl = chosen ? normalizeImageUrl(chosen) : chosen;
                if (imageUrl) {
                    setRecipe({ ...recipe, image: imageUrl, imageUrl: imageUrl });

                    try {
                        await recipesService.updateRecette(recipeId, {
                            imageUrl: imageUrl
                        });
                    } catch (err) {
                        console.error('Erreur mise à jour image principale:', err);
                    }
                }
            }

            alert('Image ajoutée avec succès !');
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
            setRecipe({ ...recipe, image: imageUrl });

            await recipesService.updateRecette(recipeId, {
                imageUrl: imageUrl
            });

            alert('Image principale mise à jour !');
        } catch (err) {
            console.error('Erreur mise à jour:', err);
            alert('Erreur lors de la mise à jour: ' + err.message);

            try {
                const data = await recipesService.getRecetteById(recipeId);
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
                            src={recipe.image || recipe.imageUrl || RECIPE_PLACEHOLDER_URL}
                            alt={recipe.title || recipe.titre}
                            className="recipe-main-image"
                            onError={(e) => {
                                console.warn('❌ Erreur chargement image recette:', recipe.imageUrl);
                                e.target.src = RECIPE_PLACEHOLDER_URL;
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
                            {recipe.tags?.map((tag, index) => (
                                <span key={index} className="tag tag-secondary">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <h1 className="recipe-main-title">{recipe.title || recipe.titre || 'Recette sans titre'}</h1>
                        <p className="recipe-description">{recipe.description}</p>

                        {/* Recipe Stats */}
                        <div className="recipe-stats-grid">
                            <div className="stat-box">
                                <Clock className="stat-icon" />
                                <div className="stat-label">Temps total</div>
                                <div className="stat-value">{recipe.cookTime}</div>
                            </div>
                            <div className="stat-box">
                                <Users className="stat-icon" />
                                <div className="stat-label">Portions</div>
                                <div className="stat-value">{recipe.servings}</div>
                            </div>
                            <div className="stat-box">
                                <ChefHat className="stat-icon" />
                                <div className="stat-label">Difficulté</div>
                                <div className="stat-value">{recipe.difficulty}</div>
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
                                <span className="rating-value">
                                    {recipe.rating > 0 ? recipe.rating.toFixed(1) : 'N/A'}
                                </span>
                                <span className="rating-count">({recipe.reviews} avis)</span>
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
                                        const imageUrl = img.displayUrl || img.url || img.cheminFichier;
                                        const isMainImage = recipe.image === imageUrl || recipe.imageUrl === imageUrl;

                                        return (
                                            <div key={img.id} className={`image-item ${isMainImage ? 'is-main' : ''}`}>
                                                <img
                                                    src={imageUrl}
                                                    alt={img.nom || 'Image recette'}
                                                    className="thumbnail"
                                                />

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
                {completedSteps.length > 0 && totalSteps > 0 && (
                    <div className="progress-card">
                        <div className="progress-header">
                            <span className="progress-label">Progression</span>
                            <span className="progress-text">
                                {completedSteps.length}/{totalSteps} étapes
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
                    </div>

                    {/* Tab Content */}
                    <div className="tabs-content-grid">
                        <div className="tabs-main-content">
                            {/* Ingrédients Tab */}
                            {activeTab === 'ingredients' && (
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">
                                            Ingrédients ({recipe.servings} portions)
                                        </h3>
                                    </div>
                                    <div className="card-content">
                                        {recipe.ingredients && recipe.ingredients.length > 0 ? (
                                            <div className="ingredients-list">
                                                {recipe.ingredients.map((ingredient, index) => (
                                                    <div key={index} className="ingredient-item">
                                                        <div className="ingredient-left">
                                                            <div className={`ingredient-dot ${ingredient.essential ? 'essential' : 'optional'}`}></div>
                                                            <span className="ingredient-name">{ingredient.name}</span>
                                                            {!ingredient.essential && (
                                                                <span className="ingredient-badge">Optionnel</span>
                                                            )}
                                                        </div>
                                                        <span className="ingredient-quantity">{ingredient.quantity}</span>
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
                                <div className="card nutrition-card-modern">
                                    <div className="card-header nutrition-header">
                                        <h3 className="card-title">
                                            <Flame className="icon-sm" />
                                            Informations nutritionnelles
                                        </h3>
                                        <span className="portion-badge">Par portion</span>
                                    </div>
                                    <div className="card-content">
                                        {recipe.calories > 0 ? (
                                            <div className="nutrition-modern-grid">
                                                <div className="nutrition-item-modern calories">
                                                    <div className="nutrition-icon-wrapper">
                                                        <Flame className="nutrition-icon" />
                                                    </div>
                                                    <div className="nutrition-details">
                                                        <span className="nutrition-value-lg">{recipe.calories}</span>
                                                        <span className="nutrition-label-sm">Calories (kcal)</span>
                                                    </div>
                                                </div>
                                                <div className="nutrition-item-modern protein">
                                                    <div className="nutrition-icon-wrapper">
                                                        <Scale className="nutrition-icon" />
                                                    </div>
                                                    <div className="nutrition-details">
                                                        <span className="nutrition-value-lg">-</span>
                                                        <span className="nutrition-label-sm">Protéines (g)</span>
                                                    </div>
                                                </div>
                                                <div className="nutrition-item-modern carbs">
                                                    <div className="nutrition-icon-wrapper">
                                                        <ChefHat className="nutrition-icon" />
                                                    </div>
                                                    <div className="nutrition-details">
                                                        <span className="nutrition-value-lg">-</span>
                                                        <span className="nutrition-label-sm">Glucides (g)</span>
                                                    </div>
                                                </div>
                                                <div className="nutrition-item-modern fats">
                                                    <div className="nutrition-icon-wrapper">
                                                        <Heart className="nutrition-icon" />
                                                    </div>
                                                    <div className="nutrition-details">
                                                        <span className="nutrition-value-lg">-</span>
                                                        <span className="nutrition-label-sm">Lipides (g)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="nutrition-empty">
                                                <Flame className="empty-icon" />
                                                <p className="empty-title">Informations nutritionnelles non disponibles</p>
                                                <p className="empty-desc">Ces informations seront ajoutées prochainement</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="recipe-sidebar">
                            <div className="card actions-card-gradient">
                                <div className="card-header">
                                    <h3 className="card-title-sm">
                                        <Star className="icon-sm" />
                                        Actions rapides
                                    </h3>
                                </div>
                                <div className="card-content quick-actions">
                                    <button className="btn btn-primary btn-full btn-animated">
                                        <Timer className="icon-sm" />
                                        Démarrer la cuisson
                                    </button>
                                    <button className="btn btn-outline btn-full btn-animated">
                                        <ChefHat className="icon-sm" />
                                        Ajouter au planificateur
                                    </button>
                                    <button className="btn btn-outline btn-full btn-animated">
                                        <Share2 className="icon-sm" />
                                        Partager cette recette
                                    </button>
                                </div>
                            </div>

                            <div className="card info-card-modern">
                                <div className="card-header">
                                    <h3 className="card-title-sm">
                                        <Lightbulb className="icon-sm text-accent" />
                                        Informations
                                    </h3>
                                </div>
                                <div className="card-content">
                                    <div className="info-list">
                                        <div className="info-item">
                                            <ChefHat className="info-icon" />
                                            <div className="info-text">
                                                <span className="info-label">Difficulté</span>
                                                <span className="info-value">{recipe.difficulty}</span>
                                            </div>
                                        </div>
                                        <div className="info-item">
                                            <Star className="info-icon" />
                                            <div className="info-text">
                                                <span className="info-label">Catégorie</span>
                                                <span className="info-value">{recipe.categorie || 'Non catégorisé'}</span>
                                            </div>
                                        </div>
                                        <div className="info-item">
                                            <Clock className="info-icon" />
                                            <div className="info-text">
                                                <span className="info-label">Temps total</span>
                                                <span className="info-value">{recipe.cookTime}</span>
                                            </div>
                                        </div>
                                        <div className="info-item">
                                            <Users className="info-icon" />
                                            <div className="info-text">
                                                <span className="info-label">Portions</span>
                                                <span className="info-value">{recipe.servings} personnes</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card tips-card-gradient">
                                <div className="card-header">
                                    <h3 className="card-title-sm">
                                        <Lightbulb className="icon-sm" />
                                        Astuce du chef
                                    </h3>
                                </div>
                                <div className="card-content">
                                    <p className="chef-tip-modern">
                                        💡 Pour de meilleurs résultats, suivez l'ordre des étapes et respectez les temps de cuisson indiqués.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Info Card */}
                <div className="recipe-footer-card">
                    <div className="footer-card-content">
                        <div className="footer-section">
                            <ChefHat className="footer-icon" />
                            <div className="footer-text">
                                <h4 className="footer-title">Besoin d'aide ?</h4>
                                <p className="footer-desc">Consultez nos conseils de préparation et astuces culinaires</p>
                            </div>
                        </div>
                        <div className="footer-section">
                            <Heart className="footer-icon" />
                            <div className="footer-text">
                                <h4 className="footer-title">Vous avez aimé ?</h4>
                                <p className="footer-desc">Laissez un avis pour aider d'autres cuisiniers</p>
                            </div>
                        </div>
                        <div className="footer-section">
                            <Share2 className="footer-icon" />
                            <div className="footer-text">
                                <h4 className="footer-title">Partagez</h4>
                                <p className="footer-desc">Faites découvrir cette recette à vos amis</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}