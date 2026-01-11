# SmartDish

Application de gestion de recettes intelligente avec recommandations IA et système de cache haute performance.

## ✨ Nouveautés v1.2.0 (2 janvier 2025)

🚀 **Cache Redis + Optimisations Performance**

- ⚡ **Navigation 50x plus rapide** grâce au cache frontend
- 📉 **70% de requêtes HTTP en moins**
- 💾 **Redis cache backend** (5 minutes TTL)
- 🎯 **Cache frontend intelligent** (1-2 minutes TTL selon le type de données)
- 📊 **Composant debug CacheStats** pour visualiser les performances

**Résultat** : Temps de chargement des recettes réduit de 650ms à 15ms ! 🎉

📖 Voir [docs/CACHE_INTEGRATION.md](docs/CACHE_INTEGRATION.md) pour les détails complets.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 16+
- Docker & Docker Compose
- Git

### Installation

1. **Cloner le projet**
```bash
git clone https://github.com/nassimug/SmartDish.git
cd SmartDish
git checkout feat/docker
```

2. **Configurer l'environnement**
```bash
# Copier le fichier d'exemple
copy .env.example .env

# Éditer .env avec vos credentials Railway MySQL
```

3. **Configurer MySQL Railway**

Le projet utilise Railway pour la base de données MySQL centralisée.

**Variables d'environnement (.env) :**
```env
# MySQL Railway (cloud partagé)
MYSQL_HOST=ballast.proxy.rlwy.net
MYSQL_PORT=14497
MYSQL_DATABASE=railway
MYSQL_USER=root
MYSQL_PASSWORD=votre_password_railway

# MinIO (Railway - stockage partagé)
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=#SmartDishTeam2026#
REACT_APP_MINIO_PUBLIC_URL=https://minio-production-94bb.up.railway.app
# Domains Railway
# - Public: minio-production-94bb.up.railway.app
# - Privé (intra-Railway): minio.railway.internal
# - Projet: cozy-forgiveness

# JWT
JWT_SECRET=smartdish-secret-key-2024-very-secure-and-long-enough-for-hs512
JWT_EXPIRATION=86400000
```

**Pour obtenir vos credentials Railway :**
1. Allez sur https://railway.app/
2. Créez un projet MySQL
3. Dans l'onglet "Connect", copiez l'URL publique
4. Format : `mysql://user:password@host:port/database`

4. **Lancer les microservices**
```bash
docker-compose up -d
```

5. **Lancer le frontend**
```bash
npm install
npm start
```

L'application sera accessible sur http://localhost:3000

## 📦 Architecture

### Microservices (Docker)

| Service | Port | Description |
|---------|------|-------------|
| MS-Persistance | 8090 | Service de persistance avec **Redis cache** ⚡ |
| MS-Utilisateur | 8092 | Gestion utilisateurs & JWT |
| MS-Recette | 8093 | Gestion recettes |
| MS-Feedback | 8091 | Gestion feedbacks |
| MS-Recommandation | 8095 | Recommandations IA (Ollama) |
| MinIO | 9002/9003 | Stockage S3 |
| **Redis** | 6379 | **Cache backend (nouveau)** 🆕 |

### Système de Cache à 2 Niveaux

```
User → Frontend Cache (1-2 min) → Backend Cache Redis (5 min) → MySQL
         ↓ HIT (< 20ms)             ↓ HIT (~50-100ms)         ↓ MISS (~500ms)
```

**Avantages** :
- ⚡ Réduction de la charge serveur de 70%
- 📉 Diminution des requêtes MySQL
- 🚀 Temps de réponse divisé par 10-50
- 💪 Scalabilité améliorée

### Base de données

- **MySQL** : Railway Cloud (partagé par l'équipe)
- **Redis** : Cache local Docker (256MB, politique LRU)
- **Avantages** : Données centralisées, pas de MySQL local, accessible partout

## 🧪 Tests API

```bash
# Vérifier la santé des services
curl http://localhost:8092/actuator/health

# Créer un utilisateur
curl -X POST http://localhost:8092/api/utilisateurs/register \
  -H "Content-Type: application/json" \
  -d '{"nom":"Test","prenom":"User","email":"test@test.com","motDePasse":"Test123!"}'
```

## 🔧 Commandes utiles

```bash
# Voir l'état des services
docker-compose ps

# Voir les logs
docker-compose logs -f ms-persistance

# Vérifier Redis
docker exec -it smartdish-redis redis-cli PING
# Doit répondre : PONG

# Voir les stats Redis
docker exec -it smartdish-redis redis-cli INFO stats

# Vider le cache Redis (développement uniquement)
docker exec -it smartdish-redis redis-cli FLUSHALL

# Redémarrer un service
docker-compose restart ms-utilisateur

# Tout arrêter
docker-compose down
```

## 📊 Monitoring des Performances

### Composant CacheStats (Développement)

Pour visualiser les performances du cache frontend :

```javascript
// Dans App.js, ajouter :
import CacheStats from './components/debug/CacheStats';

{process.env.NODE_ENV === 'development' && <CacheStats />}
```

**Fonctionnalités** :
- 📊 Statistiques en temps réel (hits, misses, hit rate)
- 🔍 Liste des clés en cache
- 🗑️ Invalidation manuelle de clés
- 🔄 Rafraîchissement automatique toutes les 2 secondes

Voir [src/components/debug/README.md](src/components/debug/README.md) pour plus de détails.

### Tests de Performance

Exécuter les tests de performance :

```bash
# Voir le guide complet
cat docs/TEST_PERFORMANCE.md
```

**Métriques clés à surveiller** :
- Hit rate Redis : > 70% (bon)
- Temps de réponse avec cache : < 100ms
- Nombre de requêtes HTTP : -70% par rapport à sans cache

## ⚠️ Règles importantes

- ❌ **Ne JAMAIS commiter le fichier `.env`** (contient des passwords)
- ✅ Toujours utiliser `ddl-auto: update` (jamais `create` ou `create-drop`)
- ✅ Communiquer avant de modifier le schéma de base
- ✅ Partager le même `.env` avec toute l'équipe
- 🆕 **Ne PAS vider le cache Redis en production** (uniquement en dev)
- 🆕 **Respecter les TTL du cache** : 1-2 min frontend, 5 min backend

## 📚 Documentation Complète

### Guides d'Optimisation
- [📖 Intégration du Cache](docs/CACHE_INTEGRATION.md) - Architecture et stratégies de cache
- [🧪 Tests de Performance](docs/TEST_PERFORMANCE.md) - Guide de test et benchmarks
- [📝 Changelog Cache](docs/CHANGELOG_CACHE.md) - Historique des optimisations

### Bugs Connus
- [🐛 Bug Profile Update](docs/BUG_BACKEND_UPDATE_UTILISATEUR.md) - Problème modification profil
- [🔧 Correctifs 02/01/2026](docs/CORRECTIFS_02_01_2026.md) - Liste des correctifs appliqués

### Composants
- [🧰 CacheStats Debug Component](src/components/debug/README.md) - Visualisation du cache

## 📱 Frontend React

### Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
