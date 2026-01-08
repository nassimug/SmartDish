// Test rapide de normalisation des URLs
// Copiez-collez dans la console du navigateur (F12)

const testUrls = [
    'https://minio-production-94bb.up.railway.app/recettes-bucket/recettes/68/images/test.jpg',
    'http://minio:9000/recettes-bucket/recettes/68/images/test.jpg',
    'http://localhost:9002/recettes/68/images/test.jpg',
    'recettes-bucket/recettes/68/images/test.jpg',
    'recettes/68/images/test.jpg'
];

console.group('🧪 Test de normalisation des URLs');

// Import de la fonction (si elle est exportée)
import { normalizeImageUrl } from './src/utils/imageUrlHelper';

testUrls.forEach(url => {
    const normalized = normalizeImageUrl(url);
    console.log('Input: ', url);
    console.log('Output:', normalized);
    console.log('✅ OK:', !normalized.includes('/recettes-bucket/recettes/'));
    console.log('---');
});

console.groupEnd();

// Test de l'URL actuelle problématique
const problematicUrl = 'https://minio-production-94bb.up.railway.app/recettes-bucket/recettes/68/images/da98d316-a396-4b22-a9a8-5bb2dbb6015e.jpg';
const fixed = normalizeImageUrl(problematicUrl);
console.log('🔧 URL problématique fixée:');
console.log('Avant:', problematicUrl);
console.log('Après:', fixed);

// Tester si l'image se charge
const testImg = new Image();
testImg.onload = () => console.log('✅ Image chargée avec succès!');
testImg.onerror = () => console.error('❌ Image toujours inaccessible');
testImg.src = fixed;
