import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ChefHat, AlertCircle, Clock, TrendingUp, Loader } from 'lucide-react';
import recipesService from '../../services/api/recipe.service';
import { useAuth } from '../../hooks/useAuth';
import './AdminRecipesValidationPage.css';

export default function AdminRecipesValidationPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(null);

    useEffect(() => {
        if (!user || user.role !== 'ADMIN') {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        loadPendingRecipes();
    }, []);

    const loadPendingRecipes = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await recipesService.getRecettesEnAttente();
            setPending(data || []);
        } catch (err) {
            setError(err.message || 'Erreur lors du chargement des recettes');
        } finally {
            setLoading(false);
        }
    };

    const approve = async (recette) => {
        if (!window.confirm(`Valider la recette "${recette.titre}" ?`)) return;

        try {
            setProcessing(recette.id);
            // Mise à jour optimiste de l'UI
            setPending(prev => prev.filter(p => p.id !== recette.id));
            
            // Exécuter validation et notification en parallèle
            await Promise.all([
                recipesService.validerRecette(recette.id),
                notifyAbdel(`Recette validée: ${recette.titre} (ID: ${recette.id})`)
            ]);
        } catch (err) {
            // En cas d'erreur, restaurer la recette dans la liste
            setPending(prev => [...prev, recette].sort((a, b) => a.id - b.id));
            setError(err.message || 'Erreur lors de la validation');
        } finally {
            setProcessing(null);
        }
    };

    const reject = async (recette) => {
        const motif = window.prompt(`Motif de rejet pour "${recette.titre}":`, 'Non conforme aux standards');
        if (motif === null || !motif.trim()) return;

        try {
            setProcessing(recette.id);
            // Mise à jour optimiste de l'UI
            setPending(prev => prev.filter(p => p.id !== recette.id));
            
            // Exécuter rejet et notification en parallèle
            await Promise.all([
                recipesService.rejeterRecette(recette.id, motif),
                notifyAbdel(`Recette rejetée: ${recette.titre} (ID: ${recette.id})`)
            ]);
        } catch (err) {
            // En cas d'erreur, restaurer la recette dans la liste
            setPending(prev => [...prev, recette].sort((a, b) => a.id - b.id));
            setError(err.message || 'Erreur lors du rejet');
        } finally {
            setProcessing(null);
        }
    };

    const notifyAbdel = async (message) => {
        try {
            const url = process.env.REACT_APP_ABDEL_WEBHOOK_URL;
            if (!url) {
                console.log('[Notify Abdel]', message);
                return;
            }
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, timestamp: new Date().toISOString() })
            });
        } catch (error) {
            console.log('[Notify Abdel] Erreur:', error);
        }
    };

    return (
        <div className="admin-validation-page fade-in">
            <div className="admin-container">
                <div className="admin-header slide-down">
                    <div className="badge badge-admin">
                        <ChefHat className="icon-sm" />
                        <span>Administration</span>
                    </div>
                    <h1 className="title">
                        <TrendingUp className="icon-md" /> Validation des recettes
                    </h1>
                    <p className="subtitle">
                        Vérifiez et validez les recettes proposées par les utilisateurs avant publication.
                    </p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <AlertCircle className="icon-sm" />
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="loading-state">
                        <Loader className="spinner" />
                        <p>Chargement des recettes en attente...</p>
                    </div>
                ) : pending.length === 0 ? (
                    <div className="empty-state">
                        <ChefHat className="empty-icon" />
                        <h3>Aucune recette en attente</h3>
                        <p>Toutes les propositions ont été traitées</p>
                        <button className="btn btn-outline" onClick={() => navigate('/')}>
                            Retour à l'accueil
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="stats-bar">
                            <div className="stat-item">
                                <span className="stat-value">{pending.length}</span>
                                <span className="stat-label">En attente</span>
                            </div>
                        </div>

                        <div className="cards-grid">
                            {pending.map((recette) => (
                                <div key={recette.id} className="recipe-card pop-in">
                                    <div className="card-header">
                                        <h3 className="card-title">{recette.titre}</h3>
                                        <span className="badge badge-pending">En attente</span>
                                    </div>

                                    <div className="card-content">
                                        {recette.description && (
                                            <p className="recipe-desc">{recette.description}</p>
                                        )}

                                        <div className="recipe-meta">
                                            <div className="meta-item">
                                                <span className="meta-label">Difficulté:</span>
                                                <span className="meta-value">{recette.difficulte || 'Non spécifiée'}</span>
                                            </div>
                                            <div className="meta-item">
                                                <Clock className="icon-xs" />
                                                <span className="meta-value">
                                                    {recette.tempsTotal ? `${recette.tempsTotal} min` : 'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        {recette.ingredients && recette.ingredients.length > 0 && (
                                            <div className="recipe-section">
                                                <h4 className="section-subtitle">Ingrédients ({recette.ingredients.length})</h4>
                                                <ul className="ingredients-list">
                                                    {recette.ingredients.slice(0, 3).map((ing, idx) => (
                                                        <li key={idx}>
                                                            {ing.aliment?.nom || ing.nom} - {ing.quantite} {ing.unite}
                                                        </li>
                                                    ))}
                                                    {recette.ingredients.length > 3 && (
                                                        <li className="more-items">
                                                            +{recette.ingredients.length - 3} autre(s)
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                        )}

                                        {recette.etapes && recette.etapes.length > 0 && (
                                            <div className="recipe-section">
                                                <h4 className="section-subtitle">Étapes ({recette.etapes.length})</h4>
                                            </div>
                                        )}

                                        <div className="card-actions">
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => approve(recette)}
                                                disabled={processing === recette.id}
                                            >
                                                {processing === recette.id ? (
                                                    <>
                                                        <Loader className="icon-sm spinner" />
                                                        Validation...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="icon-sm" />
                                                        Valider
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                className="btn btn-outline btn-sm btn-danger"
                                                onClick={() => reject(recette)}
                                                disabled={processing === recette.id}
                                            >
                                                <XCircle className="icon-sm" />
                                                Rejeter
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
