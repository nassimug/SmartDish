import {
    AlertCircle,
    Camera,
    Check,
    ChefHat,
    Clock,
    Eye,
    EyeOff,
    Flame,
    Lock,
    Mail,
    Save,
    Sparkles,
    Star,
    Trophy,
    User,
    X
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PreferencesModal from '../../components/PreferencesModal/PreferencesModal';
import authService from '../../services/api/auth.service';
import preferencesService from '../../services/api/preferences.service';
import recipesService from '../../services/api/recipe.service';
import { RECIPE_PLACEHOLDER_URL } from '../../utils/RecipePlaceholder';
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

    // États pour les préférences alimentaires
    const [allRegimes, setAllRegimes] = useState([]);
    const [allAllergenes, setAllAllergenes] = useState([]);
    const [allTypesCuisine, setAllTypesCuisine] = useState([]);
    const [userPreferences, setUserPreferences] = useState({
        regimesIds: [],
        allergenesIds: [],
        typesCuisinePreferesIds: []
    });
    const [showPreferencesModal, setShowPreferencesModal] = useState(false);
    const [currentModalType, setCurrentModalType] = useState(null);
    const [preferencesLoading, setPreferencesLoading] = useState(false);

    // États pour la modification du mot de passe
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

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

    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: ''
    });

    // Données fictives pour les stats
    const stats = {
        recipesCooked: 47,
        favoriteRecipes: 23,
        totalCookingTime: "18h 30min",
        averageRating: 4.6,
    };

    // Charger les données de référence au montage
    useEffect(() => {
        loadReferenceData();
    }, []);

    const loadReferenceData = async () => {
        try {
            const [regimes, allergenes, cuisines] = await Promise.all([
                preferencesService.getAllRegimes(),
                preferencesService.getAllAllergenes(),
                preferencesService.getAllTypesCuisine()
            ]);

            setAllRegimes(regimes);
            setAllAllergenes(allergenes);
            setAllTypesCuisine(cuisines);
        } catch (error) {
            console.error('❌ Erreur chargement données de référence:', error);
        }
    };

    // Charger les préférences de l'utilisateur
    useEffect(() => {
        if (user) {
            setUserPreferences({
                regimesIds: user.regimesIds || [],
                allergenesIds: user.allergenesIds || [],
                typesCuisinePreferesIds: user.typesCuisinePreferesIds || []
            });
        }
    }, [user]);

    // Handlers pour les préférences
    const openPreferencesModal = (type) => {
        setCurrentModalType(type);
        setShowPreferencesModal(true);
    };

    const handleSavePreferences = async (selectedIds) => {
        try {
            setPreferencesLoading(true);

            const updateData = {
                ...userPreferences,
                [`${currentModalType}Ids`]: selectedIds
            };

            await authService.updatePreferences(user.id, updateData);

            // Mettre à jour l'état local
            setUserPreferences(updateData);

            // Mettre à jour le contexte utilisateur
            updateUser({
                ...user,
                ...updateData
            });

            setShowPreferencesModal(false);
            alert('✅ Préférences mises à jour avec succès !');
        } catch (error) {
            console.error('❌ Erreur sauvegarde préférences:', error);
            alert('❌ Erreur: ' + error.message);
        } finally {
            setPreferencesLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            setFormData({
                nom: user.nom || '',
                prenom: user.prenom || '',
                email: user.email || ''
            });
        }
    }, [user]);

    // Charger toutes les listes pour les admins
    useEffect(() => {
        if (isAdmin) {
            loadValidationLists();
        }
    }, [isAdmin]);

    const enrichRecipesWithImages = async (recipes) => {
        if (!recipes || recipes.length === 0) return recipes;

        try {
            const enrichedRecipes = await Promise.all(
                recipes.map(async (recipe) => {
                    try {
                        const images = await recipesService.getImages(recipe.id);
                        if (images && images.length > 0) {
                            const firstImage = images[0];
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
            console.error('❌ Erreur chargement listes validation:', error);
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
            const recipes = await recipesService.getRecettesByUtilisateur(user.id);
            const enrichedRecipes = await enrichRecipesWithImages(recipes);
            setMyRecipes(enrichedRecipes || []);
        } catch (error) {
            console.error('❌ Erreur chargement mes recettes:', error);
            setMyRecipes([]);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (isAdmin) {
            loadValidationLists();
        }
    }, [isAdmin, loadValidationLists]);

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

    useEffect(() => {
        const handleFocus = () => {
            if (!isAdmin && activeTab === 'mes_recettes' && user?.id) {
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
        try {
            setLoading(true);

            // Préparer les données à envoyer
            const updateData = {
                nom: formData.nom,
                prenom: formData.prenom,
                email: formData.email
            };

            console.log('📝 Mise à jour du profil:', updateData);

            // Appeler le service pour mettre à jour
            const updatedUser = await authService.updateUser(user.id, updateData);

            // Mettre à jour le contexte utilisateur
            updateUser(updatedUser);

            // Désactiver le mode édition
            setIsEditing(false);

            alert('✅ Profil mis à jour avec succès !');
        } catch (error) {
            console.error('❌ Erreur mise à jour profil:', error);
            alert('❌ Erreur: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
        setPasswordError('');
    };

    const handlePasswordSubmit = async () => {
        // Validation
        if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setPasswordError('Tous les champs sont obligatoires');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('Les nouveaux mots de passe ne correspondent pas');
            return;
        }

        if (passwordData.oldPassword === passwordData.newPassword) {
            setPasswordError('Le nouveau mot de passe doit être différent de l\'ancien');
            return;
        }

        try {
            setLoading(true);
            setPasswordError('');

            // Appel API pour changer le mot de passe
            await authService.changePassword(
                user.id,
                passwordData.oldPassword,
                passwordData.newPassword
            );

            setPasswordSuccess('✅ Mot de passe modifié avec succès !');

            // Fermer le modal après 2 secondes
            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordSuccess('');
            }, 2000);
        } catch (error) {
            console.error('❌ Erreur modification mot de passe:', error);
            setPasswordError(error.message || 'Erreur lors de la modification du mot de passe');
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
            await recipesService.validerRecette(validateRecipeId);

            window.dispatchEvent(new Event('reloadNotifications'));

            setValidationSuccess('Recette validée avec succès !');
            setShowValidateModal(false);
            setValidateRecipeId(null);

            setPendingRecipes((prev) => prev.filter((r) => r.id !== validateRecipeId));
            if (recipe) {
                setValidatedRecipes((prev) => [{ ...recipe, statut: 'VALIDEE' }, ...prev]);
            }

            setTimeout(() => {
                loadValidationLists();
            }, 1500);

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
            await recipesService.rejeterRecette(rejectRecipeId, rejectMotif.trim());

            window.dispatchEvent(new Event('reloadNotifications'));

            setValidationSuccess('Recette rejetée');
            setShowRejectModal(false);
            setRejectRecipeId(null);
            setRejectMotif('');

            setPendingRecipes((prev) => prev.filter((r) => r.id !== rejectRecipeId));
            if (recipe) {
                setRejectedRecipes((prev) => [{ ...recipe, statut: 'REJETEE' }, ...prev]);
            }

            setTimeout(() => {
                loadValidationLists();
            }, 1500);

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
                            <User className="icon-xs" />
                            Profil
                        </button>
                        <button
                            className={`tab-trigger ${activeTab === 'preferences' ? 'active' : ''}`}
                            onClick={() => setActiveTab('preferences')}
                        >
                            <Star className="icon-xs" />
                            Préférences
                        </button>
                        {!isAdmin && (
                            <button
                                className={`tab-trigger ${activeTab === 'mes_recettes' ? 'active' : ''}`}
                                onClick={() => setActiveTab('mes_recettes')}
                            >
                                <ChefHat className="icon-xs" />
                                Mes recettes
                            </button>
                        )}
                        {isAdmin && (
                            <button
                                className={`tab-trigger ${activeTab === 'validation' ? 'active' : ''}`}
                                onClick={() => setActiveTab('validation')}
                            >
                                <AlertCircle className="icon-xs" />
                                Validation ({pendingRecipes.length})
                            </button>
                        )}
                        <button
                            className={`tab-trigger ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            <Lock className="icon-xs" />
                            Sécurité
                        </button>
                    </div>

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="tab-content">
                            <div className="profile-grid-new">
                                {/* Profile Card */}
                                <div className="card profile-card-new">
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
                                                    <User className="icon-sm" />
                                                    Modifier
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="card-content">
                                        {/* Avatar */}
                                        <div className="avatar-section-new">
                                            <div className="avatar-wrapper">
                                                <div className="avatar-large">
                                                    <span className="avatar-fallback">{getInitials()}</span>
                                                </div>
                                                {isEditing && (
                                                    <button className="avatar-edit-btn">
                                                        <Camera className="icon-sm" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="user-info-section">
                                                <h3 className="user-name-large">
                                                    {user?.prenom} {user?.nom}
                                                </h3>
                                                <p className="user-email">{user?.email}</p>
                                            </div>
                                        </div>

                                        {/* Form Fields */}
                                        <div className="form-grid-new">
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

                                            <div className="form-group form-group-full">
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
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Card */}
                                <div className="card stats-card-new">
                                    <div className="card-header">
                                        <h3 className="card-title">
                                            <Trophy className="icon-sm text-primary" />
                                            Mes statistiques
                                        </h3>
                                    </div>

                                    <div className="card-content">
                                        <div className="stats-grid-new">
                                            <div className="stat-card">
                                                <div className="stat-icon primary">
                                                    <ChefHat />
                                                </div>
                                                <div className="stat-value">{stats.recipesCooked}</div>
                                                <div className="stat-label">Recettes cuisinées</div>
                                            </div>

                                            <div className="stat-card">
                                                <div className="stat-icon favorite">
                                                    <Star />
                                                </div>
                                                <div className="stat-value">{stats.favoriteRecipes}</div>
                                                <div className="stat-label">Favoris</div>
                                            </div>

                                            <div className="stat-card">
                                                <div className="stat-icon success">
                                                    <Trophy />
                                                </div>
                                                <div className="stat-value">{stats.averageRating}</div>
                                                <div className="stat-label">Note moyenne</div>
                                            </div>

                                            <div className="stat-card">
                                                <div className="stat-icon info">
                                                    <Clock />
                                                </div>
                                                <div className="stat-value-small">{stats.totalCookingTime}</div>
                                                <div className="stat-label">Temps total</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* CTA Créer une recette */}
                                <div className="create-recipe-cta-new">
                                    <div className="cta-icon-bg">
                                        <ChefHat className="icon-lg" />
                                    </div>
                                    <div className="cta-content-new">
                                        <h3 className="cta-title">Proposer une recette</h3>
                                        <p className="cta-desc">Partagez votre recette avec la communauté ! Elle sera validée par l'équipe admin avant publication.</p>
                                        <Link to="/recette/nouvelle" className="cta-btn-new">
                                            <Sparkles className="icon-sm" />
                                            Créer ma recette
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preferences Tab */}
                    {activeTab === 'preferences' && (
                        <div className="tab-content">
                            <div className="preferences-grid-new">
                                <div className="card preferences-card-new">
                                    <div className="card-header">
                                        <h3 className="card-title">
                                            <Star className="icon-sm" />
                                            Préférences alimentaires
                                        </h3>
                                        <p className="card-description">Personnalisez vos préférences pour recevoir des suggestions adaptées</p>
                                    </div>
                                    <div className="card-content">
                                        {/* Régimes alimentaires */}
                                        <div className="preference-section-new">
                                            <div className="preference-header">
                                                <label className="preference-label">Régime alimentaire</label>
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    onClick={() => openPreferencesModal('regimes')}
                                                >
                                                    {userPreferences.regimesIds?.length > 0 ? 'Modifier' : '+ Ajouter'}
                                                </button>
                                            </div>
                                            <div className="badge-list">
                                                {userPreferences.regimesIds?.length > 0 ? (
                                                    userPreferences.regimesIds.map((regimeId) => {
                                                        const regime = allRegimes.find(r => r.id === regimeId);
                                                        return regime ? (
                                                            <span key={regimeId} className="badge badge-primary">
                                                                {regime.nom}
                                                            </span>
                                                        ) : null;
                                                    })
                                                ) : (
                                                    <span className="text-muted">Aucun régime sélectionné</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Allergies */}
                                        <div className="preference-section-new">
                                            <div className="preference-header">
                                                <label className="preference-label">Allergies et intolérances</label>
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    onClick={() => openPreferencesModal('allergenes')}
                                                >
                                                    {userPreferences.allergenesIds?.length > 0 ? 'Modifier' : '+ Ajouter'}
                                                </button>
                                            </div>
                                            <div className="badge-list">
                                                {userPreferences.allergenesIds?.length > 0 ? (
                                                    userPreferences.allergenesIds.map((allergeneId) => {
                                                        const allergene = allAllergenes.find(a => a.id === allergeneId);
                                                        return allergene ? (
                                                            <span key={allergeneId} className="badge badge-danger">
                                                                {allergene.nom}
                                                            </span>
                                                        ) : null;
                                                    })
                                                ) : (
                                                    <span className="text-muted">Aucune allergie déclarée</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Types de cuisine */}
                                        <div className="preference-section-new">
                                            <div className="preference-header">
                                                <label className="preference-label">Types de cuisine préférés</label>
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    onClick={() => openPreferencesModal('typesCuisinePreferes')}
                                                >
                                                    {userPreferences.typesCuisinePreferesIds?.length > 0 ? 'Modifier' : '+ Ajouter'}
                                                </button>
                                            </div>
                                            <div className="badge-list">
                                                {userPreferences.typesCuisinePreferesIds?.length > 0 ? (
                                                    userPreferences.typesCuisinePreferesIds.map((cuisineId) => {
                                                        const cuisine = allTypesCuisine.find(c => c.id === cuisineId);
                                                        return cuisine ? (
                                                            <span key={cuisineId} className="badge badge-secondary">
                                                                {cuisine.nom}
                                                            </span>
                                                        ) : null;
                                                    })
                                                ) : (
                                                    <span className="text-muted">Aucune préférence culinaire</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Validation Tab (Admin only) */}
                    {isAdmin && activeTab === 'validation' && (
                        <div className="tab-content">
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

                    {/* Settings Tab - Sécurité */}
                    {activeTab === 'settings' && (
                        <div className="tab-content">
                            <div className="settings-grid-new">
                                <div className="card security-card">
                                    <div className="card-header">
                                        <h3 className="card-title">
                                            <Lock className="icon-sm" />
                                            Sécurité du compte
                                        </h3>
                                        <p className="card-description">Gérez la sécurité de votre compte</p>
                                    </div>
                                    <div className="card-content">
                                        <div className="security-section">
                                            <div className="security-item">
                                                <div className="security-icon">
                                                    <Lock />
                                                </div>
                                                <div className="security-info">
                                                    <h4 className="security-title">Mot de passe</h4>
                                                    <p className="security-desc">Modifiez votre mot de passe régulièrement pour plus de sécurité</p>
                                                </div>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => setShowPasswordModal(true)}
                                                >
                                                    Modifier
                                                </button>
                                            </div>
                                        </div>

                                        <div className="danger-zone">
                                            <h4 className="danger-title">Zone dangereuse</h4>
                                            <p className="danger-desc">Cette action est irréversible</p>
                                            <button className="btn btn-danger btn-full">
                                                <AlertCircle className="icon-sm" />
                                                Supprimer mon compte
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

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

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
                    <div className="modal-content password-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                <Lock className="icon-sm" />
                                Modifier le mot de passe
                            </h3>
                            <button
                                className="modal-close"
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                                    setPasswordError('');
                                    setPasswordSuccess('');
                                }}
                            >
                                <X className="icon-sm" />
                            </button>
                        </div>
                        <div className="modal-body">
                            {passwordSuccess && (
                                <div className="alert alert-success">
                                    <Check className="icon-sm" />
                                    <span>{passwordSuccess}</span>
                                </div>
                            )}
                            {passwordError && (
                                <div className="alert alert-error">
                                    <AlertCircle className="icon-sm" />
                                    <span>{passwordError}</span>
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="oldPassword" className="form-label">Mot de passe actuel *</label>
                                <div className="input-wrapper">
                                    <Lock className="input-icon" />
                                    <input
                                        type={showOldPassword ? "text" : "password"}
                                        id="oldPassword"
                                        name="oldPassword"
                                        value={passwordData.oldPassword}
                                        onChange={handlePasswordChange}
                                        className="form-input"
                                        placeholder="Entrez votre mot de passe actuel"
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowOldPassword(!showOldPassword)}
                                    >
                                        {showOldPassword ? <EyeOff className="icon-sm" /> : <Eye className="icon-sm" />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="newPassword" className="form-label">Nouveau mot de passe *</label>
                                <div className="input-wrapper">
                                    <Lock className="input-icon" />
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        id="newPassword"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        className="form-input"
                                        placeholder="Minimum 8 caractères"
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? <EyeOff className="icon-sm" /> : <Eye className="icon-sm" />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword" className="form-label">Confirmer le nouveau mot de passe *</label>
                                <div className="input-wrapper">
                                    <Lock className="input-icon" />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        className="form-input"
                                        placeholder="Confirmez votre nouveau mot de passe"
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff className="icon-sm" /> : <Eye className="icon-sm" />}
                                    </button>
                                </div>
                            </div>

                            <div className="password-requirements">
                                <p className="requirements-title">Le mot de passe doit contenir :</p>
                                <ul className="requirements-list">
                                    <li className={passwordData.newPassword.length >= 8 ? 'valid' : ''}>
                                        {passwordData.newPassword.length >= 8 ? '✓' : '○'} Au moins 8 caractères
                                    </li>
                                    <li className={/[A-Z]/.test(passwordData.newPassword) ? 'valid' : ''}>
                                        {/[A-Z]/.test(passwordData.newPassword) ? '✓' : '○'} Une lettre majuscule
                                    </li>
                                    <li className={/[a-z]/.test(passwordData.newPassword) ? 'valid' : ''}>
                                        {/[a-z]/.test(passwordData.newPassword) ? '✓' : '○'} Une lettre minuscule
                                    </li>
                                    <li className={/[0-9]/.test(passwordData.newPassword) ? 'valid' : ''}>
                                        {/[0-9]/.test(passwordData.newPassword) ? '✓' : '○'} Un chiffre
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-outline"
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                                    setPasswordError('');
                                    setPasswordSuccess('');
                                }}
                            >
                                Annuler
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handlePasswordSubmit}
                                disabled={loading}
                            >
                                {loading ? 'Modification...' : 'Modifier le mot de passe'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de sélection des préférences */}
            <PreferencesModal
                isOpen={showPreferencesModal}
                onClose={() => setShowPreferencesModal(false)}
                type={currentModalType}
                title={
                    currentModalType === 'regimes' ? 'Sélectionner vos régimes alimentaires' :
                        currentModalType === 'allergenes' ? 'Sélectionner vos allergènes' :
                            'Sélectionner vos types de cuisine préférés'
                }
                availableItems={
                    currentModalType === 'regimes' ? allRegimes :
                        currentModalType === 'allergenes' ? allAllergenes :
                            allTypesCuisine
                }
                selectedIds={userPreferences[`${currentModalType}Ids`] || []}
                onSave={handleSavePreferences}
                loading={preferencesLoading}
            />
        </div>
    );
}