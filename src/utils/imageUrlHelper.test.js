/**
 * Test script for image URL normalization
 * This demonstrates how the imageUrlHelper normalizes MinIO paths
 */

import { normalizeImageUrl, normalizeRecipeImageUrl, normalizeRecipesImageUrls } from './imageUrlHelper';

// Test 1: Simple URL normalization
console.log('\n=== Test 1: Simple URL normalization ===');
const wrongUrl = 'http://localhost:9002/recettes/40/614eeb2c-2494-40b5-a817-b11705dbe757.jpg';
const correctUrl = normalizeImageUrl(wrongUrl);
console.log('Input:', wrongUrl);
console.log('Output:', correctUrl);
console.log('Expected: http://localhost:9002/recettes-bucket/40/614eeb2c-2494-40b5-a817-b11705dbe757.jpg');
console.log('Match:', correctUrl === 'http://localhost:9002/recettes-bucket/40/614eeb2c-2494-40b5-a817-b11705dbe757.jpg');

// Test 2: Recipe object normalization
console.log('\n=== Test 2: Recipe object normalization ===');
const recipe = {
    id: 40,
    titre: 'Pâtes à la Carbonara',
    imageUrl: 'http://localhost:9002/recettes/40/614eeb2c-2494-40b5-a817-b11705dbe757.jpg',
    image: 'http://localhost:9002/recettes/40/614eeb2c-2494-40b5-a817-b11705dbe757.jpg'
};
const normalizedRecipe = normalizeRecipeImageUrl(recipe);
console.log('Input recipe:', recipe);
console.log('Output recipe:', normalizedRecipe);
console.log('Match:', normalizedRecipe.imageUrl === 'http://localhost:9002/recettes-bucket/40/614eeb2c-2494-40b5-a817-b11705dbe757.jpg');

// Test 3: Array of recipes normalization
console.log('\n=== Test 3: Array of recipes normalization ===');
const recipes = [
    { id: 38, imageUrl: 'http://localhost:9002/recettes/38/file1.jpg' },
    { id: 39, imageUrl: 'http://localhost:9002/recettes/39/file2.jpg' },
    { id: 40, imageUrl: 'http://localhost:9002/recettes/40/file3.jpg' }
];
const normalizedRecipes = normalizeRecipesImageUrls(recipes);
console.log('Input recipes count:', recipes.length);
console.log('Output recipes count:', normalizedRecipes.length);
console.log('All normalized correctly:', normalizedRecipes.every(r => r.imageUrl.includes('recettes-bucket')));

// Test 4: Edge case - null/undefined
console.log('\n=== Test 4: Edge cases ===');
console.log('Null URL:', normalizeImageUrl(null));
console.log('Undefined URL:', normalizeImageUrl(undefined));
console.log('Empty string:', normalizeImageUrl(''));

// Test 5: Already correct URL should not change
console.log('\n=== Test 5: Already correct URL ===');
const alreadyCorrect = 'http://localhost:9002/recettes-bucket/40/file.jpg';
const result = normalizeImageUrl(alreadyCorrect);
console.log('Input:', alreadyCorrect);
console.log('Output:', result);
console.log('Match:', result === alreadyCorrect);

console.log('\n=== All tests completed ===\n');
