const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;
const CONTENT_PATH = path.join(__dirname, 'content.json');

app.use(express.json({ limit: '1mb' }));

// Static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// API: Get content
app.get('/api/content', (req, res) => {
  try {
    const data = fs.readFileSync(CONTENT_PATH, 'utf-8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Failed to read content' });
  }
});

// API: Save content
app.post('/api/content', (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid content data' });
    }
    fs.writeFileSync(CONTENT_PATH, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save content' });
  }
});

// Stock data proxy (Yahoo Finance — free, no API key)
const stockCache = {};
const CACHE_TTL = 60000; // 1 minute

app.get('/api/stock/:symbol', (req, res) => {
  const symbol = encodeURIComponent(req.params.symbol);
  const range = req.query.range || '6mo';
  const interval = req.query.interval || '1d';
  const cacheKey = `${symbol}_${range}_${interval}`;

  if (stockCache[cacheKey] && Date.now() - stockCache[cacheKey].time < CACHE_TTL) {
    return res.json(stockCache[cacheKey].data);
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;

  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        stockCache[cacheKey] = { data: parsed, time: Date.now() };
        res.json(parsed);
      } catch (e) {
        res.status(500).json({ error: 'Failed to parse stock data' });
      }
    });
  }).on('error', () => {
    res.status(500).json({ error: 'Failed to fetch stock data' });
  });
});

app.listen(PORT, () => {
  console.log(`Nike Surge X running on http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
