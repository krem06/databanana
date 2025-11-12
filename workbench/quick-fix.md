# Quick CORS Fix for Trusted Developer

## Option 1: Chrome with Disabled Security (Fastest)

**Create a desktop shortcut/script:**

**Windows:**
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-web-security --user-data-dir="C:\temp\chrome_dev" --allow-running-insecure-content
```

**Mac:**
```bash
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_session" --disable-web-security
```

**Linux:**
```bash
google-chrome --disable-web-security --user-data-dir="/tmp/chrome_dev_session"
```

Then open `index.html` in this Chrome instance.

## Option 2: Simple Python Server (5 seconds)

**In the workbench folder:**
```bash
cd /Users/clementchazarra/Work/Perso/Databanana/workbench
python3 -m http.server 8000
```

**Then open:** `http://localhost:8000`

## Option 3: Node.js Proxy (If you have Node)

**Create `proxy.js`:**
```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');
const express = require('express');
const app = express();

app.use(express.static('.'));
app.use('/api', createProxyMiddleware({
  target: 'https://dkor79bcf8.execute-api.eu-west-1.amazonaws.com/Prod',
  changeOrigin: true,
  pathRewrite: { '^/api': '' }
}));

app.listen(3000, () => console.log('Server on http://localhost:3000'));
```

**Update script.js:** `const API_GATEWAY_URL = '/api';`

---

**Fastest = Option 1 (Chrome with disabled security)**