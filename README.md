# SmartDish

Application de gestion de recettes intelligente avec recommandations IA.

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

# MinIO (stockage local)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

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
| MS-Persistance | 8090 | Service de persistance |
| MS-Utilisateur | 8092 | Gestion utilisateurs & JWT |
| MS-Recette | 8093 | Gestion recettes |
| MS-Feedback | 8091 | Gestion feedbacks |
| MS-Recommandation | 8095 | Recommandations IA (Ollama) |
| MinIO | 9002/9003 | Stockage S3 |

### Base de données

- **MySQL** : Railway Cloud (partagé par l'équipe)
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

# Redémarrer un service
docker-compose restart ms-utilisateur

# Tout arrêter
docker-compose down
```

## ⚠️ Règles importantes

- ❌ **Ne JAMAIS commiter le fichier `.env`** (contient des passwords)
- ✅ Toujours utiliser `ddl-auto: update` (jamais `create` ou `create-drop`)
- ✅ Communiquer avant de modifier le schéma de base
- ✅ Partager le même `.env` avec toute l'équipe

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
