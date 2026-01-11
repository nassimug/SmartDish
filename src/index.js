import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './services/config/axios.config'; // Importer la configuration Axios
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);