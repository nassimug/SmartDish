/**
 * Script pour récupérer un token JWT valide depuis le backend
 * Usage: node scripts/get_token.js <email> <password>
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:8092/api/utilisateurs';

async function getToken(email, password) {
    try {
        console.log('🔐 Tentative de connexion...');
        console.log('📧 Email:', email);
        
        const response = await axios.post(`${API_URL}/login`, {
            email,
            motDePasse: password
        });

        if (response.data && response.data.token) {
            const token = response.data.token;
            console.log('✅ Token récupéré avec succès!');
            console.log('🔑 Token:', token.substring(0, 50) + '...');
            
            // Sauvegarder dans token.txt
            const tokenPath = path.join(__dirname, '..', 'token.txt');
            fs.writeFileSync(tokenPath, token, 'utf8');
            console.log('💾 Token sauvegardé dans:', tokenPath);
            
            // Afficher les infos utilisateur
            if (response.data.utilisateur) {
                console.log('\n👤 Utilisateur:');
                console.log('   - ID:', response.data.utilisateur.id);
                console.log('   - Nom:', response.data.utilisateur.nom, response.data.utilisateur.prenom);
                console.log('   - Email:', response.data.utilisateur.email);
                console.log('   - Rôle:', response.data.utilisateur.role);
            }
        } else {
            console.error('❌ Pas de token dans la réponse');
        }
    } catch (error) {
        console.error('❌ Erreur lors de la connexion:');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Message:', error.response.data?.message || error.response.data);
        } else {
            console.error('   ', error.message);
        }
        process.exit(1);
    }
}

// Lire les arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
    console.log('Usage: node scripts/get_token.js <email> <password>');
    console.log('Exemple: node scripts/get_token.js nassim@example.com password123');
    process.exit(1);
}

getToken(email, password);
