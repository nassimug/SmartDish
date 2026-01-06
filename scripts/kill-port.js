const { execSync } = require('child_process');

const port = process.argv[2] || '3000';

console.log(`🔍 Recherche du processus sur le port ${port}...`);

try {
  if (process.platform === 'win32') {
    // Windows
    const result = execSync(`powershell "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"`, { encoding: 'utf8' });
    
    if (result.trim()) {
      const pids = result.trim().split('\n').map(p => p.trim()).filter(p => p);
      
      pids.forEach(pid => {
        console.log(`🔫 Arrêt du processus ${pid} sur le port ${port}...`);
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' });
      });
      
      console.log(`✅ Port ${port} libéré!`);
    } else {
      console.log(`✅ Port ${port} déjà libre.`);
    }
  } else {
    // Linux/Mac
    const result = execSync(`lsof -ti:${port}`, { encoding: 'utf8' });
    
    if (result.trim()) {
      execSync(`kill -9 ${result.trim()}`, { stdio: 'inherit' });
      console.log(`✅ Port ${port} libéré!`);
    } else {
      console.log(`✅ Port ${port} déjà libre.`);
    }
  }
} catch (error) {
  if (error.stdout && error.stdout.toString().trim()) {
    console.log(`✅ Port ${port} déjà libre.`);
  } else {
    console.log(`✅ Aucun processus trouvé sur le port ${port}.`);
  }
}
