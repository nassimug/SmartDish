import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, Mail, Lock, User, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import authService from '../../services/api/auth.service';
import './AuthPage.css';
import logo from '../../images/logo.png';

export default function RegisterPage() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        motDePasse: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [success, setSuccess] = useState(false);

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

        // Validation nom
        if (!formData.nom.trim()) {
            newErrors.nom = 'Le nom est requis';
        } else if (formData.nom.trim().length < 2) {
            newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
        }

        // Validation prénom
        if (!formData.prenom.trim()) {
            newErrors.prenom = 'Le prénom est requis';
        } else if (formData.prenom.trim().length < 2) {
            newErrors.prenom = 'Le prénom doit contenir au moins 2 caractères';
        }

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

        // Validation confirmation mot de passe
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Veuillez confirmer le mot de passe';
        } else if (formData.motDePasse !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
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
            // Préparer les données pour l'API (sans confirmPassword)
            const { confirmPassword, ...registerData } = formData;

            // Appel à l'API
            await authService.register(registerData);

            // Afficher le message de succès
            setSuccess(true);

            // Rediriger vers la page de connexion après 2 secondes
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (error) {
            console.error('Erreur d\'inscription:', error);
            setApiError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="success-message">
                        <CheckCircle className="success-icon" size={64} />
                        <h2>Inscription réussie !</h2>
                        <p>Votre compte a été créé avec succès.</p>
                        <p>Redirection vers la page de connexion...</p>
                    </div>
                </div>
            </div>
        );
    }

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
                    <h1 className="auth-title">Inscription</h1>
                    <p className="auth-subtitle">
                        Créez votre compte pour commencer à cuisiner intelligemment
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
                    {/* Nom */}
                    <div className="form-group">
                        <label htmlFor="nom" className="form-label">
                            Nom
                        </label>
                        <div className="input-wrapper">
                            <User className="input-icon" />
                            <input
                                type="text"
                                id="nom"
                                name="nom"
                                value={formData.nom}
                                onChange={handleChange}
                                className={`form-input ${errors.nom ? 'input-error' : ''}`}
                                placeholder="Dupont"
                                disabled={loading}
                            />
                        </div>
                        {errors.nom && (
                            <span className="error-message">{errors.nom}</span>
                        )}
                    </div>

                    {/* Prénom */}
                    <div className="form-group">
                        <label htmlFor="prenom" className="form-label">
                            Prénom
                        </label>
                        <div className="input-wrapper">
                            <User className="input-icon" />
                            <input
                                type="text"
                                id="prenom"
                                name="prenom"
                                value={formData.prenom}
                                onChange={handleChange}
                                className={`form-input ${errors.prenom ? 'input-error' : ''}`}
                                placeholder="Jean"
                                disabled={loading}
                            />
                        </div>
                        {errors.prenom && (
                            <span className="error-message">{errors.prenom}</span>
                        )}
                    </div>

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

                    {/* Confirmation mot de passe */}
                    <div className="form-group">
                        <label htmlFor="confirmPassword" className="form-label">
                            Confirmer le mot de passe
                        </label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                                placeholder="••••••••"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="password-toggle"
                                disabled={loading}
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <span className="error-message">{errors.confirmPassword}</span>
                        )}
                    </div>

                    {/* Bouton d'inscription */}
                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Inscription en cours...
                            </>
                        ) : (
                            'S\'inscrire'
                        )}
                    </button>
                </form>

                {/* Lien vers connexion */}
                <div className="auth-footer">
                    <p>
                        Déjà un compte ?{' '}
                        <Link to="/login" className="auth-link">
                            Se connecter
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