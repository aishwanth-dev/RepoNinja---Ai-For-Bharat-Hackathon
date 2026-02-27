const express = require('express');
const router = express.Router();
const github = require('../services/github');
const gemini = require('../services/gemini');

// POST /api/walkthrough
router.post('/', async (req, res) => {
    try {
        const { repoSummary, tree, owner, repo } = req.body;
        if (!tree) return res.status(400).json({ error: 'tree is required' });

        // Get key files content for walkthrough generation
        const keyFiles = github.selectKeyFiles(tree);
        const keyFilesContent = await Promise.all(
            keyFiles.map(async (f) => {
                try {
                    const content = await github.getFileContent(owner, repo, f.path);
                    return { path: f.path, content };
                } catch {
                    return { path: f.path, content: '' };
                }
            })
        );

        const steps = await gemini.generateWalkthrough(repoSummary, tree, keyFilesContent);
        res.json({ steps });
    } catch (err) {
        console.error('Walkthrough error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
