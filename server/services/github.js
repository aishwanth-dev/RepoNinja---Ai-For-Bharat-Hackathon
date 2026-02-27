const GITHUB_API = 'https://api.github.com';

function getHeaders() {
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'RepoNinja'
    };
    if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }
    return headers;
}

// Parse owner/repo from GitHub URL
function parseGitHubUrl(url) {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

// Get repository tree (recursive)
async function getRepoTree(owner, repo) {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, {
        headers: getHeaders()
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`GitHub API error: ${res.status} — ${err}`);
    }
    const data = await res.json();
    return buildTree(data.tree);
}

// Build hierarchical tree from flat array
function buildTree(flatTree) {
    const root = { name: '/', path: '', type: 'folder', children: [] };
    const map = { '': root };

    // Sort so folders come before files
    const sorted = flatTree
        .filter(item => item.type === 'blob' || item.type === 'tree')
        .sort((a, b) => a.path.localeCompare(b.path));

    for (const item of sorted) {
        const parts = item.path.split('/');
        const name = parts[parts.length - 1];
        const parentPath = parts.slice(0, -1).join('/');

        // Ensure parent exists
        if (!map[parentPath]) {
            let current = '';
            for (const part of parts.slice(0, -1)) {
                const prev = current;
                current = current ? `${current}/${part}` : part;
                if (!map[current]) {
                    const folder = { name: part, path: current, type: 'folder', children: [] };
                    map[current] = folder;
                    if (map[prev]) map[prev].children.push(folder);
                }
            }
        }

        const node = {
            name,
            path: item.path,
            type: item.type === 'tree' ? 'folder' : 'file',
            size: item.size || 0,
            children: item.type === 'tree' ? [] : undefined
        };

        map[item.path] = node;
        if (map[parentPath]) {
            map[parentPath].children.push(node);
        }
    }

    return root.children;
}

// Get file content
async function getFileContent(owner, repo, path) {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
        headers: getHeaders()
    });
    if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status}`);
    }
    const data = await res.json();
    if (data.encoding === 'base64') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return data.content || '';
}

// Get repo metadata
async function getRepoInfo(owner, repo) {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    return res.json();
}

// Select key files for analysis
function selectKeyFiles(tree, maxFiles = 15) {
    const priorities = [
        /^readme/i,
        /^package\.json$/i,
        /^requirements\.txt$/i,
        /^cargo\.toml$/i,
        /^go\.mod$/i,
        /^pom\.xml$/i,
        /^build\.gradle$/i,
        /^Makefile$/i,
        /^Dockerfile$/i,
        /^docker-compose/i,
        /\.config\.(js|ts|json)$/i,
        /^\.env\.example$/i,
        /^tsconfig/i,
        /^(src|app|lib)\/(index|main|app|server)\.(js|ts|tsx|py|go|rs|java)$/i,
        /^(src|app)\/(routes|router|routing)\.(js|ts|tsx)$/i,
        /\/(routes|router|controllers?|handlers?|middleware|services?|models?)\/(index|mod)\.(js|ts|py|go|rs)$/i,
    ];

    const allFiles = [];
    function flatten(nodes) {
        for (const node of nodes) {
            if (node.type === 'file') allFiles.push(node);
            if (node.children) flatten(node.children);
        }
    }
    flatten(tree);

    const scored = allFiles.map(f => {
        let score = 0;
        for (let i = 0; i < priorities.length; i++) {
            if (priorities[i].test(f.path)) {
                score = priorities.length - i;
                break;
            }
        }
        // Boost shallow files
        const depth = f.path.split('/').length;
        if (depth <= 2) score += 2;
        if (depth === 1) score += 3;
        return { ...f, score };
    });

    return scored
        .filter(f => f.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxFiles);
}

module.exports = {
    parseGitHubUrl,
    getRepoTree,
    getFileContent,
    getRepoInfo,
    selectKeyFiles
};
