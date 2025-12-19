import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/api/auth.service';
import {
    User, Mail, Phone, MapPin, Camera, Settings, Heart,
    Clock, ChefHat, Trophy, Star, Save, Edit
} from 'lucide-react';
import './AccountPage.css';

export default function AccountPage() {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
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

    const recentActivity = [
        { type: "cooked", recipe: "Risotto aux champignons", date: "Il y a 2 jours", rating: 5 },
        { type: "favorited", recipe: "Salade de quinoa colorée", date: "Il y a 3 jours" },
        { type: "cooked", recipe: "Curry de légumes épicé", date: "Il y a 1 semaine", rating: 4 },
        { type: "favorited", recipe: "Saumon grillé aux herbes", date: "Il y a 1 semaine" },
    ];

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
            // Appel API pour mettre à jour l'utilisateur
            const updatedUser = await authService.updateUser(user.id, formData);
            updateUser(updatedUser);
            setIsEditing(false);
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            alert('Erreur lors de la mise à jour du profil');
        } finally {
            setLoading(false);
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
                                    <h3 className="card-title">Activité récente</h3>
                                </div>
                                <div className="card-content">
                                    <div className="activity-list">
                                        {recentActivity.map((activity, index) => (
                                            <div key={index} className="activity-item">
                                                <div className={`activity-icon ${activity.type === 'cooked' ? 'primary' : 'favorite'}`}>
                                                    {activity.type === 'cooked' ? (
                                                        <ChefHat className="icon" />
                                                    ) : (
                                                        <Heart className="icon" />
                                                    )}
                                                </div>

                                                <div className="activity-content">
                                                    <div className="activity-text">
                                                        {activity.type === 'cooked' ? 'A cuisiné' : 'A ajouté aux favoris'} "{activity.recipe}"
                                                    </div>
                                                    <div className="activity-date">{activity.date}</div>
                                                </div>

                                                {activity.rating && (
                                                    <div className="activity-rating">
                                                        <Star className="icon-xs star-filled" />
                                                        <span>{activity.rating}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
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