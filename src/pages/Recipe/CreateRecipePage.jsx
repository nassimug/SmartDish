import { AlertCircle, Camera, CheckCircle2, ChefHat, Clock, Plus, Sparkles, Users, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import recipesService from '../../services/api/recipe.service';
import './CreateRecipePage.css';

export default function CreateRecipePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageUploadWarning, setImageUploadWarning] = useState('');
    const [minioAvailable, setMinioAvailable] = useState(null); // null = non vérifié, true/false = résultat

    const [form, setForm] = useState({
        titre: '',
        description: '',
        categorie: 'PLAT_PRINCIPAL',
        difficulte: 'FACILE',
        tempsTotal: 30,
        kcal: 0,
        ingredients: [{ id: Date.now(), nom: '', quantite: 1, unite: 'GRAMME', principal: true }],
        etapes: [{ id: Date.now(), ordre: 1, texte: '', temps: 5 }]
    });

    const updateField = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Veuillez sélectionner une image valide');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('L\'image ne doit pas dépasser 5MB');
            return;
        }

        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
        setError('');
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const addIngredient = () => {
        setForm(prev => ({
            ...prev,
            ingredients: [...prev.ingredients, { id: Date.now(), nom: '', quantite: 1, unite: 'GRAMME', principal: false }]
        }));
    };

    const removeIngredient = (index) => {
        setForm(prev => ({
            ...prev,
            ingredients: prev.ingredients.filter((_, i) => i !== index)
        }));
    };

    const updateIngredient = (index, field, value) => {
        setForm(prev => {
            const arr = [...prev.ingredients];
            arr[index] = { ...arr[index], [field]: value };
            return { ...prev, ingredients: arr };
        });
    };

    const addStep = () => {
        setForm(prev => ({
            ...prev,
            etapes: [...prev.etapes, { id: Date.now(), ordre: prev.etapes.length + 1, texte: '', temps: 5 }]
        }));
    };

    const removeStep = (index) => {
        setForm(prev => ({
            ...prev,
            etapes: prev.etapes.filter((_, i) => i !== index).map((step, i) => ({
                ...step,
                ordre: i + 1
            }))
        }));
    };

    const updateStep = (index, field, value) => {
        setForm(prev => {
            const arr = [...prev.etapes];
            arr[index] = { ...arr[index], [field]: value };
            return { ...prev, etapes: arr };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!form.titre.trim()) {
            setError('Le titre est obligatoire');
            return;
        }

        if (form.ingredients.length === 0 || !form.ingredients[0].nom.trim()) {
            setError('Ajoutez au moins un ingrédient');
            return;
        }

        // Validation des étapes : chaque étape doit avoir au moins 5 caractères
        const etapesValides = form.etapes.filter(step => step.texte.trim());
        if (etapesValides.length === 0) {
            setError('Ajoutez au moins une étape de préparation');
            return;
        }
        const etapeTropCourte = etapesValides.find(step => step.texte.trim().length < 5);
        if (etapeTropCourte) {
            setError('Chaque étape doit contenir au moins 5 caractères');
            return;
        }

        if (form.etapes.length === 0 || !form.etapes[0].texte.trim()) {
            setError('Ajoutez au moins une étape');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // Vérifier que l'utilisateur est connecté
            console.log('👤 Utilisateur complet:', user);
            if (!user?.id) {
                setError('Vous devez être connecté pour créer une recette');
                setLoading(false);
                return;
            }

            console.log(`✅ Utilisateur ID confirmé: ${user.id}`);
            console.log(`📤 Envoi de utilisateurId: ${user.id} (type: ${typeof user.id})`);

            // Créer en brouillon (non actif, EN_ATTENTE)
            const payload = {
                titre: form.titre,
                description: form.description || '',
                tempsTotal: parseInt(form.tempsTotal),
                kcal: parseInt(form.kcal) || 0,
                difficulte: form.difficulte?.toUpperCase(),
                categorie: form.categorie || 'PLAT_PRINCIPAL',
                utilisateurId: user.id,  // ID de l'utilisateur créateur (OBLIGATOIRE)
                ingredients: form.ingredients
                    .filter(ing => ing.nom.trim())
                    .map((ing, index) => ({
                        alimentNom: ing.nom,  // Nom personnalisé saisi par l'utilisateur
                        quantite: parseFloat(ing.quantite),
                        unite: ing.unite?.toUpperCase(),
                        principal: ing.principal
                    })),
                etapes: form.etapes
                    .filter(step => step.texte.trim())
                    .map((step, index) => ({
                        ordre: index + 1,
                        texte: step.texte,
                        duree: parseInt(step.temps) || 0
                    })),
                tags: [],
                actif: false,
                statut: 'EN_ATTENTE'
            };
            
            console.log('📤 Payload complet:', JSON.stringify(payload, null, 2));
            console.log(`📤 utilisateurId dans payload: ${payload.utilisateurId}`);
            const recetteCreee = await recipesService.createDraftRecette(payload);
            console.log('✅ Recette créée:', recetteCreee);
            
            // VÉRIFICATION CRITIQUE : Le backend doit retourner utilisateurId
            if (!recetteCreee.utilisateurId) {
                console.error('❌ PROBLÈME BACKEND : utilisateurId est null dans la réponse !');
                console.error('📋 Payload envoyé contenait utilisateurId:', payload.utilisateurId);
                console.error('📋 Réponse backend:', recetteCreee);
                setImageUploadWarning('Attention : La recette a été créée mais n\'est pas associée à votre compte. Contactez un administrateur.');
            }
            
            // Upload de l'image si présente
            let imageUploadSuccess = false;
            if (imageFile && recetteCreee?.id) {
                console.log('🖼️ Tentative upload image pour recette ID:', recetteCreee.id);
                
                try {
                    const imageResult = await recipesService.uploadImage(recetteCreee.id, imageFile);
                    console.log('✅ Image uploadée avec succès:', imageResult);
                    imageUploadSuccess = true;
                    
                    // Récupérer l'URL de l'image (priorité: url > cheminFichier > fileUrl)
                    const imageUrl = imageResult?.url || imageResult?.cheminFichier || imageResult?.fileUrl;
                    
                    if (imageUrl) {
                        console.log('🔗 URL image retournée:', imageUrl);
                        // Mettre à jour l'imageUrl de la recette
                        try {
                            await recipesService.updateRecette(recetteCreee.id, { imageUrl });
                            console.log('✅ ImageUrl mise à jour dans la recette:', imageUrl);
                        } catch (updateErr) {
                            console.warn('⚠️ Erreur mise à jour imageUrl:', updateErr.message);
                            setImageUploadWarning(`Image uploadée mais pas d'accès direct. Une admin devra valider.`);
                        }
                    } else {
                        console.warn('⚠️ Pas d\'URL image dans la réponse backend:', imageResult);
                        setImageUploadWarning(`Image stockée mais URL non disponible. Une admin devra vérifier.`);
                    }
                    
                    setImageUploadWarning('');
                } catch (imgError) {
                    console.warn('⚠️ Erreur upload image:', imgError.message);
                    setImageUploadWarning(`Recette créée, mais l'image n'a pas pu être uploadée: ${imgError.message}`);
                }
            }

            setSuccess(true);
            
            // Message personnalisé selon le résultat
            const message = imageUploadSuccess 
                ? `Recette "${form.titre}" créée avec image` 
                : imageFile 
                    ? `Recette "${form.titre}" créée (image non uploadée - MinIO non disponible)`
                    : `Recette "${form.titre}" créée`;
            
            notifyAbdel(message);

            setTimeout(() => navigate('/compte'), 2000);
        } catch (err) {
            console.error('❌ Erreur création recette:', err);
            console.error('❌ Type d\'erreur:', err.constructor.name);
            console.error('❌ Message:', err.message);
            console.error('❌ Stack:', err.stack);
            
            // Afficher l'erreur détaillée pour le débogage
            let errorMsg = err.message || 'Service temporairement indisponible';
            
            // Si c'est une erreur Axios, extraire plus de détails
            if (err.response) {
                console.error('❌ Response status:', err.response.status);
                console.error('❌ Response data:', err.response.data);
                errorMsg = err.response.data?.message || err.response.data?.error || errorMsg;
            }
            
            setError(errorMsg);
        } finally {
            setLoading(false);
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
        <div className="create-recipe-page fade-in">
            <div className="create-container">
                <div className="create-header slide-down">
                    <div className="badge badge-primary">
                        <Sparkles className="icon-sm" />
                        <span>Nouvelle recette</span>
                    </div>
                    <h1 className="title">
                        <ChefHat className="icon-md" /> Proposez votre recette
                    </h1>
                    <p className="subtitle">
                        Votre recette sera validée par un administrateur avant publication publique.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="card form-card pop-in">
                    <div className="card-content">
                        {error && (
                            <div className="alert alert-error">
                                <AlertCircle className="icon-sm" />
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="alert alert-success">
                                <CheckCircle2 className="icon-sm" />
                                Recette envoyée pour validation ! Redirection...
                            </div>
                        )}
                        {imageUploadWarning && (
                            <div className="alert alert-warning" style={{backgroundColor: '#fff3cd', borderColor: '#ffc107', color: '#856404'}}>
                                <AlertCircle className="icon-sm" />
                                {imageUploadWarning}
                            </div>
                        )}

                        {/* Informations générales */}
                        <div className="section">
                            <h3 className="section-title">Informations générales</h3>
                            
                            {/* Upload d'image */}
                            <div className="form-group">
                                <label className="form-label">Photo de la recette</label>
                                {!imagePreview ? (
                                    <label className="image-upload-zone">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="image-input-hidden"
                                            disabled={loading || success}
                                        />
                                        <div className="upload-content">
                                            <Camera className="upload-icon" />
                                            <p className="upload-text">Cliquez pour ajouter une photo</p>
                                            <p className="upload-hint">JPG, PNG ou GIF (max. 5MB)</p>
                                        </div>
                                    </label>
                                ) : (
                                    <div className="image-preview-container">
                                        <img src={imagePreview} alt="Aperçu" className="image-preview" />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="btn-remove-image"
                                            disabled={loading || success}
                                        >
                                            <X className="icon-sm" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Titre de la recette *</label>
                                <input
                                    name="titre"
                                    value={form.titre}
                                    onChange={updateField}
                                    className="form-input"
                                    placeholder="Ex: Risotto aux champignons"
                                    required
                                    disabled={loading || success}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={updateField}
                                    className="form-textarea"
                                    rows={3}
                                    placeholder="Décrivez votre recette..."
                                    disabled={loading || success}
                                />
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Catégorie</label>
                                    <select
                                        name="categorie"
                                        value={form.categorie}
                                        onChange={updateField}
                                        className="form-input"
                                        disabled={loading || success}
                                    >
                                        <option value="ENTREE">Entrée</option>
                                        <option value="PLAT_PRINCIPAL">Plat principal</option>
                                        <option value="DESSERT">Dessert</option>
                                        <option value="ACCOMPAGNEMENT">Accompagnement</option>
                                        <option value="BOISSON">Boisson</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Difficulté</label>
                                    <select
                                        name="difficulte"
                                        value={form.difficulte}
                                        onChange={updateField}
                                        className="form-input"
                                        disabled={loading || success}
                                    >
                                        <option value="FACILE">Facile</option>
                                        <option value="MOYEN">Moyen</option>
                                        <option value="DIFFICILE">Difficile</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <Clock className="icon-xs" /> Temps total (min)
                                    </label>
                                    <input
                                        type="number"
                                        name="tempsTotal"
                                        value={form.tempsTotal}
                                        onChange={updateField}
                                        className="form-input"
                                        min="1"
                                        disabled={loading || success}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Calories (kcal)</label>
                                    <input
                                        type="number"
                                        name="kcal"
                                        value={form.kcal}
                                        onChange={updateField}
                                        className="form-input"
                                        min="0"
                                        placeholder="Optionnel"
                                        disabled={loading || success}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Ingrédients */}
                        <div className="section">
                            <div className="section-header">
                                <h3 className="section-title">Ingrédients *</h3>
                                <button
                                    type="button"
                                    onClick={addIngredient}
                                    className="btn btn-outline btn-sm"
                                    disabled={loading || success}
                                >
                                    <Plus className="icon-xs" />
                                    Ajouter
                                </button>
                            </div>
                            
                            <div className="items-list">
                                {form.ingredients.map((ing, i) => (
                                    <div key={ing.id} className="item-row">
                                        <input
                                            placeholder="Nom de l'ingrédient"
                                            value={ing.nom}
                                            onChange={(e) => updateIngredient(i, 'nom', e.target.value)}
                                            className="form-input"
                                            disabled={loading || success}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Quantité"
                                            value={ing.quantite}
                                            onChange={(e) => updateIngredient(i, 'quantite', e.target.value)}
                                            className="form-input input-small"
                                            min="0"
                                            step="0.1"
                                            disabled={loading || success}
                                        />
                                        <select
                                            value={ing.unite}
                                            onChange={(e) => updateIngredient(i, 'unite', e.target.value)}
                                            className="form-input input-small"
                                            disabled={loading || success}
                                        >
                                            <option value="GRAMME">GRAMME (g)</option>
                                            <option value="KILOGRAMME">KILOGRAMME (kg)</option>
                                            <option value="LITRE">LITRE (L)</option>
                                            <option value="MILLILITRE">MILLILITRE (ml)</option>
                                            <option value="CUILLERE_A_SOUPE">CUILLERE_A_SOUPE</option>
                                            <option value="CUILLERE_A_CAFE">CUILLERE_A_CAFE</option>
                                            <option value="SACHET">SACHET</option>
                                            <option value="UNITE">UNITE</option>
                                        </select>
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={ing.principal}
                                                onChange={(e) => updateIngredient(i, 'principal', e.target.checked)}
                                                disabled={loading || success}
                                            />
                                            <span>Principal</span>
                                        </label>
                                        {form.ingredients.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeIngredient(i)}
                                                className="btn btn-icon btn-danger"
                                                disabled={loading || success}
                                                title="Supprimer"
                                            >
                                                <X className="icon-xs" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Étapes */}
                        <div className="section">
                            <div className="section-header">
                                <h3 className="section-title">Étapes de préparation *</h3>
                                <button
                                    type="button"
                                    onClick={addStep}
                                    className="btn btn-outline btn-sm"
                                    disabled={loading || success}
                                >
                                    <Plus className="icon-xs" />
                                    Ajouter
                                </button>
                            </div>
                            
                            <div className="items-list">
                                {form.etapes.map((step, i) => (
                                    <div key={step.id} className="step-row">
                                        <div className="step-number">
                                            <Users className="icon-xs" />
                                            <span>Étape {step.ordre}</span>
                                        </div>
                                        <textarea
                                            placeholder="Décrivez cette étape..."
                                            value={step.texte}
                                            onChange={(e) => updateStep(i, 'texte', e.target.value)}
                                            className="form-textarea"
                                            rows={2}
                                            disabled={loading || success}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Temps (min)"
                                            value={step.temps}
                                            onChange={(e) => updateStep(i, 'temps', e.target.value)}
                                            className="form-input input-small"
                                            min="0"
                                            disabled={loading || success}
                                        />
                                        {form.etapes.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeStep(i)}
                                                className="btn btn-icon btn-danger"
                                                disabled={loading || success}
                                                title="Supprimer"
                                            >
                                                <X className="icon-xs" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="form-actions">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading || success}
                            >
                                {loading ? 'Envoi en cours...' : 'Envoyer à validation'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => navigate(-1)}
                                disabled={loading || success}
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
