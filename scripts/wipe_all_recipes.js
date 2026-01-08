#!/usr/bin/env node
/**
 * Supprime TOUTES les recettes via l'API ms-recette
 * Usage: JWT_TOKEN=your_token node scripts/wipe_all_recipes.js
 */

const axios = require('axios');

const PERSIST_URL = process.env.PERSIST_URL || process.env.REACT_APP_PERSISTENCE_SERVICE_URL ? `${process.env.REACT_APP_PERSISTENCE_SERVICE_URL}/recettes` : 'https://ms-persistance-production.up.railway.app/api/persistance/recettes';
const RECETTE_URL = process.env.RECETTE_URL || 'https://ms-recette-production.up.railway.app/api/recettes';
const TOKEN = process.env.JWT_TOKEN || '';

async function main() {
  console.log('📊 Récupération de toutes les recettes...');
  
  const { data } = await axios.get(PERSIST_URL);
  if (!Array.isArray(data)) {
    console.error('❌ Réponse inattendue:', typeof data);
    process.exit(1);
  }

  console.log(`\n✅ Total de recettes trouvées: ${data.length}`);
  
  if (data.length === 0) {
    console.log('ℹ️  La base est déjà vide!');
    return;
  }

  // Afficher quelques exemples
  console.log('\n📋 Exemples de recettes à supprimer:');
  data.slice(0, 10).forEach(r => {
    console.log(`  - #${r.id} [${r.statut || 'N/A'}] ${r.titre || '(sans titre)'}`);
  });
  
  if (data.length > 10) {
    console.log(`  ... et ${data.length - 10} autres`);
  }

  console.log('\n⚠️  ATTENTION: Cette opération va supprimer TOUTES les recettes!');
  console.log('Appuyez sur Ctrl+C pour annuler dans les 3 secondes...');
  
  await new Promise(resolve => setTimeout(resolve, 3000));

  if (!TOKEN) {
    console.error('\n❌ JWT_TOKEN requis pour effectuer les suppressions.');
    console.error('Usage: JWT_TOKEN=your_token node scripts/wipe_all_recipes.js');
    process.exit(1);
  }

  console.log('\n🗑️  Suppression en cours...');
  const headers = { Authorization: `Bearer ${TOKEN}` };
  let deleted = 0, failed = 0;

  for (const r of data) {
    try {
      const url = `${RECETTE_URL}/${r.id}`;
      const resp = await axios.delete(url, { headers, validateStatus: () => true });
      if (resp.status >= 200 && resp.status < 300) {
        deleted++;
        process.stdout.write(`\r✅ Supprimé: ${deleted}/${data.length}`);
      } else {
        failed++;
        console.log(`\n⚠️  Échec #${r.id}: statut ${resp.status}`);
      }
    } catch (e) {
      failed++;
      console.log(`\n❌ Erreur #${r.id}: ${e.message}`);
    }
  }

  console.log(`\n\n✅ Nettoyage terminé!`);
  console.log(`   - Supprimés: ${deleted}`);
  console.log(`   - Échecs: ${failed}`);
  console.log(`   - Restants: ${data.length - deleted}`);
}

main().catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
