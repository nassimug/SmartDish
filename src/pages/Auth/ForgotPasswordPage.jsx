import { AlertCircle, ArrowLeft, CheckCircle, ChefHat, Loader, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/api/auth.service';
import './AuthPage.css';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleChange = (e) => {
        setEmail(e.target.value);
        if (error) {
            setError('');
        }
    };

    const validate = () => {
        if (!email) {
            setError('L\'email est requis');
            return false;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Email invalide');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            await authService.forgotPassword(email);

            // Afficher le message de succès
            setEmailSent(true);

            // Rediriger vers la page de login après 5 secondes
            setTimeout(() => {
                navigate('/login');
            }, 5000);

        } catch (err) {
            console.error('Erreur lors de l\'envoi de l\'email:', err);
            setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
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
                        <ChefHat className="logo-icon" />
                        <span>SmartDish</span>
                    </Link>
                    <h1>Mot de passe oublié ?</h1>
                    <p className="auth-subtitle">
                        {emailSent 
                            ? 'Email envoyé avec succès !' 
                            : 'Entrez votre email pour réinitialiser votre mot de passe'
                        }
                    </p>
                </div>

                {/* Formulaire ou message de succès */}
                {!emailSent ? (
                    <form onSubmit={handleSubmit} className="auth-form">
                        {/* Erreur API */}
                        {error && (
                            <div className="auth-error">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Champ Email */}
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                Email
                            </label>
                            <div className="input-wrapper">
                                <Mail className="input-icon" size={20} />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className={`form-input ${error ? 'input-error' : ''}`}
                                    placeholder="votre@email.com"
                                    value={email}
                                    onChange={handleChange}
                                    disabled={loading}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Bouton de soumission */}
                        <button 
                            type="submit" 
                            className="btn btn-primary btn-block"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader className="spinner" size={20} />
                                    Envoi en cours...
                                </>
                            ) : (
                                'Envoyer le lien de réinitialisation'
                            )}
                        </button>

                        {/* Retour à la connexion */}
                        <div className="auth-footer">
                            <Link to="/login" className="auth-link">
                                <ArrowLeft size={16} />
                                Retour à la connexion
                            </Link>
                        </div>
                    </form>
                ) : (
                    <div className="success-message">
                        <div className="success-icon-wrapper">
                            <CheckCircle className="success-icon" size={64} />
                        </div>
                        <h2>Email envoyé !</h2>
                        <p>
                            Un email avec les instructions pour réinitialiser votre mot de passe 
                            a été envoyé à <strong>{email}</strong>.
                        </p>
                        <p className="text-muted">
                            Vérifiez également vos spams si vous ne le trouvez pas dans votre boîte de réception.
                        </p>
                        
                        <div className="success-actions">
                            <Link to="/login" className="btn btn-primary">
                                Retour à la connexion
                            </Link>
                        </div>

                        <p className="redirect-message">
                            Redirection automatique dans 5 secondes...
                        </p>
                    </div>
                )}

                {/* Lien d'inscription */}
                {!emailSent && (
                    <div className="auth-switch">
                        <span>Pas encore de compte ?</span>
                        <Link to="/register" className="auth-switch-link">
                            Créer un compte
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
