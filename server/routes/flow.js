const express = require('express');
const router = express.Router();
const gemini = require('../services/gemini');

// POST /api/flow
router.post('/', async (req, res) => {
    try {
        const { repoSummary, level } = req.body;
        if (!repoSummary) return res.status(400).json({ error: 'repoSummary is required' });

        const validLevels = ['overview', 'simple', 'deep'];
        const flowLevel = validLevels.includes(level) ? level : 'simple';

        const mermaid = await gemini.generateFlow(repoSummary, flowLevel);
        res.json({ mermaid, level: flowLevel });
    } catch (err) {
        console.error('Flow error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
