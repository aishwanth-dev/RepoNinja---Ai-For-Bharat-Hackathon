require('dotenv').config();
const express = require('express');
const cors = require('cors');

const analyzeRoutes = require('./routes/analyze');
const explainRoutes = require('./routes/explain');
const walkthroughRoutes = require('./routes/walkthrough');
const flowRoutes = require('./routes/flow');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/analyze', analyzeRoutes);
app.use('/api/explain', explainRoutes);
app.use('/api/walkthrough', walkthroughRoutes);
app.use('/api/flow', flowRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🥷 RepoNinja server running on port ${PORT}`);
});
