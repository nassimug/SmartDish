const { createProxyMiddleware } = require('http-proxy-middleware');

// Proxy local dev requests to the deployed services on Railway to bypass CORS
module.exports = function(app) {
  // Configuration commune pour les proxies
  const proxyOptions = {
    changeOrigin: true,
    secure: true,
    logLevel: 'warn', // 'debug' pour plus de détails, 'warn' pour moins de logs
    onProxyReq: (proxyReq, req, res) => {
      // Conserver tous les en-têtes de la requête originale
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }
      if (req.headers['content-type']) {
        proxyReq.setHeader('Content-Type', req.headers['content-type']);
      }
      console.log(`[Proxy] ${req.method} ${req.url} -> ${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      // Ajouter les en-têtes CORS
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    },
    onError: (err, req, res) => {
      console.error('[Proxy Error]', err);
      res.writeHead(500, {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      });
      res.end('Proxy error: ' + err.message);
    }
  };

  // Proxy pour ms-recette (déployé sur Railway)
  app.use(
    '/api/recettes',
    createProxyMiddleware({
      ...proxyOptions,
      target: 'https://ms-recette-production.up.railway.app',
      pathRewrite: {
        '^/api/recettes': '/api/recettes' // Pas de réécriture, on garde le chemin
      }
    })
  );

  // Note: ms-feedback est en local, donc pas besoin de proxy
  // Seul ms-recette nécessite un proxy car il a des problèmes CORS
};
