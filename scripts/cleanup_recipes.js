#!/usr/bin/env node
/*
 SmartDish cleanup script
 - Lists and optionally deletes low-quality recipes from backend
 - Criteria (default): statut !== 'VALIDEE' OR missing/short title OR no ingredients/steps OR inactive
 - Dry-run by default; use --apply to perform deletions
 - Use env JWT_TOKEN for authenticated DELETE via ms-recette
*/

const axios = require('axios');

const PERSIST_URL = process.env.PERSIST_URL || 'http://localhost:8090/api/persistance/recettes';
const RECETTE_URL = process.env.RECETTE_URL || 'http://localhost:8093/api/recettes';
const APPLY = process.argv.includes('--apply');
const INCLUDE_VALIDATED = process.argv.includes('--include-validated');
const DELETE_ALL = process.argv.includes('--delete-all');
const CREATED_BEFORE = process.argv.find(a => a.startsWith('--created-before='))?.split('=')[1];
const TOKEN = process.env.JWT_TOKEN || '';

function isGibberish(title) {
  if (!title) return true;
  const t = title.trim();
  if (t.length < 5) return true;
  const suspicious = /lorem|ipsum|test|default|zz+|xx+|\b123\b|\d{4,}/i;
  if (suspicious.test(t)) return true;
  // too few letters or too many non-word chars
  const letters = (t.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) || []).length;
  const nonWord = (t.match(/[^\wÀ-ÖØ-öø-ÿ\s]/g) || []).length;
  if (letters < 3) return true;
  if (nonWord > letters) return true;
  return false;
}

function meetsCleanupCriteria(r) {
  const notValidated = r.statut !== 'VALIDEE';
  const inactive = r.actif === false;
  const badTitle = isGibberish(r.titre);
  const noIngredients = !Array.isArray(r.ingredients) || r.ingredients.length === 0;
  const noSteps = !Array.isArray(r.etapes) || r.etapes.length === 0;
  let beforeDate = false;
  if (CREATED_BEFORE && r.dateCreation) {
    try {
      beforeDate = new Date(r.dateCreation) < new Date(CREATED_BEFORE);
    } catch {}
  }
  const candidate = notValidated || inactive || badTitle || noIngredients || noSteps || beforeDate;
  // unless INCLUDE_VALIDATED is set, protect validated recipes even if other criteria match
  if (!INCLUDE_VALIDATED && r.statut === 'VALIDEE') return false;
  return candidate;
}

async function main() {
  console.log(`Fetching recipes from ${PERSIST_URL} ...`);
  const { data } = await axios.get(PERSIST_URL, { validateStatus: () => true });
  if (!Array.isArray(data)) {
    console.error('Unexpected response, expected array. Got:', typeof data);
    process.exit(1);
  }
  const candidates = DELETE_ALL ? data : data.filter(meetsCleanupCriteria);
  console.log(`Total recipes: ${data.length}`);
  console.log(`Candidates for deletion: ${candidates.length}`);
  console.log('Sample list (up to 20):');
  candidates.slice(0, 20).forEach(r => {
    console.log(` - #${r.id} [${r.statut}${r.actif===false?'/inactive':''}] ${r.titre || '(no title)'} | ingr:${r.ingredients?.length||0} steps:${r.etapes?.length||0}`);
  });

  if (!APPLY) {
    console.log('\nDry-run complete. Re-run with --apply to delete candidates.');
    console.log('Env: set JWT_TOKEN to an admin token if deletion requires auth.');
    if (DELETE_ALL) {
      console.warn('\n[Warning] --delete-all selected: this will attempt to delete ALL recipes. Ensure you have backups.');
    }
    return;
  }

  if (!TOKEN) {
    console.error('JWT_TOKEN env var is required to perform deletions.');
    process.exit(1);
  }

  const headers = { Authorization: `Bearer ${TOKEN}` };
  let deleted = 0, failed = 0;
  for (const r of candidates) {
    try {
      const url = `${RECETTE_URL}/${r.id}`;
      const resp = await axios.delete(url, { headers, validateStatus: () => true });
      if (resp.status >= 200 && resp.status < 300) {
        deleted++;
        console.log(`Deleted #${r.id} ${r.titre || ''}`);
      } else {
        failed++;
        console.warn(`Failed to delete #${r.id}: status ${resp.status}`);
      }
    } catch (e) {
      failed++;
      console.warn(`Error deleting #${r.id}: ${e.message}`);
    }
  }
  console.log(`\nCleanup complete. Deleted: ${deleted}, Failed: ${failed}`);
}

main().catch(err => {
  console.error('Cleanup error:', err);
  process.exit(1);
});
