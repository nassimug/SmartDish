import {
    AlertCircle,
    Camera,
    Check,
    ChefHat,
    Clock,
    Edit,
    Flame,
    Heart,
    Mail,
    MapPin,
    Phone,
    Save,
    Settings,
    Sparkles,
    Star,
    Trophy,
    User,
    X,
    Zap
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import activityService from '../../services/api/activity.service';
import authService from '../../services/api/auth.service';
import { RECIPE_PLACEHOLDER_URL } from '../../utils/RecipePlaceholder';
// Notifications gérées côté backend (pas d'appel direct depuis le frontend)
import recipesService from '../../services/api/recipe.service';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import './AccountPage.css';
import './modal-styles.css';

export default function AccountPage() {
    const { user, updateUser } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const [activeTab, setActiveTab] = useState('profile');
    const [activeValidationTab, setActiveValidationTab] = useState('en_attente');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pendingRecipes, setPendingRecipes] = useState([]);
    const [validatedRecipes, setValidatedRecipes] = useState([]);
    const [rejectedRecipes, setRejectedRecipes] = useState([]);
    const [myRecipes, setMyRecipes] = useState([]);

    // Gestion des images cassées
    const handleImgError = (e) => {
        e.target.src = RECIPE_PLACEHOLDER_URL;
    };
    const [validationLoading, setValidationLoading] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [validationSuccess, setValidationSuccess] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showValidateModal, setShowValidateModal] = useState(false);
    const [rejectRecipeId, setRejectRecipeId] = useState(null);
    const [validateRecipeId, setValidateRecipeId] = useState(null);
    const [rejectMotif, setRejectMotif] = useState('');
    const [recentActivity, setRecentActivity] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        localisation: '',
        bio: ''
    });

    // Données fictives pour les stats (à remplacer par des vraies données API)
    const stats = {
        recipesCooked: 47,
        favoriteRecipes: 23,
        totalCookingTime: "18h 30min",
        averageRating: 4.6,
    };

    const preferences = {
        dietaryRestrictions: ["Végétarien"],
        allergies: ["Fruits à coque"],
        cuisineTypes: ["Italien", "Français", "Asiatique"],
        skillLevel: "Intermédiaire",
        cookingTime: "30-45 min",
    };

    // Charger les activités récentes au montage du composant
    useEffect(() => {
        if (user?.id) {
            loadRecentActivities();
        }
    }, [user?.id]);

    const loadRecentActivities = async () => {
        if (!user?.id) return;

        try {
            setActivityLoading(true);
            const activities = await activityService.getRecentActivites(user.id);
            
            // Formater les activités pour l'affichage
            const formattedActivities = activities.map(activityService.formatActivityForDisplay);
            setRecentActivity(formattedActivities);
        } catch (error) {
            console.error('Erreur lors du chargement des activités:', error);
            // En cas d'erreur, garder les données fictives
        } finally {
            setActivityLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            setFormData({
                nom: user.nom || '',
                prenom: user.prenom || '',
                email: user.email || '',
                telephone: user.telephone || '',
                localisation: user.localisation || '',
                bio: user.bio || 'Passionnée de cuisine depuis toujours, j\'adore découvrir de nouvelles recettes et partager mes créations culinaires.'
            });
        }
    }, [user]);

    // Charger toutes les listes pour les admins
    useEffect(() => {
        if (isAdmin) {
            loadValidationLists();
        }
    }, [isAdmin]);

    // Enrichir les recettes avec leurs images depuis l'endpoint dedié
    const enrichRecipesWithImages = async (recipes) => {
        if (!recipes || recipes.length === 0) return recipes;
        
        try {
            const enrichedRecipes = await Promise.all(
                recipes.map(async (recipe) => {
                    try {
                        const images = await recipesService.getImages(recipe.id);
                        if (images && images.length > 0) {
                            const firstImage = images[0];
                            // Préférence: directUrl > urlStream > urlTelechargement > url
                            // directUrl: Direct MinIO URL without presigned params (PREFERRED - most reliable)
                            // urlStream: Backend inline streaming endpoint (fallback)
                            // urlTelechargement: Presigned URL MinIO (fallback - may have signature issues)
                            let imageUrl = firstImage.directUrl || firstImage.urlStream || firstImage.urlTelechargement || firstImage.url || firstImage.cheminFichier;
                            if (imageUrl && !imageUrl.startsWith('http')) {
                                imageUrl = normalizeImageUrl(imageUrl);
                            }
                            return { ...recipe, imageUrl };
                        }
                    } catch (err) {
                        console.warn(`⚠️ Impossible de charger images pour recette ${recipe.id}:`, err);
                    }
                    return recipe;
                })
            );
            return enrichedRecipes;
        } catch (error) {
            console.error('❌ Erreur enrichissement images:', error);
            return recipes;
        }
    };

    const loadValidationLists = useCallback(async () => {
        try {
            setLoading(true);
            setValidationError('');
            console.log('🔄 [AccountPage] Chargement séquentiel des listes (attente/validées/rejetées)');

            const pendingRaw = await recipesService.getRecettesEnAttente();
            const validatedRaw = await recipesService.getRecettesValidees();
            const rejectedRaw = await recipesService.getRecettesRejetees();

            const pendingEnriched = await enrichRecipesWithImages(pendingRaw);
            const validatedEnriched = await enrichRecipesWithImages(validatedRaw);
            const rejectedEnriched = await enrichRecipesWithImages(rejectedRaw);

            setPendingRecipes(pendingEnriched || []);
            setValidatedRecipes(validatedEnriched || []);
            setRejectedRecipes(rejectedEnriched || []);
        } catch (error) {
            console.error('❌ [AccountPage] Erreur chargement listes validation:', error);
            setValidationError(error.message || 'Erreur lors du chargement des recettes');
            setPendingRecipes([]);
            setValidatedRecipes([]);
            setRejectedRecipes([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadMyRecipes = useCallback(async () => {
        try {
            setLoading(true);
            console.log('🔍 Chargement des recettes pour utilisateur:', user.id);
            const recipes = await recipesService.getRecettesByUtilisateur(user.id);
            console.log('📦 Recettes utilisateur reçues:', recipes);
            console.log('📊 Nombre de recettes:', recipes?.length || 0);
            const enrichedRecipes = await enrichRecipesWithImages(recipes);
            setMyRecipes(enrichedRecipes || []);
        } catch (error) {
            console.error('❌ Erreur chargement mes recettes:', error);
            setMyRecipes([]);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    // Charger initialement les listes validation pour admin
    useEffect(() => {
        if (isAdmin) {
            loadValidationLists();
        }
    }, [isAdmin, loadValidationLists]);

    // Rafraîchir la liste affichée uniquement si elle est vide quand on change d'onglet
    useEffect(() => {
        if (!isAdmin || activeTab !== 'validation') return;
        if (activeValidationTab === 'en_attente' && pendingRecipes.length === 0) loadValidationLists();
        if (activeValidationTab === 'validees' && validatedRecipes.length === 0) loadValidationLists();
        if (activeValidationTab === 'rejetees' && rejectedRecipes.length === 0) loadValidationLists();
    }, [
        isAdmin,
        activeTab,
        activeValidationTab,
        pendingRecipes.length,
        validatedRecipes.length,
        rejectedRecipes.length,
        loadValidationLists
    ]);

    useEffect(() => {
        if (!isAdmin && activeTab === 'mes_recettes' && user?.id) {
            loadMyRecipes();
        }
    }, [isAdmin, activeTab, user?.id, loadMyRecipes]);
    
    // Recharger les recettes quand on revient sur la page
    useEffect(() => {
        const handleFocus = () => {
            if (!isAdmin && activeTab === 'mes_recettes' && user?.id) {
                console.log('🔄 Rechargement des recettes au retour sur la page');
                loadMyRecipes();
            }
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [isAdmin, activeTab, user?.id, loadMyRecipes]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            console.log('Données à envoyer:', formData);
            // Appel API pour mettre à jour l'utilisateur
            const updatedUser = await authService.updateUser(user.id, formData);
            console.log('Utilisateur mis à jour:', updatedUser);
            updateUser(updatedUser);
            setIsEditing(false);
            alert('Profil mis à jour avec succès !');
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la mise à jour du profil';
            alert('Erreur: ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleValidateRecipe = (recetteId) => {
        setValidateRecipeId(recetteId);
        setShowValidateModal(true);
    };

    const confirmValidateRecipe = async () => {
        try {
            setValidationLoading(true);
            setValidationError('');
            setValidationSuccess('');

            const recipe = pendingRecipes.find(r => r.id === validateRecipeId);
            console.log('🔍 Recette à valider:', recipe);
            console.log('👤 Utilisateur ID de la recette:', recipe?.utilisateurId);
            
            await recipesService.validerRecette(validateRecipeId);
            console.log('✅ Recette validée côté backend');

            // Ne plus créer de notification manuellement côté frontend (CORS)
            // Le backend persistance crée automatiquement la notification.
            // On déclenche simplement un rafraîchissement côté Navigation.
            if (!recipe?.utilisateurId) {
                console.warn('⚠️ utilisateurId manquant pour rechargement des notifications');
            }
            
            // Forcer le rechargement des notifications dans Navigation
            window.dispatchEvent(new Event('reloadNotifications'));

            setValidationSuccess('Recette validée avec succès !');
            setShowValidateModal(false);
            setValidateRecipeId(null);

            // Mise à jour immédiate des listes pour éviter d'attendre le rechargement
            setPendingRecipes((prev) => prev.filter((r) => r.id !== validateRecipeId));
            if (recipe) {
                setValidatedRecipes((prev) => [{ ...recipe, statut: 'VALIDEE' }, ...prev]);
            }
            
            // Ne pas recharger immédiatement toutes les listes pour éviter la latence.
            // Les compteurs sont mis à jour de manière optimiste ci-dessus.
            // Rafraîchissement léger en arrière-plan après un court délai.
            setTimeout(() => {
                loadValidationLists();
            }, 1500);
            
            // Afficher le message et masquer après délai
            setTimeout(() => {
                setValidationSuccess('');
            }, 3000);
        } catch (error) {
            console.error('❌ Erreur validation:', error);
            setValidationError(error.message || 'Erreur lors de la validation de la recette');
        } finally {
            setValidationLoading(false);
        }
    };

    const handleRejectRecipe = (recetteId) => {
        setRejectRecipeId(recetteId);
        setRejectMotif('');
        setShowRejectModal(true);
    };

    const confirmRejectRecipe = async () => {
        if (!rejectMotif.trim()) {
            setValidationError('Le motif de rejet est obligatoire');
            return;
        }
        
        try {
            setValidationLoading(true);
            setValidationError('');
            setValidationSuccess('');

            const recipe = pendingRecipes.find(r => r.id === rejectRecipeId);
            console.log('🔍 Recette à rejeter:', recipe);
            console.log('👤 Utilisateur ID de la recette:', recipe?.utilisateurId);
            
            await recipesService.rejeterRecette(rejectRecipeId, rejectMotif.trim());
            console.log('✅ Recette rejetée côté backend');

            // Ne plus créer de notification manuellement côté frontend (CORS)
            // Le backend persistance crée automatiquement la notification.

            // Forcer le rechargement des notifications dans Navigation
            window.dispatchEvent(new Event('reloadNotifications'));

            setValidationSuccess('Recette rejetée');
            setShowRejectModal(false);
            setRejectRecipeId(null);
            setRejectMotif('');

            // Mise à jour immédiate des listes pour éviter d'attendre le rechargement
            setPendingRecipes((prev) => prev.filter((r) => r.id !== rejectRecipeId));
            if (recipe) {
                setRejectedRecipes((prev) => [{ ...recipe, statut: 'REJETEE' }, ...prev]);
            }
            
            // Ne pas recharger immédiatement toutes les listes pour éviter la latence.
            // Les compteurs sont mis à jour de manière optimiste ci-dessus.
            // Rafraîchissement léger en arrière-plan après un court délai.
            setTimeout(() => {
                loadValidationLists();
            }, 1500);
            
            // Afficher le message et masquer après délai
            setTimeout(() => {
                setValidationSuccess('');
            }, 3000);
        } catch (error) {
            console.error('❌ Erreur rejet:', error);
            setValidationError(error.message || 'Erreur lors du rejet de la recette');
        } finally {
            setValidationLoading(false);
        }
    };

    const getInitials = () => {
        if (!user) return 'U';
        return `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase();
    };

    const getJoinDate = () => {
        // À remplacer par la vraie date d'inscription de l'API
        return 'Janvier 2024';
    };

    return (
        <div className="account-page">
            <div className="account-container">
                {/* Header */}
                <div className="account-header">
                    <h1 className="account-title">Mon compte</h1>
                    <p className="account-subtitle">
                        Gérez votre profil et vos préférences culinaires
                    </p>
                </div>

                {/* Tabs */}
                <div className="tabs">
                    <div className="tabs-list">
                        <button
                            className={`tab-trigger ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            Profil
                        </button>
                        <button
                            className={`tab-trigger ${activeTab === 'preferences' ? 'active' : ''}`}
                            onClick={() => setActiveTab('preferences')}
                        >
                            Préférences
                        </button>
                        <button
                            className={`tab-trigger ${activeTab === 'activity' ? 'active' : ''}`}
                            onClick={() => setActiveTab('activity')}
                        >
                            Activité
                        </button>
                        {!isAdmin && (
                            <button
                                className={`tab-trigger ${activeTab === 'mes_recettes' ? 'active' : ''}`}
                                onClick={() => setActiveTab('mes_recettes')}
                            >
                                <ChefHat className="icon-xs" style={{ marginRight: '0.5rem' }} />
                                Mes recettes
                            </button>
                        )}
                        {isAdmin && (
                            <button
                                className={`tab-trigger ${activeTab === 'validation' ? 'active' : ''}`}
                                onClick={() => setActiveTab('validation')}
                            >
                                <AlertCircle className="icon-xs" style={{ marginRight: '0.5rem' }} />
                                Validation ({pendingRecipes.length})
                            </button>
                        )}
                        <button
                            className={`tab-trigger ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            Paramètres
                        </button>
                    </div>

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="tab-content">
                            <div className="profile-grid">
                                {/* Profile Card */}
                                <div className="card profile-card">
                                    <div className="card-header">
                                        <h3 className="card-title">Informations personnelles</h3>
                                        <button
                                            className={`btn ${isEditing ? 'btn-primary' : 'btn-outline'}`}
                                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                'Sauvegarde...'
                                            ) : isEditing ? (
                                                <>
                                                    <Save className="icon-sm" />
                                                    Sauvegarder
                                                </>
                                            ) : (
                                                <>
                                                    <Edit className="icon-sm" />
                                                    Modifier
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="card-content">
                                        {/* Avatar */}
                                        <div className="avatar-section">
                                            <div className="avatar-wrapper">
                                                <div className="avatar">
                                                    <span className="avatar-fallback">{getInitials()}</span>
                                                </div>
                                                {isEditing && (
                                                    <button className="avatar-edit-btn">
                                                        <Camera className="icon-sm" />
                                                    </button>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="user-name">
                                                    {user?.prenom} {user?.nom}
                                                </h3>
                                                <p className="user-join-date">
                                                    Membre depuis {getJoinDate()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Form Fields */}
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label htmlFor="prenom" className="form-label">Prénom</label>
                                                <div className="input-wrapper">
                                                    <User className="input-icon" />
                                                    <input
                                                        type="text"
                                                        id="prenom"
                                                        name="prenom"
                                                        value={formData.prenom}
                                                        onChange={handleChange}
                                                        disabled={!isEditing}
                                                        className="form-input"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="nom" className="form-label">Nom</label>
                                                <div className="input-wrapper">
                                                    <User className="input-icon" />
                                                    <input
                                                        type="text"
                                                        id="nom"
                                                        name="nom"
                                                        value={formData.nom}
                                                        onChange={handleChange}
                                                        disabled={!isEditing}
                                                        className="form-input"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="email" className="form-label">Email</label>
                                                <div className="input-wrapper">
                                                    <Mail className="input-icon" />
                                                    <input
                                                        type="email"
                                                        id="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        disabled={!isEditing}
                                                        className="form-input"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="telephone" className="form-label">Téléphone</label>
                                                <div className="input-wrapper">
                                                    <Phone className="input-icon" />
                                                    <input
                                                        type="tel"
                                                        id="telephone"
                                                        name="telephone"
                                                        value={formData.telephone}
                                                        onChange={handleChange}
                                                        disabled={!isEditing}
                                                        className="form-input"
                                                        placeholder="+33 6 12 34 56 78"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group form-group-full">
                                                <label htmlFor="localisation" className="form-label">Localisation</label>
                                                <div className="input-wrapper">
                                                    <MapPin className="input-icon" />
                                                    <input
                                                        type="text"
                                                        id="localisation"
                                                        name="localisation"
                                                        value={formData.localisation}
                                                        onChange={handleChange}
                                                        disabled={!isEditing}
                                                        className="form-input"
                                                        placeholder="Paris, France"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="bio" className="form-label">Bio</label>
                                            <textarea
                                                id="bio"
                                                name="bio"
                                                value={formData.bio}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                rows={3}
                                                className="form-textarea"
                                                placeholder="Parlez-nous de votre passion pour la cuisine..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Card */}
                                <div className="card stats-card">
                                    <div className="card-header">
                                        <h3 className="card-title">
                                            <Trophy className="icon-sm text-primary" />
                                            Mes statistiques
                                        </h3>
                                    </div>

                                    <div className="card-content">
                                        <div className="stat-highlight">
                                            <div className="stat-value">{stats.recipesCooked}</div>
                                            <div className="stat-label">Recettes cuisinées</div>
                                        </div>

                                        <div className="stats-grid">
                                            <div className="stat-item">
                                                <div className="stat-number">{stats.favoriteRecipes}</div>
                                                <div className="stat-text">Favoris</div>
                                            </div>
                                            <div className="stat-item">
                                                <div className="stat-number">{stats.averageRating}</div>
                                                <div className="stat-text">Note moyenne</div>
                                            </div>
                                        </div>

                                        <div className="stat-time">
                                            <div className="stat-number">{stats.totalCookingTime}</div>
                                            <div className="stat-text">Temps de cuisine total</div>
                                        </div>
                                    </div>
                                </div>

                                {/* CTA Créer une recette */}
                                <div className="card create-recipe-cta">
                                    <div className="card-content">
                                        <div className="cta-content">
                                            <div className="cta-icon">
                                                <ChefHat className="icon-md" />
                                            </div>
                                            <div className="cta-text">
                                                <h3 className="cta-title">Proposer une recette</h3>
                                                <p className="cta-desc">Partagez votre recette avec la communauté ! Elle sera validée par l'équipe admin avant publication.</p>
                                            </div>
                                            <Link to="/recette/nouvelle" className="cta-btn">
                                                Créer ma recette
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preferences Tab */}
                    {activeTab === 'preferences' && (
                        <div className="tab-content">
                            <div className="preferences-grid">
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">Préférences alimentaires</h3>
                                    </div>
                                    <div className="card-content">
                                        <div className="preference-section">
                                            <label className="preference-label">Régime alimentaire</label>
                                            <div className="badge-list">
                                                {preferences.dietaryRestrictions.map((restriction) => (
                                                    <span key={restriction} className="badge badge-primary">
                            {restriction}
                          </span>
                                                ))}
                                                <button className="btn btn-outline btn-sm">+ Ajouter</button>
                                            </div>
                                        </div>

                                        <div className="preference-section">
                                            <label className="preference-label">Allergies</label>
                                            <div className="badge-list">
                                                {preferences.allergies.map((allergy) => (
                                                    <span key={allergy} className="badge badge-danger">
                            {allergy}
                          </span>
                                                ))}
                                                <button className="btn btn-outline btn-sm">+ Ajouter</button>
                                            </div>
                                        </div>

                                        <div className="preference-section">
                                            <label className="preference-label">Types de cuisine préférés</label>
                                            <div className="badge-list">
                                                {preferences.cuisineTypes.map((cuisine) => (
                                                    <span key={cuisine} className="badge badge-secondary">
                            {cuisine}
                          </span>
                                                ))}
                                                <button className="btn btn-outline btn-sm">+ Ajouter</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">Préférences de cuisine</h3>
                                    </div>
                                    <div className="card-content">
                                        <div className="preference-section">
                                            <label className="preference-label">Niveau de compétence</label>
                                            <span className="badge badge-outline">
                        <ChefHat className="icon-xs" />
                                                {preferences.skillLevel}
                      </span>
                                        </div>

                                        <div className="preference-section">
                                            <label className="preference-label">Temps de cuisine préféré</label>
                                            <span className="badge badge-outline">
                        <Clock className="icon-xs" />
                                                {preferences.cookingTime}
                      </span>
                                        </div>

                                        <div className="preference-actions">
                                            <button className="btn btn-primary btn-full">
                                                <Settings className="icon-sm" />
                                                Modifier les préférences
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Activity Tab */}
                    {activeTab === 'activity' && (
                        <div className="tab-content">
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">
                                        <Zap className="icon-sm" style={{ marginRight: '0.5rem' }} />
                                        Activité récente
                                    </h3>
                                </div>
                                <div className="card-content">
                                    {activityLoading ? (
                                        <div className="loading-state">
                                            <div className="loading-spinner"></div>
                                            <p>Chargement...</p>
                                        </div>
                                    ) : recentActivity.length === 0 ? (
                                        <div className="empty-state">
                                            <Zap className="empty-icon" />
                                            <p className="empty-title">Aucune activité récente</p>
                                            <p className="empty-desc">Vos activités apparaîtront ici</p>
                                        </div>
                                    ) : (
                                        <div className="activity-list">
                                            {recentActivity.map((activity, index) => {
                                                // Déterminer l'icône et le type selon typeActivite
                                                let icon = <Zap className="icon" />;
                                                let activityClass = 'primary';
                                                let actionText = activity.typeLabel || 'Activité';

                                                if (activity.typeActivite === 'RECIPE_COOKED') {
                                                    icon = <ChefHat className="icon" />;
                                                    activityClass = 'primary';
                                                } else if (activity.typeActivite === 'RECIPE_FAVORITED') {
                                                    icon = <Heart className="icon" />;
                                                    activityClass = 'favorite';
                                                } else if (activity.typeActivite === 'RECIPE_CREATED') {
                                                    icon = <Sparkles className="icon" />;
                                                    activityClass = 'success';
                                                } else if (activity.typeActivite === 'FEEDBACK_CREATED') {
                                                    icon = <Star className="icon" />;
                                                    activityClass = 'star';
                                                } else if (activity.typeActivite === 'PLANNER_UPDATED') {
                                                    icon = <Clock className="icon" />;
                                                    activityClass = 'info';
                                                }

                                                return (
                                                    <div key={activity.id || index} className="activity-item">
                                                        <div className={`activity-icon ${activityClass}`}>
                                                            {icon}
                                                        </div>

                                                        <div className="activity-content">
                                                            <div className="activity-text">
                                                                {actionText}
                                                                {activity.recetteTitre && ` : "${activity.recetteTitre}"`}
                                                                {activity.details && ` - ${activity.details}`}
                                                            </div>
                                                            <div className="activity-date">{activity.formattedDate}</div>
                                                        </div>

                                                        {activity.note && (
                                                            <div className="activity-rating">
                                                                <Star className="icon-xs star-filled" />
                                                                <span>{activity.note}/5</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Validation Tab (Admin only) */}
                    {isAdmin && activeTab === 'validation' && (
                        <div className="tab-content">
                            {/* Sous-onglets admin */}
                            <div className="sub-tabs">
                                <button
                                    className={`sub-tab ${activeValidationTab === 'en_attente' ? 'active' : ''}`}
                                    onClick={() => setActiveValidationTab('en_attente')}
                                >
                                    En attente ({pendingRecipes.length})
                                </button>
                                <button
                                    className={`sub-tab ${activeValidationTab === 'validees' ? 'active' : ''}`}
                                    onClick={() => setActiveValidationTab('validees')}
                                >
                                    Validées ({validatedRecipes.length})
                                </button>
                                <button
                                    className={`sub-tab ${activeValidationTab === 'rejetees' ? 'active' : ''}`}
                                    onClick={() => setActiveValidationTab('rejetees')}
                                >
                                    Rejetées ({rejectedRecipes.length})
                                </button>
                            </div>

                            {/* Alertes communes */}
                            {validationSuccess && (
                                <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
                                    <Check className="icon-sm" />
                                    <span>{validationSuccess}</span>
                                </div>
                            )}
                            {validationError && (
                                <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                                    <AlertCircle className="icon-sm" />
                                    <span>{validationError}</span>
                                </div>
                            )}

                            {/* Contenu EN_ATTENTE */}
                            {activeValidationTab === 'en_attente' && (
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">
                                        <AlertCircle className="icon-sm" style={{ marginRight: '0.5rem' }} />
                                        Recettes en attente de validation
                                    </h3>
                                    <p className="card-subtitle">
                                        {pendingRecipes.length} recette{pendingRecipes.length > 1 ? 's' : ''} à valider
                                    </p>
                                </div>
                                <div className="card-content">
                                    {loading ? (
                                        <div className="loading-state">
                                            <div className="loading-spinner"></div>
                                            <p>Chargement...</p>
                                        </div>
                                    ) : pendingRecipes.length === 0 ? (
                                        <div className="empty-state">
                                            <Check className="empty-icon" />
                                            <p className="empty-title">Aucune recette en attente</p>
                                            <p className="empty-desc">Toutes les recettes ont été traitées</p>
                                        </div>
                                    ) : (
                                        <div className="recipes-pending-list">
                                            {pendingRecipes.map((recipe) => (
                                                <div key={recipe.id} className="pending-recipe-card">
                                                    <div className="pending-recipe-image">
                                                        <img 
                                                            src={recipe.imageUrl || RECIPE_PLACEHOLDER_URL} 
                                                            alt={recipe.titre}
                                                            onError={handleImgError}
                                                        />
                                                    </div>
                                                    <div className="pending-recipe-content">
                                                        <h4 className="pending-recipe-title">{recipe.titre}</h4>
                                                        <p className="pending-recipe-desc">
                                                            {recipe.description || 'Aucune description'}
                                                        </p>
                                                        <div className="pending-recipe-meta">
                                                            <span className="meta-item">
                                                                <Clock className="icon-xs" />
                                                                {recipe.tempsTotal} min
                                                            </span>
                                                            <span className="meta-item">
                                                                <Sparkles className="icon-xs" />
                                                                {recipe.difficulte}
                                                            </span>
                                                            <span className="meta-item">
                                                                <Flame className="icon-xs" />
                                                                {recipe.kcal} kcal
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="pending-recipe-actions">
                                                        <Link
                                                            to={`/recette/${recipe.id}`}
                                                            className="btn btn-outline btn-sm"
                                                        >
                                                            Voir détails
                                                        </Link>
                                                        <button
                                                            className="btn btn-success btn-sm"
                                                            onClick={() => handleValidateRecipe(recipe.id)}
                                                            disabled={validationLoading}
                                                            style={{ color: 'white' }}
                                                        >
                                                            <Check className="icon-xs" />
                                                            Valider
                                                        </button>
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => handleRejectRecipe(recipe.id)}
                                                            disabled={validationLoading}
                                                            style={{ color: 'white' }}
                                                        >
                                                            <X className="icon-xs" />
                                                            Rejeter
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            )}

                            {/* Contenu VALIDEES */}
                            {activeValidationTab === 'validees' && (
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">Recettes validées</h3>
                                    </div>
                                    <div className="card-content">
                                        {loading ? (
                                            <div className="loading-state"><div className="loading-spinner"></div><p>Chargement...</p></div>
                                        ) : validatedRecipes.length === 0 ? (
                                            <div className="empty-state"><p className="empty-title">Aucune recette validée</p></div>
                                        ) : (
                                            <div className="recipes-pending-list">
                                                {validatedRecipes.map((recipe) => (
                                                    <div key={recipe.id} className="pending-recipe-card">
                                                        <div className="pending-recipe-image">
                                                            <img 
                                                                src={recipe.imageUrl || RECIPE_PLACEHOLDER_URL} 
                                                                alt={recipe.titre}
                                                                onError={handleImgError}
                                                            />
                                                        </div>
                                                        <div className="pending-recipe-content">
                                                            <h4 className="pending-recipe-title">{recipe.titre}</h4>
                                                            <p className="pending-recipe-desc">{recipe.description || 'Aucune description'}</p>
                                                            <span className="badge badge-success">✅ Validée</span>
                                                        </div>
                                                        <div className="pending-recipe-actions">
                                                            <Link to={`/recette/${recipe.id}`} className="btn btn-outline btn-sm">Voir détails</Link>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Contenu REJETEES */}
                            {activeValidationTab === 'rejetees' && (
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">Recettes rejetées</h3>
                                    </div>
                                    <div className="card-content">
                                        {loading ? (
                                            <div className="loading-state"><div className="loading-spinner"></div><p>Chargement...</p></div>
                                        ) : rejectedRecipes.length === 0 ? (
                                            <div className="empty-state"><p className="empty-title">Aucune recette rejetée</p></div>
                                        ) : (
                                            <div className="recipes-pending-list">
                                                {rejectedRecipes.map((recipe) => (
                                                    <div key={recipe.id} className="pending-recipe-card">
                                                        <div className="pending-recipe-image">
                                                            <img 
                                                                src={recipe.imageUrl || RECIPE_PLACEHOLDER_URL} 
                                                                alt={recipe.titre}
                                                                onError={handleImgError}
                                                            />
                                                        </div>
                                                        <div className="pending-recipe-content">
                                                            <h4 className="pending-recipe-title">{recipe.titre}</h4>
                                                            <p className="pending-recipe-desc">{recipe.description || 'Aucune description'}</p>
                                                            <span className="badge badge-danger">❌ Rejetée</span>
                                                            {recipe.motifRejet && (
                                                                <p className="reject-reason"><strong>Motif:</strong> {recipe.motifRejet}</p>
                                                            )}
                                                        </div>
                                                        <div className="pending-recipe-actions">
                                                            <Link to={`/recette/${recipe.id}`} className="btn btn-outline btn-sm">Voir détails</Link>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mes recettes (User normal) */}
                    {!isAdmin && activeTab === 'mes_recettes' && (
                        <div className="tab-content">
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">
                                        <ChefHat className="icon-sm" style={{ marginRight: '0.5rem' }} />
                                        Mes recettes proposées
                                    </h3>
                                </div>
                                <div className="card-content">
                                    {loading ? (
                                        <div className="loading-state"><div className="loading-spinner"></div><p>Chargement...</p></div>
                                    ) : myRecipes.length === 0 ? (
                                        <div className="empty-state">
                                            <p className="empty-title">Vous n'avez pas encore proposé de recette</p>
                                            <Link to="/recette/nouvelle" className="btn btn-primary">Créer une recette</Link>
                                        </div>
                                    ) : (
                                        <div className="recipes-pending-list">
                                            {myRecipes.map((recipe) => (
                                                <div key={recipe.id} className="pending-recipe-card">
                                                    <div className="pending-recipe-image">
                                                        <img 
                                                            src={recipe.imageUrl || RECIPE_PLACEHOLDER_URL} 
                                                            alt={recipe.titre}
                                                            onError={handleImgError}
                                                        />
                                                    </div>
                                                    <div className="pending-recipe-content">
                                                        <h4 className="pending-recipe-title">{recipe.titre}</h4>
                                                        <p className="pending-recipe-desc">{recipe.description || 'Aucune description'}</p>
                                                        {recipe.statut === 'EN_ATTENTE' && <span className="badge badge-warning">⏳ En attente de validation</span>}
                                                        {recipe.statut === 'VALIDEE' && <span className="badge badge-success">✅ Validée</span>}
                                                        {recipe.statut === 'REJETEE' && (
                                                            <>
                                                                <span className="badge badge-danger">❌ Rejetée</span>
                                                                {recipe.motifRejet && <p className="reject-reason"><strong>Motif:</strong> {recipe.motifRejet}</p>}
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="pending-recipe-actions">
                                                        <Link to={`/recette/${recipe.id}`} className="btn btn-outline btn-sm">Voir détails</Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rejection Modal */}
                    {showRejectModal && (
                        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3>Rejeter la recette</h3>
                                    <button 
                                        className="modal-close"
                                        onClick={() => setShowRejectModal(false)}
                                    >
                                        <X className="icon-sm" />
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <p style={{ marginBottom: '1rem', color: '#64748b' }}>
                                        Veuillez fournir un motif de rejet pour informer l'auteur :
                                    </p>
                                    <textarea
                                        className="form-input"
                                        value={rejectMotif}
                                        onChange={(e) => setRejectMotif(e.target.value)}
                                        placeholder="Ex: La recette manque d'ingrédients détaillés..."
                                        rows="4"
                                        style={{ width: '100%', resize: 'vertical' }}
                                    />
                                </div>
                                <div className="modal-footer">
                                    <button 
                                        className="btn btn-outline"
                                        onClick={() => setShowRejectModal(false)}
                                    >
                                        Annuler
                                    </button>
                                    <button 
                                        className="btn btn-danger"
                                        onClick={confirmRejectRecipe}
                                        disabled={validationLoading}
                                        style={{ color: 'white' }}
                                    >
                                        {validationLoading ? 'Rejet...' : 'Confirmer le rejet'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Validation Modal */}
                    {showValidateModal && (
                        <div className="modal-overlay" onClick={() => setShowValidateModal(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3>Valider la recette</h3>
                                    <button 
                                        className="modal-close"
                                        onClick={() => setShowValidateModal(false)}
                                    >
                                        <X className="icon-sm" />
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <p style={{ marginBottom: '1rem', color: '#64748b' }}>
                                        Êtes-vous sûr de vouloir valider cette recette ?
                                    </p>
                                    <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                                        Elle sera visible par tous les utilisateurs dans l'accueil et les suggestions.
                                    </p>
                                </div>
                                <div className="modal-footer">
                                    <button 
                                        className="btn btn-outline"
                                        onClick={() => setShowValidateModal(false)}
                                    >
                                        Annuler
                                    </button>
                                    <button 
                                        className="btn btn-success"
                                        onClick={confirmValidateRecipe}
                                        disabled={validationLoading}
                                        style={{ color: 'white' }}
                                    >
                                        {validationLoading ? 'Validation...' : 'Confirmer la validation'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="tab-content">
                            <div className="settings-grid">
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">Notifications</h3>
                                    </div>
                                    <div className="card-content">
                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div className="setting-title">Nouvelles recettes</div>
                                                <div className="setting-desc">Recevoir des suggestions personnalisées</div>
                                            </div>
                                            <button className="btn btn-outline btn-sm">Activé</button>
                                        </div>

                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div className="setting-title">Rappels de cuisine</div>
                                                <div className="setting-desc">Notifications pour vos recettes planifiées</div>
                                            </div>
                                            <button className="btn btn-outline btn-sm">Activé</button>
                                        </div>

                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div className="setting-title">Newsletter</div>
                                                <div className="setting-desc">Conseils et astuces culinaires</div>
                                            </div>
                                            <button className="btn btn-outline btn-sm">Désactivé</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">Confidentialité</h3>
                                    </div>
                                    <div className="card-content">
                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div className="setting-title">Profil public</div>
                                                <div className="setting-desc">Permettre aux autres de voir votre profil</div>
                                            </div>
                                            <button className="btn btn-outline btn-sm">Privé</button>
                                        </div>

                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div className="setting-title">Partage des recettes</div>
                                                <div className="setting-desc">Partager vos créations avec la communauté</div>
                                            </div>
                                            <button className="btn btn-outline btn-sm">Activé</button>
                                        </div>

                                        <div className="setting-actions">
                                            <button className="btn btn-danger btn-full">
                                                Supprimer mon compte
                                            </button>
                                            <button className="btn btn-outline btn-full">
                                                Exporter mes données
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}