const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5001',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api', // No rewrite needed as we want to keep /api prefix
      },
      logLevel: 'debug',
    })
  );
}; 