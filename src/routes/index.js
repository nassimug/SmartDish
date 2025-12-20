import HomePage from '../pages/Home/HomePage';
import IngredientsPage from '../pages/Ingredients/IngredientsPage';
import SuggestionsPage from '../pages/Suggestions/SuggestionsPage';
import RecipePage from '../pages/Recipe/RecipePage';
import FavoritesPage from '../pages/Favorites/FavoritesPage';
import {NotFoundPage} from "../pages/NotFound/NotFoundPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import LoginPage from "../pages/Auth/LoginPage";
import AccountPage from "../pages/Account/AccountPage";
import PlannerPage from "../pages/Planner/PlannerPage";


export const routes = [
    // Routes publiques
    {
        path: '/',
        element: HomePage,
        name: 'Accueil',
        isProtected: false,
    },
    {
        path: '/login',
        element: LoginPage,
        name: 'Connexion',
        isProtected: false,
    },
    {
        path: '/register',
        element: RegisterPage,
        name: 'Inscription',
        isProtected: false,
    },
    {
        path: '/ingredients',
        element: IngredientsPage,
        name: 'Mes Ingrédients',
        isProtected: false,
    },
    {
        path: '/suggestions',
        element: SuggestionsPage,
        name: 'Suggestions IA',
        isProtected: false,
    },
    {
        path: '/recette/:id',
        element: RecipePage,
        name: 'Détail Recette',
        isProtected: false,
    },

     // Route 404
    {
        path: '*',
        element: NotFoundPage,
        name: '404',
        isProtected: false,
    },

    // Routes protégées (nécessitent authentification)
    {
        path: '/favoris',
        element: FavoritesPage,
        name: 'Mes Favoris',
        isProtected: true,
    },
    {
        path: '/planificateur',
        element: PlannerPage,
        name: 'Planificateur',
        isProtected: true,
    },
    {
        path: '/compte',
        element: AccountPage,
        name: 'Mon Compte',
        isProtected: true,
    },
];

export const navigationRoutes = [
    {
        path: '/',
        name: 'Accueil',
        icon: 'Home',
    },
    {
        path: '/ingredients',
        name: 'Ingrédients',
        icon: 'ShoppingBasket',
    },
    {
        path: '/suggestions',
        name: 'Suggestions',
        icon: 'Sparkles',
    },
    {
        path: '/planificateur',
        name: 'Planificateur',
        icon: 'Calendar',
    },
    {
        path: '/favoris',
        name: 'Favoris',
        icon: 'Heart',
    },
    {
        path: '/compte',
        name: 'Compte',
        icon: 'User',
    },
];

export default routes;