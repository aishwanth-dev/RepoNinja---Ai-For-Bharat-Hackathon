const express = require('express');
const router = express.Router();
const gemini = require('../services/gemini');

// POST /api/chat
router.post('/', async (req, res) => {
    try {
        const { messages, context } = req.body;
        if (!messages || !messages.length) {
            return res.status(400).json({ error: 'messages are required' });
        }

        const response = await gemini.chat(messages, context || {});
        res.json({ response });
    } catch (err) {
        console.error('Chat error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
