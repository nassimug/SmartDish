import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import './PreferencesModal.css';

export default function PreferencesModal({
                                             isOpen,
                                             onClose,
                                             title,
                                             availableItems, // Liste complète des options disponibles
                                             selectedIds, // IDs actuellement sélectionnés
                                             onSave,
                                             loading
                                         }) {
    const [selected, setSelected] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelected(selectedIds || []);
            setSearchTerm('');
        }
    }, [isOpen, selectedIds]);

    if (!isOpen) return null;

    const filteredItems = availableItems.filter(item =>
        item.nom.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleSelection = (itemId) => {
        setSelected(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleSave = () => {
        onSave(selected);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content preferences-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="modal-close" onClick={onClose}>
                        <X className="icon-sm" />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Barre de recherche */}
                    <div className="search-wrapper">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Liste des options */}
                    <div className="preferences-list">
                        {filteredItems.length === 0 ? (
                            <p className="empty-message">Aucun résultat trouvé</p>
                        ) : (
                            filteredItems.map((item) => {
                                const isSelected = selected.includes(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        className={`preference-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => toggleSelection(item.id)}
                                    >
                                        <div className="preference-info">
                                            <div className="preference-name">{item.nom}</div>
                                            {item.description && (
                                                <div className="preference-desc">{item.description}</div>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <Check className="icon-sm text-primary" />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Compteur de sélection */}
                    <div className="selection-count">
                        {selected.length} élément{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-outline" onClick={onClose}>
                        Annuler
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                </div>
            </div>
        </div>
    );
}