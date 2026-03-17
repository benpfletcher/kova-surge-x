const express = require('express');
const fs = require('fs');
const path = require('path');

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

app.listen(PORT, () => {
  console.log(`KOVA CMS running on http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
