# 📧 Système de notifications - SmartDish

## 📌 Solution implémentée : Frontend pur (localStorage)

**Pourquoi cette approche ?**
- ✅ **Simple** - Pas besoin de serveur backend supplémentaire
- ✅ **Immédiat** - Notifications instantanées
- ✅ **Autonome** - Fonctionne sans dépendances externes
- ✅ **Gratuit** - Pas de coûts d'infrastructure (email, webhook)
- ✅ **Performant** - Stockage local ultra-rapide

**Limites :**
- ⚠️ Notifications uniquement quand l'utilisateur est dans l'app
- ⚠️ Pas d'emails (peut être ajouté plus tard si besoin)
- ⚠️ Stockage limité au navigateur (si l'utilisateur vide le cache, perte des notifications)

---

## 🎯 Fonctionnalités

### 1. **Badge de notifications dans le header**
- Icône cloche (🔔) avec badge rouge affichant le nombre de notifications non lues
- Clic pour ouvrir le dropdown

### 2. **Dropdown de notifications**
- Liste des notifications récentes
- Badge "X non lues"
- Marquer comme lu au clic
- Supprimer une notification (bouton X)

### 3. **Types de notifications**

#### ✅ Recette validée
```
Titre: ✅ Recette "Tajine de Poulet" validée !
Message: Félicitations ! Votre recette "Tajine de Poulet" a été validée par l'équipe admin et est maintenant visible par tous.
```

#### ❌ Recette rejetée
```
Titre: ❌ Recette "Brownies" rejetée
Message: Votre recette "Brownies" a été rejetée. Motif: Les quantités d'ingrédients ne sont pas assez précises
```

---

## 🔧 Utilisation technique

### Service notification (localStorage)

```javascript
import notificationService from '../../services/api/notification.service';

// Envoyer une notification
await notificationService.sendRecipeValidationNotification(
    utilisateurId,
    'VALIDATION_ACCEPTEE', // ou 'VALIDATION_REJETEE'
    { 
        recetteTitre: "Tajine de Poulet",
        motif: "Raison du rejet" // uniquement si rejeté
    }
);

// Récupérer les notifications d'un utilisateur
const notifications = await notificationService.getNotificationsByUserId(userId);

// Nombre de non lues
const unreadCount = notificationService.getUnreadCount(userId);

// Marquer comme lue
notificationService.markAsRead(notificationId);

// Supprimer
notificationService.deleteNotification(notificationId);
```

### Structure d'une notification

```json
{
  "id": 1735123456789,
  "utilisateurId": 5,
  "type": "VALIDATION_ACCEPTEE",
  "titre": "✅ Recette validée !",
  "message": "Félicitations ! Votre recette...",
  "dateEnvoi": "2025-12-25T14:30:00.000Z",
  "lu": false
}
```

---

## 📊 Workflow complet

### Scénario : Admin valide une recette

1. **Admin clique "Valider"** dans `Mon Compte > Validation`
2. Backend met à jour `statut = 'VALIDEE'`
3. Frontend appelle `notificationService.sendRecipeValidationNotification()`
4. Notification sauvegardée dans **localStorage**
5. **Utilisateur (auteur)** voit le badge 🔔 avec `1` notification
6. Clic sur la cloche → Dropdown affiche la notification
7. Clic sur la notification → Marquée comme lue
8. Badge disparaît

### Scénario : Admin rejette une recette

1. **Admin clique "Rejeter"** et saisit un motif dans le modal
2. Backend met à jour `statut = 'REJETEE'` + `motifRejet`
3. Frontend appelle `sendRecipeValidationNotification('VALIDATION_REJETEE', { motif })`
4. Notification créée avec le motif
5. Utilisateur reçoit la notification dans le dropdown

---

## 🎨 Personnalisation

### Changer l'icône de notification

Dans [`Navigation.jsx`](c:\Users\lenovo\git\SmartDish\src\components\layout\Navigation.jsx) :
```jsx
import { Bell } from 'lucide-react'; // Remplacer par votre icône
```

### Modifier les couleurs

Dans [`Navigation.css`](c:\Users\lenovo\git\SmartDish\src\components\layout\Navigation.css) :
```css
.notification-badge {
    background: #ef4444; /* Rouge par défaut */
}

.notification-item.unread {
    background: #eff6ff; /* Bleu clair */
    border-left: 3px solid #3b82f6; /* Bleu */
}
```

### Changer la durée de rafraîchissement

Dans [`Navigation.jsx`](c:\Users\lenovo\git\SmartDish\src\components\layout\Navigation.jsx) :
```jsx
const interval = setInterval(loadNotifications, 10000); // 10 secondes
```

---

## 🚀 Évolution future (si besoin)

### Option 1 : Ajouter des emails
- Créer un service backend qui envoie des emails via **SendGrid**, **AWS SES**, etc.
- Garder le système actuel + ajouter l'email en parallèle

### Option 2 : Notifications Web Push
- Utiliser l'API **Web Push** du navigateur
- Permet de recevoir des notifications même app fermée
- Nécessite HTTPS et permission utilisateur

### Option 3 : WebSocket temps réel
- Connexion temps réel entre backend et frontend
- Notifications instantanées sans rafraîchissement

---

## 📝 Notes

- Les notifications sont stockées dans `localStorage` clé `'notifications'`
- Chaque notification a un ID unique (timestamp)
- Auto-rafraîchissement toutes les 10 secondes quand connecté
- Compatible tous navigateurs modernes

## ✅ Tests

1. Connectez-vous en tant qu'admin
2. Validez/rejetez une recette
3. Déconnectez-vous et reconnectez-vous avec le compte de l'auteur
4. Vérifiez le badge 🔔 dans le header
5. Cliquez pour voir la notification

---

**Système 100% frontend, zéro backend requis !** 🎉
