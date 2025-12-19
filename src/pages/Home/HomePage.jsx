import { Link } from 'react-router-dom';
import { ChefHat, Sparkles, Clock, Star, TrendingUp, Users } from 'lucide-react';
import './HomePage.css';

export default function HomePage() {
    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-background" />
                <div className="hero-content">
                    <div className="hero-text">
                        <div className="hero-badge">
                            <Sparkles className="icon-sm" />
                            <span>Propulsé par l'IA</span>
                        </div>

                        <h1 className="hero-title">
                            Cuisinez malin avec ce que vous avez
                        </h1>

                        <p className="hero-description">
                            Transformez vos ingrédients en délicieuses recettes personnalisées. Notre IA vous suggère des plats
                            adaptés à ce que vous avez dans votre cuisine.
                        </p>

                        <div className="hero-actions">
                            <Link to="/ingredients" className="btn btn-primary btn-lg">
                                <ChefHat className="icon-sm" />
                                Commencer maintenant
                            </Link>
                            <Link to="/suggestions" className="btn btn-outline btn-lg">
                                Voir les recettes tendance
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Comment ça marche ?</h2>
                        <p className="section-description">
                            Trois étapes simples pour découvrir vos prochains plats favoris
                        </p>
                    </div>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon primary">
                                <ChefHat className="icon-lg" />
                            </div>
                            <h3 className="feature-title">1. Ajoutez vos ingrédients</h3>
                            <p className="feature-description">
                                Saisissez simplement les ingrédients que vous avez sous la main. Notre interface intuitive vous aide à
                                les organiser facilement.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon accent">
                                <Sparkles className="icon-lg" />
                            </div>
                            <h3 className="feature-title">2. L'IA génère des suggestions</h3>
                            <p className="feature-description">
                                Notre intelligence artificielle analyse vos ingrédients et vous propose des recettes personnalisées et
                                créatives.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon secondary">
                                <Star className="icon-lg" />
                            </div>
                            <h3 className="feature-title">3. Cuisinez et savourez</h3>
                            <p className="feature-description">
                                Suivez les instructions détaillées, découvrez les astuces de chef et régalez-vous avec vos créations
                                culinaires.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trending Recipes Preview */}
            <section className="trending-section">
                <div className="container">
                    <div className="trending-header">
                        <div>
                            <h2 className="section-title">Recettes tendance du moment</h2>
                            <p className="section-description">
                                Découvrez les créations les plus populaires de notre communauté
                            </p>
                        </div>
                        <Link to="/suggestions" className="btn btn-outline hidden-mobile">
                            <TrendingUp className="icon-sm" />
                            Voir toutes les recettes
                        </Link>
                    </div>

                    <div className="recipes-grid">
                        {[
                            {
                                title: "Risotto aux champignons",
                                time: "25 min",
                                rating: 4.8,
                                image: "/risotto-champignons-plat-cuisine.jpg",
                            },
                            {
                                title: "Salade de quinoa colorée",
                                time: "15 min",
                                rating: 4.6,
                                image: "/salade-quinoa-coloree-healthy.jpg",
                            },
                            {
                                title: "Curry de légumes épicé",
                                time: "30 min",
                                rating: 4.9,
                                image: "/curry-legumes-epice-indien.jpg",
                            },
                        ].map((recipe, index) => (
                            <div key={index} className="recipe-card">
                                <div className="recipe-image">
                                    <img
                                        src={recipe.image}
                                        alt={recipe.title}
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/400x300?text=Recipe';
                                        }}
                                    />
                                </div>
                                <div className="recipe-content">
                                    <h3 className="recipe-title">{recipe.title}</h3>
                                    <div className="recipe-meta">
                                        <div className="recipe-time">
                                            <Clock className="icon-xs" />
                                            <span>{recipe.time}</span>
                                        </div>
                                        <div className="recipe-rating">
                                            <Star className="icon-xs star-filled" />
                                            <span>{recipe.rating}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="trending-footer-mobile">
                        <Link to="/suggestions" className="btn btn-outline">
                            <TrendingUp className="icon-sm" />
                            Voir toutes les recettes
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-number primary">10k+</div>
                            <p className="stat-label">Recettes générées</p>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number accent">5k+</div>
                            <p className="stat-label">Utilisateurs actifs</p>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number secondary">4.8★</div>
                            <p className="stat-label">Note moyenne</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2 className="cta-title">Prêt à révolutionner votre cuisine ?</h2>
                    <p className="cta-description">
                        Rejoignez des milliers de cuisiniers qui découvrent chaque jour de nouvelles recettes adaptées à leurs
                        ingrédients.
                    </p>
                    <Link to="/ingredients" className="btn btn-primary btn-lg">
                        <Users className="icon-sm" />
                        Commencer gratuitement
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-section">
                            <div className="footer-brand">
                                <ChefHat className="icon-md" />
                                <span>SmartDish</span>
                            </div>
                            <p className="footer-description">
                                L'application qui transforme vos ingrédients en délicieuses recettes grâce à l'intelligence
                                artificielle.
                            </p>
                        </div>

                        <div className="footer-section">
                            <h4 className="footer-title">Fonctionnalités</h4>
                            <ul className="footer-links">
                                <li><Link to="/ingredients">Mes ingrédients</Link></li>
                                <li><Link to="/suggestions">Suggestions IA</Link></li>
                                <li><Link to="/planificateur">Planificateur</Link></li>
                                <li><Link to="/favoris">Favoris</Link></li>
                            </ul>
                        </div>

                        <div className="footer-section">
                            <h4 className="footer-title">Compte</h4>
                            <ul className="footer-links">
                                <li><Link to="/compte">Mon profil</Link></li>
                                <li><Link to="/historique">Historique</Link></li>
                                <li><Link to="/parametres">Paramètres</Link></li>
                            </ul>
                        </div>

                        <div className="footer-section">
                            <h4 className="footer-title">Support</h4>
                            <ul className="footer-links">
                                <li><Link to="/aide">Centre d'aide</Link></li>
                                <li><Link to="/contact">Contact</Link></li>
                                <li><Link to="/a-propos">À propos</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p>&copy; 2025 SmartDish. Tous droits réservés.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}