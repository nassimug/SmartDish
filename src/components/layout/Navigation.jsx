import { Bell, ChefHat, Heart, LogOut, Menu, User, X } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/api/notification.service';
import './Navigation.css';
import logo from '../../images/logo.png';

export function Navigation() {
    const [isOpen, setIsOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { isAuthenticated, user, logout, loading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Définir le chargeur avant de l'utiliser dans useEffect
    const loadNotifications = useCallback(async () => {
        if (!user?.id) {
            console.log('⚠️ [Navigation] Pas d\'utilisateur connecté, skip chargement notifications');
            return;
        }
        try {
            console.log('🔔 [Navigation] Chargement notifications pour utilisateur ID:', user.id, 'Type:', typeof user.id);
            // Afficher uniquement les notifications non lues pour éviter l'historique volumineux
            const userNotifications = await notificationService.getNotificationsNonLues(user.id);
            console.log('📬 [Navigation] Notifications reçues:', userNotifications);
            console.log('📊 [Navigation] Nombre total:', userNotifications.length);
            
            // Trier par date (plus récentes en premier)
            const sorted = userNotifications.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
            setNotifications(sorted);
            
            const count = await notificationService.getUnreadCount(user.id);
            console.log('🔢 [Navigation] Notifications non lues:', count);
            setUnreadCount(count);
        } catch (error) {
            // Silently fail if backend is not ready yet - will retry on next interval
            if (error.message.includes('Impossible de contacter le serveur')) {
                console.warn('⚠️ [Navigation] Backend non disponible, réessai automatique dans 60s');
            } else {
                console.error('❌ [Navigation] Erreur chargement notifications:', error);
            }
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user?.id]);

    // Charger les notifications
    useEffect(() => {
        if (isAuthenticated && user?.id) {
            // Invalider le cache à chaque login pour éviter d'avoir des données stales
            notificationService.clearCache();
            loadNotifications();
            
            // Rafraîchir toutes les 60 secondes (optimisé pour performance)
            const interval = setInterval(loadNotifications, 60000);
            
            // Écouter l'événement personnalisé pour rechargement immédiat
            const handleReload = () => {
                console.log('🔄 [Navigation] Rechargement forcé des notifications');
                loadNotifications();
            };
            window.addEventListener('reloadNotifications', handleReload);
            
            return () => {
                clearInterval(interval);
                window.removeEventListener('reloadNotifications', handleReload);
            };
        }
    }, [isAuthenticated, user?.id, loadNotifications]);

    

    const handleNotificationClick = async (notification) => {
        try {
            if (!notification.lu) {
                // Optimistic update immédiat
                setNotifications((prev) => prev.map((n) => n.id === notification.id ? { ...n, lu: true } : n));
                setUnreadCount((prev) => Math.max(0, prev - 1));
                // Appel async sans attendre
                notificationService.markAsRead(notification.id).catch(() => {
                    // En cas d'erreur, restaurer
                    setNotifications((prev) => prev.map((n) => n.id === notification.id ? { ...n, lu: false } : n));
                    setUnreadCount((prev) => prev + 1);
                });
            }
        } catch (err) {
            console.error('❌ [Navigation] Erreur markAsRead:', err);
        }
    };

    const handleDeleteNotification = async (notificationId) => {
        try {
            const target = notifications.find((n) => n.id === notificationId);
            // Suppression optimiste immédiate
            setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
            if (target && !target.lu) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
            
            // Appel async sans attendre
            await notificationService.deleteNotification(notificationId);
            console.log('✅ [Navigation] Notification supprimée:', notificationId);
        } catch (err) {
            console.error('❌ [Navigation] Erreur deleteNotification:', err);
            // En cas d'erreur CORS, la notification est déjà supprimée localement
            // Recharger juste le cache pour la prochaine ouverture
        }
    };

    const handleLogout = () => {
        // Nettoyer le cache des notifications à la déconnexion
        notificationService.clearCache();
        setNotifications([]);
        setUnreadCount(0);
        logout();
        setIsOpen(false);
        navigate('/login');
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
                        <img 
                            src={logo} 
                            alt="SmartDish Logo" 
                            className="nav-logo-image"
                        />
                        <span className="nav-logo-text">SmartDish</span>
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
                            Recettes
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
                        {loading ? (
                            <div className="nav-actions-skeleton" aria-busy="true" />
                        ) : isAuthenticated ? (
                            <>
                                <Link
                                    to="/favoris"
                                    className="nav-icon-btn"
                                    title="Favoris"
                                >
                                    <Heart className="icon" />
                                </Link>
                                
                                {/* Notifications */}
                                <div className="notification-wrapper">
                                    <button
                                        className="nav-icon-btn"
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        title="Notifications"
                                    >
                                        <Bell className="icon" />
                                        {unreadCount > 0 && (
                                            <span className="notification-badge">{unreadCount}</span>
                                        )}
                                    </button>

                                    {showNotifications && (
                                        <div className="notifications-dropdown">
                                            <div className="notifications-header">
                                                <h3>Notifications</h3>
                                                {unreadCount > 0 && (
                                                    <span className="unread-badge">{unreadCount} non lues</span>
                                                )}
                                            </div>
                                            <div className="notifications-list">
                                                {notifications.length === 0 ? (
                                                    <div className="no-notifications">
                                                        <Bell className="icon-empty" />
                                                        <p>Aucune notification</p>
                                                    </div>
                                                ) : (
                                                    notifications.map(notif => (
                                                        <div 
                                                            key={notif.id} 
                                                            className={`notification-item ${!notif.lu ? 'unread' : ''}`}
                                                            onClick={() => handleNotificationClick(notif)}
                                                        >
                                                            <div className="notification-content">
                                                                <h4>{notif.recetteTitre || 'Notification'}</h4>
                                                                <p>{notif.message}</p>
                                                                <span className="notification-date">
                                                                    {new Date(notif.dateCreation).toLocaleDateString('fr-FR', {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </span>
                                                            </div>
                                                            <button
                                                                className="delete-notif-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteNotification(notif.id);
                                                                }}
                                                            >
                                                                <X className="icon-xs" />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Link
                                    to="/compte"
                                    className="nav-icon-btn"
                                    title="Mon compte"
                                >
                                    <User className="icon" />
                                </Link>
                                <div className="user-info">
                  <span className="user-name">
                    {user?.prenom}
                    {user?.role === 'ADMIN' && (
                      <span className="admin-badge">ADMIN</span>
                    )}
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
                                        <div className="user-name">
                                            {user.prenom} {user.nom}
                                            {user.role === 'ADMIN' && (
                                                <span className="admin-badge">ADMIN</span>
                                            )}
                                        </div>
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
                                Recettes
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