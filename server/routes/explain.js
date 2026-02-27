const express = require('express');
const router = express.Router();
const github = require('../services/github');
const gemini = require('../services/gemini');

// POST /api/explain/file
router.post('/file', async (req, res) => {
    try {
        const { owner, repo, filePath, repoContext } = req.body;
        if (!filePath) return res.status(400).json({ error: 'filePath is required' });

        let content = req.body.content;
        if (!content && owner && repo) {
            content = await github.getFileContent(owner, repo, filePath);
        }

        const explanation = await gemini.explainFile(filePath, content, repoContext || '');
        res.json({ explanation, filePath, content });
    } catch (err) {
        console.error('Explain file error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/explain/folder
router.post('/folder', async (req, res) => {
    try {
        const { folderPath, children, repoContext } = req.body;
        if (!folderPath) return res.status(400).json({ error: 'folderPath is required' });

        const explanation = await gemini.explainFolder(folderPath, children || [], repoContext || '');
        res.json({ explanation, folderPath });
    } catch (err) {
        console.error('Explain folder error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
