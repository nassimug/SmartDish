import { Award, BookOpen, ChefHat, Clock, Heart, Search, Sparkles, Star, TrendingUp, Users, Utensils, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import recipesService from '../../services/api/recipe.service';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import { RECIPE_PLACEHOLDER_URL } from '../../utils/RecipePlaceholder';
import './HomePage.css';
import heroVideo from "../../videos/accueil.mp4"
import logo from '../../images/logo.png';

export default function HomePage() {
    const [trendingRecipes, setTrendingRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadTrendingRecipes = async () => {
            try {
                setLoading(true);
                setError(null);

                // Récupérer TOUTES les recettes pour éviter les problèmes de filtrage backend
                const allRecipes = await recipesService.getAllRecettes();
                // Inclure toutes les recettes VALIDEE, sauf si explicitement actives=false (certaines n'ont pas le flag)
                const validatedOnly = allRecipes
                    .filter(r => r.statut === 'VALIDEE' && r.actif !== false)
                    // Trier d'abord par date récente, puis par popularité
                    .sort((a, b) => {
                        const dateA = new Date(a.dateCreation || 0);
                        const dateB = new Date(b.dateCreation || 0);
                        if (dateA.getTime() !== dateB.getTime()) return dateB - dateA;
                        return (b.nombreFeedbacks || 0) - (a.nombreFeedbacks || 0);
                    })
                    .slice(0, 6);

                const recipesWithDetails = await Promise.all(
                    validatedOnly.map(async (recipe) => {
                        try {
                            // Enrichir avec feedbacks pour avoir la vraie moyenne
                            const enriched = await recipesService.enrichWithFeedbacks(recipe);
                            
                            let note = enriched.note || 0;
                            let nombreAvis = enriched.nombreAvis || 0;

                            // Tenter de récupérer une URL d'image (directUrl > presigned > fallback)
                            let primaryImageUrl = recipe.imageUrl ? normalizeImageUrl(recipe.imageUrl) : null;
                            console.log('[Home] Base imageUrl from recipe', recipe.id, recipe.imageUrl);
                            try {
                                const imgs = await recipesService.getImages(recipe.id);
                                if (imgs && imgs.length > 0) {
                                    // Préférence: directUrl (MinIO public) > stream > presigned > fallback
                                    const best = imgs[0].directUrl || imgs[0].urlStream || imgs[0].urlTelechargement || imgs[0].url;
                                    if (best) {
                                        primaryImageUrl = normalizeImageUrl(best);
                                        console.log('[Home] Using images[0] for recipe', recipe.id, primaryImageUrl);
                                    }
                                }
                            } catch (e) {
                                console.warn('[Home] getImages failed for recipe', recipe.id, e);
                            }

                            if (!primaryImageUrl) {
                                primaryImageUrl = RECIPE_PLACEHOLDER_URL;
                                console.warn('[Home] Fallback placeholder for recipe', recipe.id);
                            }

                            const card = {
                                id: recipe.id,
                                titre: recipe.titre || 'Recette sans titre',
                                tempsPreparation: recipe.tempsTotal || 30,
                                note: note,
                                nombreAvis: nombreAvis,
                                imageUrl: primaryImageUrl || RECIPE_PLACEHOLDER_URL,
                                difficulte: recipe.difficulte || 'FACILE',
                                kcal: recipe.kcal || 0
                            };
                            console.log('[Home] Card built', card);
                            return card;
                        } catch (err) {
                            console.error(`Erreur pour la recette ${recipe.id}:`, err);
                            return {
                                id: recipe.id,
                                titre: recipe.titre || 'Recette sans titre',
                                tempsPreparation: recipe.tempsTotal || 30,
                                note: 0,
                                nombreAvis: 0,
                                imageUrl: (recipe.imageUrl && normalizeImageUrl(recipe.imageUrl)) || RECIPE_PLACEHOLDER_URL,
                                difficulte: recipe.difficulte || 'FACILE',
                                kcal: recipe.kcal || 0
                            };
                        }
                    })
                );

                setTrendingRecipes(recipesWithDetails);
            } catch (error) {
                console.error('Erreur lors du chargement:', error);
                setError(error.message);
                setTrendingRecipes([]);
            } finally {
                setLoading(false);
            }
        };

        loadTrendingRecipes();
    }, []);

    return (
        <div className="home-page-new">
            {/* Hero Section - Design moderne avec gradient animé */}
            <section className="hero-modern">
                <div className="hero-gradient-bg"></div>
                <video autoPlay muted loop playsInline className="hero-video-bg">
                    <source src={heroVideo} type="video/mp4" />
                </video>
                <div className="hero-video-overlay"></div>
                {/* Fin de l'ajout vidéo */}
                <div className="hero-container">
                    <div className="hero-content-wrapper">
                        <div className="hero-badge-modern">
                            <Sparkles size={18} />
                            <span>Intelligence Artificielle Culinaire</span>
                        </div>

                        <h1 className="hero-title-modern">
                            Transformez vos ingrédients en
                            <span className="gradient-text"> chefs-d'œuvre culinaires</span>
                        </h1>

                        <p className="hero-subtitle-modern">
                            Notre IA analyse votre frigo et crée des recettes personnalisées en quelques secondes.
                            Fini le gaspillage, place à la créativité !
                        </p>

                        <div className="hero-cta-group">
                            <Link to="/ingredients" className="cta-primary">
                                <Utensils size={20} />
                                <span>Découvrir mes recettes</span>
                            </Link>
                            <Link to="/suggestions" className="cta-secondary">
                                <Search size={20} />
                                <span>Explorer les tendances</span>
                            </Link>
                        </div>

                        {/* Stats rapides */}
                        <div className="hero-stats">
                            <div className="stat-pill">
                                <Award size={16} />
                                <span><strong>10k+</strong> recettes créées</span>
                            </div>
                            <div className="stat-pill">
                                <Users size={16} />
                                <span><strong>5k+</strong> utilisateurs</span>
                            </div>
                            <div className="stat-pill">
                                <Star size={16} />
                                <span><strong>4.8/5</strong> satisfaction</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section Avantages - Design en cartes */}
            <section className="benefits-section">
                <div className="section-container">
                    <div className="benefits-grid">
                        <div className="benefit-card card-green">
                            <div className="benefit-icon">
                                <Zap size={28} />
                            </div>
                            <h3>Instantané</h3>
                            <p>Suggestions en quelques secondes grâce à notre IA ultra-rapide</p>
                        </div>

                        <div className="benefit-card card-orange">
                            <div className="benefit-icon">
                                <Heart size={28} />
                            </div>
                            <h3>Personnalisé</h3>
                            <p>Recettes adaptées à vos goûts, régimes et contraintes alimentaires</p>
                        </div>

                        <div className="benefit-card card-blue">
                            <div className="benefit-icon">
                                <BookOpen size={28} />
                            </div>
                            <h3>Éducatif</h3>
                            <p>Apprenez de nouvelles techniques et astuces de chef à chaque recette</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section Recettes Tendance - Design moderne */}
            <section className="trending-modern">
                <div className="section-container">
                    <div className="section-header-modern">
                        <div>
                            <div className="section-badge">
                                <TrendingUp size={18} />
                                <span>Tendances</span>
                            </div>
                            <h2 className="section-title-modern">Les recettes du moment</h2>
                            <p className="section-desc-modern">
                                Découvrez ce que notre communauté cuisine aujourd'hui
                            </p>
                        </div>
                        <Link to="/suggestions" className="btn-view-all">
                            Voir tout
                            <TrendingUp size={18} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner-modern"></div>
                            <p>Chargement des meilleures recettes...</p>
                        </div>
                    ) : error ? (
                        <div className="error-state">
                            <p>Une erreur est survenue lors du chargement des recettes</p>
                        </div>
                    ) : (
                        <div className="recipes-grid-modern">
                            {trendingRecipes.map((recipe) => (
                                <Link
                                    key={recipe.id}
                                    to={`/recette/${recipe.id}`}
                                    className="recipe-card-modern"
                                >
                                    <div className="recipe-image-wrapper">
                                        <img
                                            src={recipe.imageUrl || RECIPE_PLACEHOLDER_URL}
                                            alt={recipe.titre}
                                            loading="lazy"
                                            onError={(e) => {
                                                console.warn('❌ Erreur chargement image:', recipe.imageUrl);
                                                e.target.src = RECIPE_PLACEHOLDER_URL;
                                            }}
                                        />
                                        <div className="recipe-overlay">
                                            <div className="recipe-badges">
                                                <span className="badge-difficulty">{recipe.difficulte}</span>
                                                {recipe.kcal > 0 && (
                                                    <span className="badge-kcal">{recipe.kcal} kcal</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="recipe-info-modern">
                                        <h3 className="recipe-title-modern">{recipe.titre}</h3>

                                        <div className="recipe-meta-modern">
                                            <div className="meta-item">
                                                <Clock size={16} />
                                                <span>{recipe.tempsPreparation} min</span>
                                            </div>

                                            <div className="meta-item rating">
                                                <Star size={16} />
                                                <span>
                                                    {recipe.note > 0 ? recipe.note.toFixed(1) : '-'}
                                                </span>
                                                <span className="avis-count">
                                                    ({recipe.nombreAvis > 0 ? recipe.nombreAvis : 0})
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Section Comment ça marche - Design timeline */}
            <section className="how-it-works">
                <div className="section-container">
                    <div className="section-header-center">
                        <h2 className="section-title-modern">Comment ça fonctionne ?</h2>
                        <p className="section-desc-modern">
                            Trois étapes simples pour cuisiner comme un chef
                        </p>
                    </div>

                    <div className="steps-timeline">
                        <div className="step-item">
                            <div className="step-number">1</div>
                            <div className="step-content">
                                <div className="step-icon">
                                    <ChefHat size={32} />
                                </div>
                                <h3>Listez vos ingrédients</h3>
                                <p>
                                    Ajoutez ce que vous avez dans votre frigo. Notre interface intuitive
                                    rend cette étape ultra-rapide.
                                </p>
                            </div>
                        </div>

                        <div className="step-connector"></div>

                        <div className="step-item">
                            <div className="step-number">2</div>
                            <div className="step-content">
                                <div className="step-icon">
                                    <Sparkles size={32} />
                                </div>
                                <h3>L'IA crée vos recettes</h3>
                                <p>
                                    Notre intelligence artificielle génère des recettes personnalisées
                                    et créatives en quelques secondes.
                                </p>
                            </div>
                        </div>

                        <div className="step-connector"></div>

                        <div className="step-item">
                            <div className="step-number">3</div>
                            <div className="step-content">
                                <div className="step-icon">
                                    <Utensils size={32} />
                                </div>
                                <h3>Cuisinez et régalez-vous</h3>
                                <p>
                                    Suivez les instructions détaillées et découvrez des astuces de chef
                                    pour chaque recette.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section CTA Final */}
            <section className="final-cta">
                <div className="cta-card">
                    <div className="cta-icon-bg">
                        <ChefHat size={64} />
                    </div>
                    <h2>Prêt à révolutionner votre cuisine ?</h2>
                    <p>
                        Rejoignez des milliers de passionnés qui réinventent leur façon de cuisiner chaque jour.
                    </p>
                    <Link to="/ingredients" className="cta-final-btn">
                        <Utensils size={20} />
                        <span>Commencer gratuitement</span>
                    </Link>
                </div>
            </section>

            {/* Footer simplifié */}
            <footer className="footer-modern">
                <div className="footer-container">
                    <div className="footer-brand-section">
                        <div className="footer-logo">

                            {/* <ChefHat size={32} /> */}
                            <img 
                                src={logo} 
                                alt="Logo SmartDish" 
                                className="footer-logo-image"
                            />
                            {/* <span>SmartDish</span> */}
                        </div>
                        <p className="footer-tagline">
                            L'IA qui transforme vos ingrédients en délices culinaires
                        </p>
                    </div>

                    <div className="footer-links-grid">
                        <div className="footer-column">
                            <h4>Fonctionnalités</h4>
                            <Link to="/ingredients">Mes ingrédients</Link>
                            <Link to="/suggestions">Suggestions IA</Link>
                            <Link to="/favoris">Mes favoris</Link>
                        </div>

                        <div className="footer-column">
                            <h4>Compte</h4>
                            <Link to="/compte">Mon profil</Link>
                            <Link to="/login">Connexion</Link>
                            <Link to="/register">Inscription</Link>
                        </div>

                        <div className="footer-column">
                            <h4>Support</h4>
                            <a href="#aide">Centre d'aide</a>
                            <a href="#contact">Contact</a>
                            <a href="#apropos">À propos</a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2025 SmartDish. Tous droits réservés.</p>
                </div>
            </footer>
        </div>
    );
}