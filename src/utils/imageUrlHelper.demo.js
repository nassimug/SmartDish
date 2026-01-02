/**
 * Demo: Testing the image URL normalization flow
 * 
 * Simulates what happens when the frontend receives recipe data from the API
 * and normalizes the image URLs for MinIO bucket compatibility
 */

import { normalizeImageUrl, normalizeRecipeImageUrl, normalizeRecipesImageUrls } from './imageUrlHelper';

// Simulate API response (before normalization)
const apiResponse = {
    id: 40,
    titre: 'pates carbo',
    description: 'recette gourmande de pates',
    imageUrl: 'http://localhost:9002/recettes/40/614eeb2c-2494-40b5-a817-b11705dbe757.jpg',
    statut: 'REJETEE'
};

console.log('='.repeat(70));
console.log('FRONTEND IMAGE URL NORMALIZATION DEMO');
console.log('='.repeat(70));

console.log('\n📩 STEP 1: API returns recipe with wrong image URL path');
console.log('Original API Response:');
console.log(JSON.stringify(apiResponse, null, 2));

console.log('\n🔄 STEP 2: Frontend normalizes the URL');
const normalizedRecipe = normalizeRecipeImageUrl(apiResponse);
console.log('After normalization:');
console.log(JSON.stringify(normalizedRecipe, null, 2));

console.log('\n✅ STEP 3: Frontend renders image tag with corrected URL');
console.log(`<img src="${normalizedRecipe.imageUrl}" alt="${normalizedRecipe.titre}" />`);

console.log('\n🌐 STEP 4: Browser requests image from MinIO');
console.log(`GET ${normalizedRecipe.imageUrl}`);

console.log('\n' + '='.repeat(70));
console.log('RESULT: Image now points to correct MinIO bucket!');
console.log('='.repeat(70));

// Multiple recipes
console.log('\n\n📚 HANDLING MULTIPLE RECIPES');
console.log('='.repeat(70));

const multipleRecipes = [
    { id: 38, imageUrl: 'http://localhost:9002/recettes/38/image1.jpg' },
    { id: 39, imageUrl: 'http://localhost:9002/recettes/39/image2.jpg' },
    { id: 40, imageUrl: 'http://localhost:9002/recettes/40/image3.jpg' }
];

console.log('\n❌ Before normalization:');
multipleRecipes.forEach(r => console.log(`Recipe ${r.id}: ${r.imageUrl}`));

const normalized = normalizeRecipesImageUrls(multipleRecipes);

console.log('\n✅ After normalization:');
normalized.forEach(r => console.log(`Recipe ${r.id}: ${r.imageUrl}`));

console.log('\n' + '='.repeat(70));
