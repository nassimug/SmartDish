import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import authService from '../../services/api/auth.service';
import { useAuth } from '../../context/AuthContext';
import './AuthPage.css';
import logo from '../../images/logo.png';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        motDePasse: ''
    });

    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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

        // Effacer l'erreur API
        if (apiError) {
            setApiError('');
        }
    };

    const validate = () => {
        const newErrors = {};

        // Validation email
        if (!formData.email) {
            newErrors.email = 'L\'email est requis';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email invalide';
        }

        // Validation mot de passe
        if (!formData.motDePasse) {
            newErrors.motDePasse = 'Le mot de passe est requis';
        } else if (formData.motDePasse.length < 6) {
            newErrors.motDePasse = 'Le mot de passe doit contenir au moins 6 caractères';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setLoading(true);
        setApiError('');

        try {
            // Appel à l'API
            const response = await authService.login({
                email: formData.email,
                motDePasse: formData.motDePasse
            });

            // Récupérer les infos utilisateur
            const user = await authService.getUserByEmail(formData.email);

            // Mettre à jour le contexte d'authentification
            login(response.token, user);

            // Rediriger vers la page d'accueil
            navigate('/');

        } catch (error) {
            console.error('Erreur de connexion:', error);
            setApiError(error.message);
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
                    <h1 className="auth-title">Connexion</h1>
                    <p className="auth-subtitle">
                        Connectez-vous pour accéder à vos recettes personnalisées
                    </p>
                </div>

                {/* Erreur API */}
                {apiError && (
                    <div className="alert alert-error">
                        <AlertCircle className="alert-icon" />
                        <span>{apiError}</span>
                    </div>
                )}

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="auth-form">
                    {/* Email */}
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            Email
                        </label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" />
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`form-input ${errors.email ? 'input-error' : ''}`}
                                placeholder="votre.email@exemple.com"
                                disabled={loading}
                            />
                        </div>
                        {errors.email && (
                            <span className="error-message">{errors.email}</span>
                        )}
                    </div>

                    {/* Mot de passe */}
                    <div className="form-group">
                        <label htmlFor="motDePasse" className="form-label">
                            Mot de passe
                        </label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="motDePasse"
                                name="motDePasse"
                                value={formData.motDePasse}
                                onChange={handleChange}
                                className={`form-input ${errors.motDePasse ? 'input-error' : ''}`}
                                placeholder="••••••••"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="password-toggle"
                                disabled={loading}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {errors.motDePasse && (
                            <span className="error-message">{errors.motDePasse}</span>
                        )}
                    </div>

                    {/* Mot de passe oublié */}
                    <div className="form-footer">
                        <Link to="/forgot-password" className="forgot-password">
                            Mot de passe oublié ?
                        </Link>
                    </div>

                    {/* Bouton de connexion */}
                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Connexion en cours...
                            </>
                        ) : (
                            'Se connecter'
                        )}
                    </button>
                </form>

                {/* Lien vers inscription */}
                <div className="auth-footer">
                    <p>
                        Pas encore de compte ?{' '}
                        <Link to="/register" className="auth-link">
                            S'inscrire
                        </Link>
                    </p>
                </div>

                {/* Retour à l'accueil */}
                <div className="back-home">
                    <Link to="/" className="back-link">
                        ← Retour à l'accueil
                    </Link>
                </div>
            </div>
        </div>
    );
}