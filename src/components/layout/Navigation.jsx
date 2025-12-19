import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChefHat, User, Heart, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Navigation.css';

export function Navigation() {
    const [isOpen, setIsOpen] = useState(false);
    const { isAuthenticated, user, logout } = useAuth();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        setIsOpen(false);
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <nav className="navigation">
            <div className="nav-container">
                <div className="nav-content">
                    {/* Logo */}
                    <Link to="/" className="nav-logo">
                        <ChefHat className="logo-icon" />
                        <span>SmartDish</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="nav-links desktop-only">
                        <Link
                            to="/"
                            className={`nav-link ${isActive('/') ? 'active' : ''}`}
                        >
                            Accueil
                        </Link>
                        <Link
                            to="/ingredients"
                            className={`nav-link ${isActive('/ingredients') ? 'active' : ''}`}
                        >
                            Mes ingrédients
                        </Link>
                        <Link
                            to="/suggestions"
                            className={`nav-link ${isActive('/suggestions') ? 'active' : ''}`}
                        >
                            Suggestions IA
                        </Link>
                        <Link
                            to="/planificateur"
                            className={`nav-link ${isActive('/planificateur') ? 'active' : ''}`}
                        >
                            Planificateur
                        </Link>
                    </div>

                    {/* Desktop CTA */}
                    <div className="nav-actions desktop-only">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/favoris"
                                    className="nav-icon-btn"
                                    title="Favoris"
                                >
                                    <Heart className="icon" />
                                </Link>
                                <Link
                                    to="/compte"
                                    className="nav-icon-btn"
                                    title="Mon compte"
                                >
                                    <User className="icon" />
                                </Link>
                                <div className="user-info">
                  <span className="user-name">
                    {user?.prenom} {user?.nom}
                  </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="btn btn-outline btn-sm"
                                >
                                    <LogOut className="icon-sm" />
                                    Déconnexion
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-outline btn-sm">
                                    Se connecter
                                </Link>
                                <Link to="/register" className="btn btn-primary btn-sm">
                                    S'inscrire
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="mobile-menu-btn"
                        aria-label="Toggle menu"
                    >
                        {isOpen ? <X className="icon" /> : <Menu className="icon" />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isOpen && (
                    <div className="mobile-menu">
                        <div className="mobile-menu-content">
                            {/* User info mobile */}
                            {isAuthenticated && user && (
                                <div className="mobile-user-info">
                                    <User className="user-icon" />
                                    <div>
                                        <div className="user-name">{user.prenom} {user.nom}</div>
                                        <div className="user-email">{user.email}</div>
                                    </div>
                                </div>
                            )}

                            {/* Links */}
                            <Link
                                to="/"
                                className={`mobile-link ${isActive('/') ? 'active' : ''}`}
                                onClick={() => setIsOpen(false)}
                            >
                                Accueil
                            </Link>
                            <Link
                                to="/ingredients"
                                className={`mobile-link ${isActive('/ingredients') ? 'active' : ''}`}
                                onClick={() => setIsOpen(false)}
                            >
                                Mes ingrédients
                            </Link>
                            <Link
                                to="/suggestions"
                                className={`mobile-link ${isActive('/suggestions') ? 'active' : ''}`}
                                onClick={() => setIsOpen(false)}
                            >
                                Suggestions IA
                            </Link>
                            <Link
                                to="/planificateur"
                                className={`mobile-link ${isActive('/planificateur') ? 'active' : ''}`}
                                onClick={() => setIsOpen(false)}
                            >
                                Planificateur
                            </Link>

                            {/* Mobile CTA */}
                            <div className="mobile-actions">
                                {isAuthenticated ? (
                                    <>
                                        <Link
                                            to="/favoris"
                                            className="mobile-icon-link"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <Heart className="icon" />
                                            <span>Favoris</span>
                                        </Link>
                                        <Link
                                            to="/compte"
                                            className="mobile-icon-link"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <User className="icon" />
                                            <span>Mon compte</span>
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="btn btn-outline btn-full"
                                        >
                                            <LogOut className="icon-sm" />
                                            Déconnexion
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/login"
                                            className="btn btn-outline btn-full"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Se connecter
                                        </Link>
                                        <Link
                                            to="/register"
                                            className="btn btn-primary btn-full"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            S'inscrire
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}