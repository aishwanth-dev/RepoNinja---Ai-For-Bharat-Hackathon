const express = require('express');
const router = express.Router();
const github = require('../services/github');
const gemini = require('../services/gemini');

// POST /api/analyze — analyze a GitHub repository
router.post('/', async (req, res) => {
    try {
        const { repoUrl } = req.body;
        if (!repoUrl) return res.status(400).json({ error: 'repoUrl is required' });

        const { owner, repo } = github.parseGitHubUrl(repoUrl);

        // Fetch repo info, tree in parallel
        const [repoInfo, tree] = await Promise.all([
            github.getRepoInfo(owner, repo),
            github.getRepoTree(owner, repo)
        ]);

        // Select key files and fetch their content
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

        // Generate AI summary
        const summary = await gemini.analyzeRepo(repoInfo, keyFilesContent);

        res.json({
            owner,
            repo,
            repoInfo: {
                name: repoInfo.full_name,
                description: repoInfo.description,
                language: repoInfo.language,
                stars: repoInfo.stargazers_count,
                forks: repoInfo.forks_count
            },
            tree,
            summary,
            keyFiles: keyFilesContent.map(f => f.path)
        });
    } catch (err) {
        console.error('Analyze error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
