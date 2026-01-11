import { AlertCircle, CheckCircle, ChefHat, Eye, EyeOff, Loader, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../../services/api/auth.service';
import './AuthPage.css';
import logo from '../../images/logo.png';

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        // Vérifier que le token est présent
        if (!token) {
            setApiError('Token de réinitialisation invalide ou manquant');
        }
    }, [token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Effacer l'erreur du champ modifié
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        if (apiError) {
            setApiError('');
        }
    };

    const validate = () => {
        const newErrors = {};

        // Validation nouveau mot de passe
        if (!formData.newPassword) {
            newErrors.newPassword = 'Le nouveau mot de passe est requis';
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = 'Le mot de passe doit contenir au moins 6 caractères';
        } else if (!/(?=.*[a-z])/.test(formData.newPassword)) {
            newErrors.newPassword = 'Le mot de passe doit contenir au moins une lettre minuscule';
        } else if (!/(?=.*[A-Z])/.test(formData.newPassword)) {
            newErrors.newPassword = 'Le mot de passe doit contenir au moins une lettre majuscule';
        } else if (!/(?=.*\d)/.test(formData.newPassword)) {
            newErrors.newPassword = 'Le mot de passe doit contenir au moins un chiffre';
        }

        // Validation confirmation mot de passe
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Veuillez confirmer le mot de passe';
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate() || !token) {
            return;
        }

        setLoading(true);
        setApiError('');

        try {
            await authService.resetPassword(token, formData.newPassword);

            // Afficher le message de succès
            setResetSuccess(true);

            // Rediriger vers la page de login après 3 secondes
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            console.error('Erreur lors de la réinitialisation:', err);
            setApiError(err.message || 'Une erreur est survenue. Le lien a peut-être expiré.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                {/* Logo et titre */}
                <div className="auth-header">
                    <Link to="/" className="auth-logo">
                        {/* <ChefHat className="logo-icon" />
                        <span>SmartDish</span> */}
                        <img 
                            src={logo} 
                            alt="SmartDish Logo" 
                            className="auth-logo-image"
                        />
                    </Link>
                    <h1>Réinitialiser le mot de passe</h1>
                    <p className="auth-subtitle">
                        {resetSuccess 
                            ? 'Mot de passe réinitialisé avec succès !' 
                            : 'Choisissez un nouveau mot de passe sécurisé'
                        }
                    </p>
                </div>

                {/* Formulaire ou message de succès */}
                {!resetSuccess ? (
                    <form onSubmit={handleSubmit} className="auth-form">
                        {/* Erreur API */}
                        {apiError && (
                            <div className="auth-error">
                                <AlertCircle size={18} />
                                <span>{apiError}</span>
                            </div>
                        )}

                        {/* Nouveau mot de passe */}
                        <div className="form-group">
                            <label htmlFor="newPassword" className="form-label">
                                Nouveau mot de passe
                            </label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={20} />
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    id="newPassword"
                                    name="newPassword"
                                    className={`form-input ${errors.newPassword ? 'input-error' : ''}`}
                                    placeholder="••••••••"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    disabled={loading || !token}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    disabled={loading || !token}
                                >
                                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.newPassword && (
                                <p className="error-message">{errors.newPassword}</p>
                            )}
                        </div>

                        {/* Confirmation mot de passe */}
                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">
                                Confirmer le mot de passe
                            </label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={20} />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={loading || !token}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    disabled={loading || !token}
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="error-message">{errors.confirmPassword}</p>
                            )}
                        </div>

                        {/* Critères de sécurité */}
                        <div className="password-requirements">
                            <p className="requirements-title">Le mot de passe doit contenir :</p>
                            <ul className="requirements-list">
                                <li className={formData.newPassword.length >= 6 ? 'requirement-met' : ''}>
                                    Au moins 6 caractères
                                </li>
                                <li className={/(?=.*[a-z])/.test(formData.newPassword) ? 'requirement-met' : ''}>
                                    Une lettre minuscule
                                </li>
                                <li className={/(?=.*[A-Z])/.test(formData.newPassword) ? 'requirement-met' : ''}>
                                    Une lettre majuscule
                                </li>
                                <li className={/(?=.*\d)/.test(formData.newPassword) ? 'requirement-met' : ''}>
                                    Un chiffre
                                </li>
                            </ul>
                        </div>

                        {/* Bouton de soumission */}
                        <button 
                            type="submit" 
                            className="btn btn-primary btn-block"
                            disabled={loading || !token}
                        >
                            {loading ? (
                                <>
                                    <Loader className="spinner" size={20} />
                                    Réinitialisation...
                                </>
                            ) : (
                                'Réinitialiser le mot de passe'
                            )}
                        </button>

                        {/* Retour à la connexion */}
                        <div className="auth-footer">
                            <Link to="/login" className="auth-link">
                                Retour à la connexion
                            </Link>
                        </div>
                    </form>
                ) : (
                    <div className="success-message">
                        <div className="success-icon-wrapper">
                            <CheckCircle className="success-icon" size={64} />
                        </div>
                        <h2>Mot de passe réinitialisé !</h2>
                        <p>
                            Votre mot de passe a été réinitialisé avec succès. 
                            Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                        </p>
                        
                        <div className="success-actions">
                            <Link to="/login" className="btn btn-primary">
                                Se connecter
                            </Link>
                        </div>

                        <p className="redirect-message">
                            Redirection automatique dans 3 secondes...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
