// Simple CORS proxy for testing workbench
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from current directory
app.use(express.static('.'));

// Proxy API calls to AWS with CORS handling
app.use('/api', createProxyMiddleware({
  target: 'https://dkor79bcf8.execute-api.eu-west-1.amazonaws.com/Prod',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '' // Remove /api prefix
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying: ${req.method} ${req.url} -> ${proxyReq.path}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
}));

app.listen(PORT, () => {
  console.log(`🚀 Workbench proxy server running at http://localhost:${PORT}`);
  console.log(`📁 Open http://localhost:${PORT}/index.html to use the workbench`);
  console.log(`🔄 API calls will be proxied to AWS Gateway`);
});