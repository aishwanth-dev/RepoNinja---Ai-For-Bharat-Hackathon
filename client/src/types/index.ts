export interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    size?: number;
    children?: FileNode[];
}

export interface RepoSummary {
    summary: string;
    techStack: string[];
    architecture: string;
    keyFeatures: string[];
    entryPoint: string;
}

export interface RepoData {
    owner: string;
    repo: string;
    repoInfo: {
        name: string;
        description: string;
        language: string;
        stars: number;
        forks: number;
    };
    tree: FileNode[];
    summary: RepoSummary;
    keyFiles: string[];
}

export interface WalkthroughStep {
    step: number;
    title: string;
    file: string;
    startLine: number;
    endLine: number;
    explanation: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface WalkthroughState {
    active: boolean;
    steps: WalkthroughStep[];
    currentStep: number;
    doubt: boolean;
}

export interface FlowData {
    mermaid: string;
    level: 'overview' | 'simple' | 'deep';
}
