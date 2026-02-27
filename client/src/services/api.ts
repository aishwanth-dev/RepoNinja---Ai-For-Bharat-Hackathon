import type { RepoData, FlowData, ChatMessage } from '../types';

const API = '/api';

async function safeJson(res: Response) {
    const text = await res.text();
    if (!text) throw new Error('Empty response from server');
    try {
        return JSON.parse(text);
    } catch {
        throw new Error(text || 'Invalid response from server');
    }
}

export async function analyzeRepo(repoUrl: string): Promise<RepoData> {
    const res = await fetch(`${API}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || 'Analysis failed');
    return data;
}

export async function explainFile(
    owner: string,
    repo: string,
    filePath: string,
    repoContext: string
): Promise<{ explanation: string; content: string }> {
    const res = await fetch(`${API}/explain/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, filePath, repoContext }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || 'Failed to explain file');
    return data;
}

export async function explainFolder(
    folderPath: string,
    children: string[],
    repoContext: string
): Promise<{ explanation: string }> {
    const res = await fetch(`${API}/explain/folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath, children, repoContext }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || 'Failed to explain folder');
    return data;
}

export async function generateWalkthrough(
    repoSummary: unknown,
    tree: unknown,
    owner: string,
    repo: string
): Promise<{ steps: import('../types').WalkthroughStep[] }> {
    const res = await fetch(`${API}/walkthrough`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoSummary, tree, owner, repo }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || 'Failed to generate walkthrough');
    return data;
}

export async function generateFlow(
    repoSummary: unknown,
    level: string
): Promise<FlowData> {
    const res = await fetch(`${API}/flow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoSummary, level }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || 'Failed to generate flow');
    return data;
}

export async function chatWithAI(
    messages: ChatMessage[],
    context: Record<string, unknown>
): Promise<{ response: string }> {
    const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, context }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || 'Chat failed');
    return data;
}
