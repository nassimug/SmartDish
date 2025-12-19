import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navigation } from './components/layout/Navigation';
import ProtectedRoute from './routes/ProtectedRoute';
import routes from './routes';
import './App.css';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    {/* Navigation globale */}
                    <Navigation />

                    {/* Contenu principal */}
                    <main className="main-content">
                        <Routes>
                            {routes.map((route, index) => (
                                <Route
                                    key={index}
                                    path={route.path}
                                    element={
                                        route.isProtected ? (
                                            <ProtectedRoute>
                                                <route.element />
                                            </ProtectedRoute>
                                        ) : (
                                            <route.element />
                                        )
                                    }
                                />
                            ))}
                        </Routes>
                    </main>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;