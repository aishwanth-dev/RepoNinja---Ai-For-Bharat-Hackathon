const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function getModel() {
    return genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
}

// Robust JSON parser
function safeParseJSON(text) {
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        const objMatch = cleaned.match(/\{[\s\S]*\}/);
        if (objMatch) { try { return JSON.parse(objMatch[0]); } catch { } }
        const arrMatch = cleaned.match(/\[[\s\S]*\]/);
        if (arrMatch) { try { return JSON.parse(arrMatch[0]); } catch { } }
        throw new Error(`Failed to parse AI response as JSON: ${cleaned.substring(0, 200)}`);
    }
}

// Analyze repository
async function analyzeRepo(repoInfo, keyFilesContent) {
    const model = getModel();
    const prompt = `You are RepoNinja, an expert code analysis AI. Analyze this GitHub repository and provide a comprehensive, detailed summary.

Repository: ${repoInfo.name}
Description: ${repoInfo.description || 'No description'}
Language: ${repoInfo.language || 'Unknown'}
Stars: ${repoInfo.stargazers_count}

Key files and their contents:
${keyFilesContent.map(f => `--- ${f.path} ---\n${f.content?.substring(0, 3000) || '(empty)'}`).join('\n\n')}

Provide a JSON response with this exact structure (no markdown, just raw JSON):
{
  "summary": "A comprehensive 5-8 sentence detailed overview. Explain what the project does, its main purpose, who it's for, what problem it solves, and how it works at a high level. Be thorough and educational.",
  "techStack": ["list", "of", "technologies"],
  "architecture": "A detailed 3-4 sentence description of the architecture pattern, how components interact, and the data flow.",
  "keyFeatures": ["detailed feature 1", "detailed feature 2", "detailed feature 3", "detailed feature 4", "detailed feature 5"],
  "entryPoint": "path/to/main/entry/file"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    try {
        return safeParseJSON(text);
    } catch (e) {
        console.error('Failed to parse repo analysis:', e.message);
        return {
            summary: text.substring(0, 800),
            techStack: [],
            architecture: 'Could not determine architecture',
            keyFeatures: ['Analysis completed but format was unexpected'],
            entryPoint: ''
        };
    }
}

// Explain a file — DETAILED
async function explainFile(fileName, content, repoContext) {
    const model = getModel();
    const prompt = `You are RepoNinja, an expert code mentor providing in-depth educational explanations. Explain this file thoroughly to help a developer fully understand it.

Repository context: ${repoContext}

File: ${fileName}
Content:
\`\`\`
${content?.substring(0, 8000) || '(empty)'}
\`\`\`

Provide a DETAILED, THOROUGH explanation covering ALL of the following:

## Purpose
What this file does, why it exists, and what problem it solves. Be specific — don't just say "it handles X", explain HOW it handles X.

## Role in Architecture
How this file fits into the overall project. What depends on it? What does it depend on? Where does it sit in the data flow?

## Code Walkthrough
Go through the key sections of the code:
- Explain important imports and why they're needed
- Describe each major function/class and what it does
- Explain the logic flow step by step
- Point out any patterns or design decisions

## Key Concepts
Explain any important programming concepts, patterns, or techniques used (e.g., middleware pattern, observer pattern, dependency injection, etc.)

## Connections
What other files or modules does this connect to? How does data flow in and out?

Be thorough, educational, and detailed. Write at least 300 words. Use markdown formatting with headers.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
}

// Explain a folder — DETAILED
async function explainFolder(folderPath, children, repoContext) {
    const model = getModel();
    const prompt = `You are RepoNinja, an expert code mentor. Provide a detailed explanation of this folder's role in the project.

Repository context: ${repoContext}

Folder: ${folderPath}
Contents: ${children.join(', ')}

Explain in detail:

## Purpose
What this folder contains, why it's organized this way, and what role it plays.

## Key Files
For each important file, briefly explain what it does and why it matters.

## Architecture Role
How this folder fits into the broader project architecture. What depends on it?

## Relationships
How do files in this folder interact with each other and with code outside this folder?

Be thorough and educational. Write at least 150 words. Use markdown.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
}

// Generate walkthrough — MULTI-STEP PER FILE
async function generateWalkthrough(repoSummary, tree, keyFilesContent) {
    const model = getModel();

    const fileList = [];
    function flatten(nodes) {
        for (const n of nodes) {
            if (n.type === 'file') fileList.push(n.path);
            if (n.children) flatten(n.children);
        }
    }
    flatten(tree);

    const prompt = `You are RepoNinja, an expert code mentor. Generate a DETAILED structured learning walkthrough for this repository.

Repository Summary: ${JSON.stringify(repoSummary)}

Available files:
${fileList.slice(0, 100).join('\n')}

Key files content:
${keyFilesContent.map(f => `--- ${f.path} ---\n${f.content?.substring(0, 2000) || '(empty)'}`).join('\n\n')}

IMPORTANT RULES:
1. Generate 10-15 walkthrough steps total
2. For LARGE/IMPORTANT files, create 2-3 steps covering different sections of the SAME file
3. For small config files, 1 step is enough
4. Each step should focus on a specific section of code with clear line ranges
5. Explanations should be DETAILED — at least 100 words per step
6. The walkthrough should tell a STORY — how the code connects and flows

Return a JSON array (no markdown, just raw JSON):
[
  {
    "step": 1,
    "title": "Descriptive Step Title",
    "file": "exact/path/to/file",
    "startLine": 1,
    "endLine": 25,
    "explanation": "## What We're Looking At\\n\\nDetailed markdown explanation of this section. Explain every important line, what patterns are used, and how it connects to the next step. Be a mentor — teach the developer WHY, not just WHAT.\\n\\n### Key Points\\n- Point 1\\n- Point 2\\n- Point 3"
  }
]

CRITICAL:
- "file" must match exactly one of the available files listed above
- A single file CAN appear in multiple steps with DIFFERENT line ranges
- startLine and endLine should highlight specific important sections, not the entire file
- Cover: entry point, configuration, routing/structure, core logic, utilities, data layer`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    try {
        return safeParseJSON(text);
    } catch (e) {
        console.error('Failed to parse walkthrough:', e.message);
        return [{
            step: 1,
            title: 'Project Overview',
            file: keyFilesContent[0]?.path || '',
            startLine: 1,
            endLine: 20,
            explanation: text.substring(0, 1000)
        }];
    }
}

// Generate architecture flow — with SAFE node labels
async function generateFlow(repoSummary, level) {
    const model = getModel();

    const levelInstructions = {
        overview: `ONLY draw 3-4 boxes showing the broadest architecture layers. Example: Client, Server, Database. Maximum 4 nodes and 3 arrows. This is a bird's-eye view, no details at all. Use very short 1-2 word labels.`,
        simple: `Draw 8-12 nodes showing the module-level architecture. Include major folders/modules as separate nodes. Show which modules depend on which. Include: entry points, routing layer, business logic modules, data access, external services. Show arrows for dependencies. Labels should be 2-3 words. This must look DIFFERENT from the overview — it should have at least 2x more nodes.`,
        deep: `Draw 15-20 nodes showing a DETAILED request lifecycle and data flow. Start from user action, trace through every layer: UI Component -> Event Handler -> API Call -> Express Router -> Middleware -> Controller -> Service -> Database Query -> Response transformation -> UI Update. Include error handling paths. Show sub-processes like authentication, validation, caching. Use subgraphs if possible. This must show SIGNIFICANTLY more detail than simple mode — at least 3x more connections.`
    };

    const prompt = `You are RepoNinja. Generate a Mermaid diagram for this repository's architecture.

Repository: ${JSON.stringify(repoSummary)}

Detail level: ${level}
Instructions: ${levelInstructions[level] || levelInstructions.simple}

CRITICAL MERMAID SYNTAX RULES:
1. Use "graph TD" format
2. Node labels MUST use square brackets with ONLY alphanumeric characters, spaces, and hyphens
3. Do NOT use parentheses (), periods, dots, or special characters inside node labels
4. WRONG: A[Extension Entry Point (extension.ts)]
5. CORRECT: A[Extension Entry Point]
6. Keep node labels SHORT — max 3-4 words
7. Use proper arrow syntax: -->

Return ONLY valid Mermaid diagram text. No markdown fences, no explanation.

Example:
graph TD
    A[Frontend App] --> B[API Server]
    B --> C[Auth Service]
    B --> D[Database]
    C --> D`;

    const result = await model.generateContent(prompt);
    let mermaid = result.response.text().replace(/```mermaid\n?/g, '').replace(/```\n?/g, '').trim();
    // Sanitize node labels — remove problematic chars from brackets
    mermaid = mermaid.replace(/\[([^\]]*)\]/g, (match, label) => {
        const clean = label.replace(/[()\.]/g, '').replace(/\s+/g, ' ').trim();
        return `[${clean}]`;
    });
    return mermaid;
}

// Chat with context
async function chat(messages, context) {
    const model = getModel();

    const systemContext = `You are RepoNinja, an AI coding mentor helping a developer understand a GitHub repository. You provide thorough, detailed answers.

Current context:
- Repository: ${context.repoSummary || 'Unknown'}
- Current file: ${context.currentFile || 'None selected'}
- Current file content (excerpt): ${context.fileContent?.substring(0, 4000) || 'N/A'}
- Walkthrough step: ${context.walkthroughStep || 'Not in walkthrough'}
${context.doubtContext ? `- Developer has a doubt about: ${context.doubtContext}` : ''}

Answer the developer's question thoroughly and clearly. Reference specific code lines when relevant. Explain concepts in depth. Use markdown formatting. Give examples if helpful.`;

    const chatHistory = messages.map(m => `${m.role === 'user' ? 'Developer' : 'RepoNinja'}: ${m.content}`).join('\n\n');

    const prompt = `${systemContext}\n\nConversation:\n${chatHistory}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
}

module.exports = {
    analyzeRepo,
    explainFile,
    explainFolder,
    generateWalkthrough,
    generateFlow,
    chat
};
