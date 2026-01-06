import axios from 'axios';

// Configuration par défaut
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Intercepteur de requête pour logger toutes les requêtes
axios.interceptors.request.use(
    (config) => {
        // S'assurer que Content-Type est défini pour les requêtes POST/PUT/PATCH
        if (['post', 'put', 'patch'].includes(config.method) && !config.headers['Content-Type']) {
            config.headers['Content-Type'] = 'application/json';
        }
        
        console.log(`📤 [HTTP Request] ${config.method?.toUpperCase()} ${config.url}`);
        console.log('   Headers:', config.headers);
        console.log('   Data:', config.data);
        return config;
    },
    (error) => {
        console.error('❌ [HTTP Request Error]', error);
        return Promise.reject(error);
    }
);

// Intercepteur de réponse pour logger toutes les réponses
axios.interceptors.response.use(
    (response) => {
        console.log(`✅ [HTTP Response] ${response.config.method?.toUpperCase()} ${response.config.url}`);
        console.log('   Status:', response.status);
        console.log('   Data:', response.data);
        return response;
    },
    (error) => {
        // Reduce noise for expected network errors during backend startup
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
            console.warn(`⚠️ [HTTP Network Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} - Backend may be starting up`);
        } else {
            console.error(`❌ [HTTP Response Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
            console.error('   Status:', error.response?.status);
            console.error('   Data:', error.response?.data);
            console.error('   Message:', error.message);
        }
        return Promise.reject(error);
    }
);

export default axios;
