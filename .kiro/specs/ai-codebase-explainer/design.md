# Design Document: AI Codebase Explainer

## Overview

The AI Codebase Explainer is a full-stack web application that transforms GitHub repository exploration from an overwhelming experience into an intelligent, guided learning journey. The system combines static code analysis, AI-powered natural language generation, and interactive visualization to make any codebase accessible to developers at all skill levels.

### Key Design Principles

1. **Progressive Disclosure**: Start with high-level summaries, allow users to drill down into details
2. **Performance First**: Aggressive caching, lazy loading, and streaming responses for sub-second interactions
3. **AI as Enhancement**: Use AI for insights, but maintain functionality with static analysis when AI is unavailable
4. **Scalability**: Design for repositories ranging from 10 files to 10,000+ files
5. **Privacy by Design**: Minimize data retention, encrypt sensitive tokens, never store repository code permanently

### Technology Stack

**Frontend:**
- Next.js 14 (App Router) with React 18
- TypeScript for type safety
- TailwindCSS for styling
- React Flow for architecture diagrams
- Monaco Editor for code display with syntax highlighting
- Zustand for state management
- React Query for server state and caching

**Backend:**
- Node.js 20+ with Express.js
- TypeScript for type safety
- Octokit (GitHub API client)
- OpenAI Node SDK
- Redis for caching and session management
- PostgreSQL for user data and analysis metadata
- Bull for job queue management

**Infrastructure:**
- Docker for containerization
- Vercel/AWS for hosting
- Redis Cloud for distributed caching
- Supabase/AWS RDS for PostgreSQL
- CloudFlare for CDN and DDoS protection

## Architecture

### System Architecture

The system follows a three-tier architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  (Next.js App - SSR/CSR, Interactive UI, Visualizations)    │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API / WebSocket
┌─────────────────────▼───────────────────────────────────────┐
│                      Backend API Layer                       │
│     (Express.js - Request Handling, Business Logic)         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   GitHub     │  │   OpenAI     │  │   Analysis   │     │
│  │   Service    │  │   Service    │  │   Engine     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Redis      │  │  PostgreSQL  │  │   Bull       │     │
│  │   Cache      │  │   Database   │  │   Queue      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

**Frontend Components:**

1. **Repository Input Component**: URL validation, loading states, error handling
2. **Repository Explorer**: Tree view of files/folders with lazy loading
3. **Explanation Panel**: Displays AI-generated explanations with markdown rendering
4. **Architecture Visualizer**: Interactive diagrams using React Flow
5. **Chat Interface**: Conversational Q&A with context awareness
6. **Learning Path Navigator**: Step-by-step guided exploration
7. **Complexity Dashboard**: Visual representation of codebase complexity
8. **Settings Panel**: User preferences, explanation levels, theme

**Backend Services:**

1. **GitHub Service**: Repository fetching, file content retrieval, API rate limiting
2. **OpenAI Service**: Prompt engineering, response streaming, token management
3. **Analysis Engine**: Static code analysis, complexity calculation, pattern detection
4. **Cache Service**: Redis operations, cache invalidation strategies
5. **Session Service**: User session management, progress tracking
6. **Queue Service**: Background job processing for large repositories
7. **Documentation Generator**: Automated README and API doc creation
8. **Visualization Service**: Dependency graph generation, architecture detection

### Data Flow

**Repository Analysis Flow:**

```
User submits URL
    ↓
Validate URL & check cache
    ↓
[Cache Hit] → Return cached data
    ↓
[Cache Miss] → Fetch repo metadata from GitHub
    ↓
Queue analysis job (if large repo)
    ↓
Fetch file tree structure
    ↓
Identify entry points & key files
    ↓
Generate project summary with OpenAI
    ↓
Calculate complexity scores
    ↓
Store in cache & database
    ↓
Return to frontend with streaming updates
```

**File Explanation Flow:**

```
User clicks file
    ↓
Check cache for existing explanation
    ↓
[Cache Hit] → Return cached explanation
    ↓
[Cache Miss] → Fetch file content from GitHub
    ↓
Perform static analysis (imports, exports, functions)
    ↓
Build context from related files
    ↓
Generate explanation with OpenAI (with user's explanation level)
    ↓
Cache explanation
    ↓
Stream response to frontend
```

## Components and Interfaces

### API Endpoints

#### Repository Analysis

**POST /api/repositories/analyze**

Request:
```typescript
{
  url: string;              // GitHub repository URL
  accessToken?: string;     // Optional for private repos
  options?: {
    depth?: number;         // Analysis depth (1-3)
    includeTests?: boolean; // Include test files
    maxFiles?: number;      // Limit for large repos
  }
}
```

Response:
```typescript
{
  id: string;                    // Analysis ID
  repository: {
    owner: string;
    name: string;
    description: string;
    stars: number;
    forks: number;
    language: string;
    languages: Record<string, number>; // Language distribution
    size: number;                // Size in KB
    fileCount: number;
    lastUpdated: string;
  };
  summary: {
    purpose: string;             // AI-generated purpose
    techStack: string[];         // Detected technologies
    architecture: string;        // Detected pattern (MVC, microservices, etc.)
    keyFeatures: string[];       // Main features
    complexity: number;          // Overall complexity score (1-10)
  };
  structure: FileNode[];         // Tree structure
  entryPoints: string[];         // Suggested starting files
  status: 'completed' | 'processing' | 'failed';
  cacheExpiry: string;
}
```

**GET /api/repositories/:id**

Retrieve cached repository analysis by ID.

Response: Same as POST /api/repositories/analyze

#### File Explanation

**POST /api/files/explain**

Request:
```typescript
{
  repositoryId: string;
  filePath: string;
  explanationLevel: 'beginner' | 'intermediate' | 'expert' | 'eli12';
  context?: {
    previousFiles?: string[];  // Recently viewed files for context
    focusAreas?: string[];     // Specific aspects to focus on
  }
}
```

Response:
```typescript
{
  filePath: string;
  explanation: {
    overview: string;           // High-level purpose
    keyComponents: Array<{
      name: string;
      type: 'function' | 'class' | 'constant' | 'interface';
      description: string;
      importance: number;       // 1-5 scale
      lineStart: number;
      lineEnd: number;
    }>;
    dependencies: Array<{
      name: string;
      type: 'internal' | 'external';
      purpose: string;
    }>;
    patterns: string[];         // Detected design patterns
    complexity: number;         // File complexity score
    suggestedNext: string[];    // Related files to explore
  };
  code: {
    content: string;
    language: string;
    lineCount: number;
  };
}
```

#### Folder Explanation

**POST /api/folders/explain**

Request:
```typescript
{
  repositoryId: string;
  folderPath: string;
  explanationLevel: 'beginner' | 'intermediate' | 'expert' | 'eli12';
}
```

Response:
```typescript
{
  folderPath: string;
  explanation: {
    purpose: string;
    architecture: string;       // Role in overall architecture
    keyFiles: Array<{
      path: string;
      importance: number;
      description: string;
    }>;
    subfolders: Array<{
      path: string;
      purpose: string;
    }>;
    patterns: string[];
  };
  statistics: {
    fileCount: number;
    totalLines: number;
    averageComplexity: number;
    languages: Record<string, number>;
  };
}
```

#### Architecture Visualization

**GET /api/repositories/:id/architecture**

Response:
```typescript
{
  nodes: Array<{
    id: string;
    label: string;
    type: 'module' | 'component' | 'service' | 'database' | 'external';
    layer: 'frontend' | 'backend' | 'data' | 'infrastructure';
    complexity: number;
    files: string[];
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: 'imports' | 'calls' | 'dataflow' | 'extends';
    weight: number;             // Strength of relationship
  }>;
  layers: Array<{
    name: string;
    description: string;
    nodes: string[];
  }>;
  patterns: Array<{
    name: string;
    description: string;
    components: string[];
  }>;
  circularDependencies: Array<{
    cycle: string[];
    severity: 'warning' | 'error';
  }>;
}
```

#### Learning Path

**POST /api/learning-paths/generate**

Request:
```typescript
{
  repositoryId: string;
  goal?: string;                // Optional specific goal
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  timeAvailable?: number;       // Minutes available
}
```

Response:
```typescript
{
  pathId: string;
  steps: Array<{
    id: string;
    order: number;
    title: string;
    description: string;
    files: string[];
    estimatedMinutes: number;
    prerequisites: string[];    // Previous step IDs
    learningObjectives: string[];
    complexity: number;
  }>;
  totalEstimatedTime: number;
  milestones: Array<{
    stepId: string;
    title: string;
    description: string;
  }>;
}
```

**PATCH /api/learning-paths/:pathId/progress**

Request:
```typescript
{
  stepId: string;
  status: 'completed' | 'in_progress' | 'skipped';
  notes?: string;
}
```

#### Interactive Chat

**POST /api/chat/ask**

Request:
```typescript
{
  repositoryId: string;
  sessionId: string;
  question: string;
  context?: {
    currentFile?: string;
    recentFiles?: string[];
  }
}
```

Response (Streaming):
```typescript
{
  answer: string;               // Streamed response
  sources: Array<{
    file: string;
    lineStart: number;
    lineEnd: number;
    relevance: number;
  }>;
  followUpQuestions: string[];
  confidence: number;           // 0-1 scale
}
```

**GET /api/chat/sessions/:sessionId/history**

Response:
```typescript
{
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    sources?: Array<{
      file: string;
      lineStart: number;
      lineEnd: number;
    }>;
  }>;
}
```

#### Documentation Generation

**POST /api/documentation/generate**

Request:
```typescript
{
  repositoryId: string;
  options: {
    includeReadme: boolean;
    includeApi: boolean;
    includeContributing: boolean;
    includeArchitecture: boolean;
    format: 'markdown' | 'html' | 'pdf';
  }
}
```

Response:
```typescript
{
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  documents: Array<{
    type: 'readme' | 'api' | 'contributing' | 'architecture';
    content: string;
    format: string;
  }>;
  downloadUrl?: string;
}
```

#### Complexity Analysis

**GET /api/repositories/:id/complexity**

Response:
```typescript
{
  overall: {
    score: number;              // 1-10
    distribution: Record<string, number>; // Complexity ranges
    trend: 'improving' | 'stable' | 'degrading';
  };
  files: Array<{
    path: string;
    complexity: number;
    metrics: {
      cyclomaticComplexity: number;
      cognitiveComplexity: number;
      linesOfCode: number;
      nestingDepth: number;
      dependencies: number;
    };
    issues: Array<{
      type: 'high_complexity' | 'deep_nesting' | 'long_function';
      severity: 'low' | 'medium' | 'high';
      description: string;
      suggestion: string;
    }>;
  }>;
  hotspots: Array<{
    path: string;
    reason: string;
    priority: number;
  }>;
}
```

### Data Models

#### Repository Model

```typescript
interface Repository {
  id: string;
  githubId: number;
  owner: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  defaultBranch: string;
  
  // Metadata
  stars: number;
  forks: number;
  watchers: number;
  size: number;
  language: string;
  languages: Record<string, number>;
  topics: string[];
  license: string;
  
  // Analysis data
  fileCount: number;
  totalLines: number;
  complexity: number;
  architecture: string;
  techStack: string[];
  entryPoints: string[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastAnalyzed: Date;
  githubUpdatedAt: Date;
  
  // Cache control
  cacheExpiry: Date;
  analysisVersion: string;
}
```

#### FileNode Model

```typescript
interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size: number;
  language?: string;
  
  // Analysis data
  complexity?: number;
  importance?: number;
  hasExplanation: boolean;
  
  // Relationships
  children?: FileNode[];
  dependencies?: string[];
  dependents?: string[];
  
  // Metadata
  lastModified: Date;
  author?: string;
  commitCount?: number;
}
```

#### Explanation Model

```typescript
interface Explanation {
  id: string;
  repositoryId: string;
  filePath: string;
  explanationLevel: ExplanationLevel;
  
  // Content
  overview: string;
  keyComponents: Component[];
  dependencies: Dependency[];
  patterns: string[];
  
  // Metadata
  generatedAt: Date;
  tokensUsed: number;
  model: string;
  cacheExpiry: Date;
}

interface Component {
  name: string;
  type: 'function' | 'class' | 'constant' | 'interface' | 'type';
  description: string;
  importance: number;
  lineStart: number;
  lineEnd: number;
  parameters?: Parameter[];
  returnType?: string;
}

interface Dependency {
  name: string;
  type: 'internal' | 'external';
  purpose: string;
  version?: string;
}
```

#### LearningPath Model

```typescript
interface LearningPath {
  id: string;
  repositoryId: string;
  userId?: string;
  
  // Configuration
  goal?: string;
  experienceLevel: ExperienceLevel;
  
  // Steps
  steps: LearningStep[];
  currentStepId?: string;
  completedSteps: string[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  totalEstimatedTime: number;
}

interface LearningStep {
  id: string;
  order: number;
  title: string;
  description: string;
  files: string[];
  estimatedMinutes: number;
  prerequisites: string[];
  learningObjectives: string[];
  complexity: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
}
```

#### ChatSession Model

```typescript
interface ChatSession {
  id: string;
  repositoryId: string;
  userId?: string;
  
  // Messages
  messages: ChatMessage[];
  
  // Context
  contextFiles: string[];
  recentTopics: string[];
  
  // Metadata
  createdAt: Date;
  lastMessageAt: Date;
  expiresAt: Date;
  tokensUsed: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  
  // Assistant messages only
  sources?: Source[];
  followUpQuestions?: string[];
  confidence?: number;
  tokensUsed?: number;
}

interface Source {
  file: string;
  lineStart: number;
  lineEnd: number;
  relevance: number;
  snippet: string;
}
```

#### UserSession Model

```typescript
interface UserSession {
  id: string;
  userId?: string;
  
  // Preferences
  explanationLevel: ExplanationLevel;
  theme: 'light' | 'dark' | 'system';
  
  // History
  analyzedRepositories: string[];
  viewedFiles: Record<string, string[]>; // repositoryId -> filePaths
  bookmarks: Bookmark[];
  
  // Progress
  learningPaths: Record<string, string>; // repositoryId -> pathId
  
  // Metadata
  createdAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
}

interface Bookmark {
  repositoryId: string;
  filePath: string;
  note?: string;
  createdAt: Date;
}
```

#### ComplexityAnalysis Model

```typescript
interface ComplexityAnalysis {
  repositoryId: string;
  
  // Overall metrics
  overallScore: number;
  distribution: Record<string, number>;
  
  // File-level metrics
  files: FileComplexity[];
  
  // Hotspots
  hotspots: Hotspot[];
  
  // Metadata
  analyzedAt: Date;
  analysisVersion: string;
}

interface FileComplexity {
  path: string;
  complexity: number;
  metrics: {
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    linesOfCode: number;
    nestingDepth: number;
    dependencies: number;
    maintainabilityIndex: number;
  };
  issues: ComplexityIssue[];
}

interface ComplexityIssue {
  type: 'high_complexity' | 'deep_nesting' | 'long_function' | 'many_dependencies';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
  lineStart?: number;
  lineEnd?: number;
}

interface Hotspot {
  path: string;
  reason: string;
  priority: number;
  metrics: Record<string, number>;
}
```

### Type Definitions

```typescript
type ExplanationLevel = 'beginner' | 'intermediate' | 'expert' | 'eli12';
type ExperienceLevel = 'beginner' | 'intermediate' | 'expert';
type AnalysisStatus = 'queued' | 'processing' | 'completed' | 'failed';
type FileType = 'file' | 'directory';
type ComponentType = 'function' | 'class' | 'constant' | 'interface' | 'type';
type DependencyType = 'internal' | 'external';
type NodeType = 'module' | 'component' | 'service' | 'database' | 'external';
type EdgeType = 'imports' | 'calls' | 'dataflow' | 'extends';
type LayerType = 'frontend' | 'backend' | 'data' | 'infrastructure';
```

## 

### Core Algorithms

#### Complexity Calculation Algorithm

```typescript
function calculateFileComplexity(fileContent: string, language: string): number {
  // Parse file into AST
  const ast = parseCode(fileContent, language);
  
  // Calculate individual metrics
  const cyclomaticComplexity = calculateCyclomaticComplexity(ast);
  const cognitiveComplexity = calculateCognitiveComplexity(ast);
  const nestingDepth = calculateMaxNestingDepth(ast);
  const linesOfCode = countNonCommentLines(fileContent);
  const dependencies = countDependencies(ast);
  
  // Weighted scoring (1-10 scale)
  const score = (
    (cyclomaticComplexity / 10) * 0.3 +
    (cognitiveComplexity / 15) * 0.3 +
    (nestingDepth / 5) * 0.2 +
    (linesOfCode / 500) * 0.1 +
    (dependencies / 20) * 0.1
  ) * 10;
  
  return Math.min(Math.max(score, 1), 10);
}
```

#### Learning Path Generation Algorithm

```typescript
function generateLearningPath(
  repository: Repository,
  files: FileNode[],
  experienceLevel: ExperienceLevel
): LearningPath {
  // 1. Identify entry points (main files, index files)
  const entryPoints = identifyEntryPoints(files);
  
  // 2. Build dependency graph
  const graph = buildDependencyGraph(files);
  
  // 3. Perform topological sort to get logical order
  const sortedFiles = topologicalSort(graph, entryPoints);
  
  // 4. Filter by complexity based on experience level
  const complexityThreshold = {
    beginner: 5,
    intermediate: 7,
    expert: 10
  }[experienceLevel];
  
  const filteredFiles = sortedFiles.filter(
    file => file.complexity <= complexityThreshold
  );
  
  // 5. Group related files into learning modules
  const modules = groupIntoModules(filteredFiles, graph);
  
  // 6. Create steps with estimated times
  const steps = modules.map((module, index) => ({
    id: generateId(),
    order: index + 1,
    title: module.title,
    description: module.description,
    files: module.files.map(f => f.path),
    estimatedMinutes: estimateReadingTime(module.files),
    prerequisites: index > 0 ? [modules[index - 1].id] : [],
    learningObjectives: generateObjectives(module),
    complexity: averageComplexity(module.files)
  }));
  
  return {
    id: generateId(),
    repositoryId: repository.id,
    experienceLevel,
    steps,
    totalEstimatedTime: steps.reduce((sum, s) => sum + s.estimatedMinutes, 0),
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
```

#### Architecture Detection Algorithm

```typescript
function detectArchitecture(files: FileNode[]): string {
  const patterns = {
    mvc: detectMVC(files),
    microservices: detectMicroservices(files),
    layered: detectLayeredArchitecture(files),
    hexagonal: detectHexagonal(files),
    eventDriven: detectEventDriven(files)
  };
  
  // Return pattern with highest confidence
  const detected = Object.entries(patterns)
    .sort(([, a], [, b]) => b.confidence - a.confidence)[0];
  
  return detected[1].confidence > 0.6 ? detected[0] : 'custom';
}

function detectMVC(files: FileNode[]): { confidence: number; evidence: string[] } {
  const evidence: string[] = [];
  let score = 0;
  
  // Check for model directory
  if (files.some(f => f.path.includes('/models/') || f.path.includes('/model/'))) {
    score += 0.33;
    evidence.push('Models directory found');
  }
  
  // Check for view directory
  if (files.some(f => f.path.includes('/views/') || f.path.includes('/templates/'))) {
    score += 0.33;
    evidence.push('Views directory found');
  }
  
  // Check for controller directory
  if (files.some(f => f.path.includes('/controllers/') || f.path.includes('/controller/'))) {
    score += 0.34;
    evidence.push('Controllers directory found');
  }
  
  return { confidence: score, evidence };
}
```

#### Smart Caching Strategy

```typescript
class CacheManager {
  private redis: Redis;
  
  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
  
  // Cache keys follow pattern: {type}:{id}:{subtype}
  getCacheKey(type: string, id: string, subtype?: string): string {
    return subtype ? `${type}:${id}:${subtype}` : `${type}:${id}`;
  }
  
  // Invalidation strategy
  async invalidateRepository(repositoryId: string): Promise<void> {
    const pattern = `*:${repositoryId}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
  
  // Cache warming for predictive loading
  async warmCache(repositoryId: string, entryPoints: string[]): Promise<void> {
    // Pre-generate explanations for entry point files
    for (const filePath of entryPoints) {
      await this.generateAndCacheExplanation(repositoryId, filePath);
    }
  }
}
```

### OpenAI Integration

#### Prompt Engineering

**Repository Summary Prompt:**

```typescript
const REPO_SUMMARY_PROMPT = `
You are an expert software architect analyzing a GitHub repository.

Repository: {repoName}
Primary Language: {language}
File Count: {fileCount}
Key Files: {keyFiles}

Provide a comprehensive summary including:
1. Project Purpose (2-3 sentences)
2. Tech Stack (list all frameworks, libraries, tools)
3. Architecture Pattern (MVC, microservices, etc.)
4. Key Features (3-5 main features)
5. Target Users/Use Cases

Be specific and technical but accessible to intermediate developers.
`;
```

**File Explanation Prompt (Beginner Level):**

```typescript
const FILE_EXPLANATION_PROMPT_BEGINNER = `
You are a patient coding mentor explaining code to a beginner developer.

File: {filePath}
Language: {language}
Context: This file is part of {projectPurpose}

Code:
{fileContent}

Provide an explanation including:
1. Overview: What does this file do? (2-3 sentences, avoid jargon)
2. Key Components: List the 3-5 most important functions/classes with simple descriptions
3. Dependencies: What other files or libraries does this use and why?
4. Role in Project: How does this fit into the bigger picture?

Use simple language, avoid technical jargon, and use analogies when helpful.
`;
```

**File Explanation Prompt (ELI12 Level):**

```typescript
const FILE_EXPLANATION_PROMPT_ELI12 = `
You are explaining code to a 12-year-old who is curious about programming.

File: {filePath}

Code:
{fileContent}

Explain this file as if talking to a smart 12-year-old:
1. What does this file do? (Use a real-world analogy)
2. What are the main parts? (Describe like explaining a recipe or game)
3. How does it work with other files? (Use simple connections)

Rules:
- Use everyday language and analogies (recipes, games, toys, etc.)
- Avoid ALL technical jargon
- Use emojis to make it fun
- Keep it short and engaging
`;
```

**Chat Q&A Prompt:**

```typescript
const CHAT_QA_PROMPT = `
You are an expert code assistant helping a developer understand a codebase.

Repository: {repoName}
Current Context: {currentFile}
Recent Files: {recentFiles}

Conversation History:
{conversationHistory}

User Question: {question}

Relevant Code:
{relevantCode}

Provide a helpful answer that:
1. Directly answers the question
2. Cites specific files and line numbers as evidence
3. Provides code examples if relevant
4. Suggests 2-3 follow-up questions the user might want to ask

If you're not certain, say so. If the question is ambiguous, ask for clarification.
`;
```

#### Token Management

```typescript
class TokenManager {
  private readonly MAX_TOKENS_PER_REQUEST = 4000;
  private readonly MAX_CONTEXT_TOKENS = 8000;
  
  estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
  
  truncateToTokenLimit(text: string, maxTokens: number): string {
    const estimatedTokens = this.estimateTokens(text);
    if (estimatedTokens <= maxTokens) return text;
    
    const ratio = maxTokens / estimatedTokens;
    const targetLength = Math.floor(text.length * ratio);
    return text.substring(0, targetLength) + '\n... (truncated)';
  }
  
  buildContextWindow(
    currentFile: string,
    relatedFiles: string[],
    maxTokens: number
  ): string {
    let context = currentFile;
    let tokensUsed = this.estimateTokens(currentFile);
    
    for (const file of relatedFiles) {
      const fileTokens = this.estimateTokens(file);
      if (tokensUsed + fileTokens > maxTokens) break;
      
      context += '\n\n' + file;
      tokensUsed += fileTokens;
    }
    
    return context;
  }
}
```

### GitHub API Integration

#### Rate Limiting Strategy

```typescript
class GitHubRateLimiter {
  private remaining: number = 5000;
  private resetTime: Date = new Date();
  
  async checkRateLimit(octokit: Octokit): Promise<void> {
    const { data } = await octokit.rateLimit.get();
    this.remaining = data.rate.remaining;
    this.resetTime = new Date(data.rate.reset * 1000);
  }
  
  async waitIfNeeded(): Promise<void> {
    if (this.remaining < 100) {
      const waitTime = this.resetTime.getTime() - Date.now();
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await this.waitIfNeeded();
        return await operation();
      } catch (error) {
        if (error.status === 403 && attempt < maxRetries - 1) {
          // Rate limited, wait and retry
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }
}
```

#### Repository Fetching

```typescript
class GitHubService {
  private octokit: Octokit;
  private rateLimiter: GitHubRateLimiter;
  
  async fetchRepository(owner: string, repo: string): Promise<Repository> {
    return this.rateLimiter.executeWithRetry(async () => {
      const { data } = await this.octokit.repos.get({ owner, repo });
      
      return {
        id: generateId(),
        githubId: data.id,
        owner: data.owner.login,
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        url: data.html_url,
        defaultBranch: data.default_branch,
        stars: data.stargazers_count,
        forks: data.forks_count,
        watchers: data.watchers_count,
        size: data.size,
        language: data.language,
        topics: data.topics,
        license: data.license?.spdx_id,
        githubUpdatedAt: new Date(data.updated_at),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
  }
  
  async fetchFileTree(
    owner: string,
    repo: string,
    branch: string = 'main'
  ): Promise<FileNode[]> {
    return this.rateLimiter.executeWithRetry(async () => {
      const { data } = await this.octokit.git.getTree({
        owner,
        repo,
        tree_sha: branch,
        recursive: 'true'
      });
      
      return this.buildFileTree(data.tree);
    });
  }
  
  async fetchFileContent(
    owner: string,
    repo: string,
    path: string,
    branch: string = 'main'
  ): Promise<string> {
    return this.rateLimiter.executeWithRetry(async () => {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch
      });
      
      if ('content' in data) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      throw new Error('File content not available');
    });
  }
  
  private buildFileTree(items: any[]): FileNode[] {
    const root: FileNode[] = [];
    const map = new Map<string, FileNode>();
    
    // Sort to ensure parents come before children
    items.sort((a, b) => a.path.localeCompare(b.path));
    
    for (const item of items) {
      const node: FileNode = {
        path: item.path,
        name: item.path.split('/').pop()!,
        type: item.type === 'tree' ? 'directory' : 'file',
        size: item.size,
        hasExplanation: false,
        lastModified: new Date()
      };
      
      map.set(item.path, node);
      
      const parentPath = item.path.split('/').slice(0, -1).join('/');
      if (parentPath) {
        const parent = map.get(parentPath);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        root.push(node);
      }
    }
    
    return root;
  }
}
```

### Static Code Analysis

```typescript
class CodeAnalyzer {
  async analyzeFile(content: string, language: string): Promise<FileAnalysis> {
    const parser = this.getParser(language);
    const ast = parser.parse(content);
    
    return {
      functions: this.extractFunctions(ast),
      classes: this.extractClasses(ast),
      imports: this.extractImports(ast),
      exports: this.extractExports(ast),
      complexity: this.calculateComplexity(ast),
      patterns: this.detectPatterns(ast)
    };
  }
  
  private extractFunctions(ast: AST): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    
    traverse(ast, {
      FunctionDeclaration(path) {
        functions.push({
          name: path.node.id.name,
          parameters: path.node.params.map(p => p.name),
          lineStart: path.node.loc.start.line,
          lineEnd: path.node.loc.end.line,
          isAsync: path.node.async,
          isExported: path.parent.type === 'ExportNamedDeclaration'
        });
      },
      ArrowFunctionExpression(path) {
        if (path.parent.type === 'VariableDeclarator') {
          functions.push({
            name: path.parent.id.name,
            parameters: path.node.params.map(p => p.name),
            lineStart: path.node.loc.start.line,
            lineEnd: path.node.loc.end.line,
            isAsync: path.node.async,
            isExported: false
          });
        }
      }
    });
    
    return functions;
  }
  
  private detectPatterns(ast: AST): string[] {
    const patterns: string[] = [];
    
    // Singleton pattern detection
    if (this.hasSingletonPattern(ast)) {
      patterns.push('Singleton');
    }
    
    // Factory pattern detection
    if (this.hasFactoryPattern(ast)) {
      patterns.push('Factory');
    }
    
    // Observer pattern detection
    if (this.hasObserverPattern(ast)) {
      patterns.push('Observer');
    }
    
    return patterns;
  }
}
```

### Error Handling Strategy

```typescript
class ErrorHandler {
  handle(error: Error, context: ErrorContext): ErrorResponse {
    // Log error with context
    logger.error('Error occurred', {
      error: error.message,
      stack: error.stack,
      context
    });
    
    // Determine error type and response
    if (error instanceof GitHubAPIError) {
      return this.handleGitHubError(error);
    }
    
    if (error instanceof OpenAIError) {
      return this.handleOpenAIError(error);
    }
    
    if (error instanceof ValidationError) {
      return this.handleValidationError(error);
    }
    
    // Generic error
    return {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      userMessage: 'Something went wrong. Please try again.',
      statusCode: 500,
      retryable: true
    };
  }
  
  private handleGitHubError(error: GitHubAPIError): ErrorResponse {
    if (error.status === 404) {
      return {
        code: 'REPO_NOT_FOUND',
        message: 'Repository not found',
        userMessage: 'The repository could not be found. Please check the URL.',
        statusCode: 404,
        retryable: false
      };
    }
    
    if (error.status === 403) {
      return {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'GitHub API rate limit exceeded',
        userMessage: 'Too many requests. Please try again in a few minutes.',
        statusCode: 429,
        retryable: true,
        retryAfter: error.resetTime
      };
    }
    
    return {
      code: 'GITHUB_ERROR',
      message: error.message,
      userMessage: 'Failed to fetch repository data. Please try again.',
      statusCode: 502,
      retryable: true
    };
  }
  
  private handleOpenAIError(error: OpenAIError): ErrorResponse {
    if (error.type === 'rate_limit_error') {
      return {
        code: 'AI_RATE_LIMIT',
        message: 'OpenAI rate limit exceeded',
        userMessage: 'AI service is temporarily unavailable. Showing basic analysis.',
        statusCode: 429,
        retryable: true,
        fallbackMode: 'static_analysis'
      };
    }
    
    return {
      code: 'AI_ERROR',
      message: error.message,
      userMessage: 'AI explanation unavailable. Showing code structure.',
      statusCode: 502,
      retryable: true,
      fallbackMode: 'static_analysis'
    };
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Repository Analysis Properties

**Property 1: Valid URL Analysis Completeness**
*For any* valid GitHub repository URL, when analyzed, the system should return a complete repository structure with all required metadata (owner, name, languages, file tree, summary) within the specified time limit.
**Validates: Requirements 1.1, 1.7, 1.8**

**Property 2: Invalid URL Error Handling**
*For any* invalid GitHub URL format (malformed, non-existent, wrong domain), the system should return a descriptive error message that identifies the specific validation failure without attempting analysis.
**Validates: Requirements 1.2**

**Property 3: Cache Consistency**
*For any* repository analyzed within the cache TTL period, subsequent requests for the same repository should return cached data that is equivalent to the original analysis without making additional GitHub API calls.
**Validates: Requirements 1.6, 10.2, 10.3**

**Property 4: Language and Framework Detection**
*For any* repository containing code files, the system should correctly identify the primary programming language and detect framework-specific patterns present in the codebase.
**Validates: Requirements 1.7, 9.2, 9.7, 9.8**

### Explanation Generation Properties

**Property 5: File Explanation Completeness**
*For any* file in a repository, the generated explanation should contain all required components: overview, key components list, dependencies list, and role in project.
**Validates: Requirements 2.1, 2.7**

**Property 6: Folder Explanation Completeness**
*For any* folder in a repository, the generated explanation should contain purpose, architectural significance, key files list, and subfolder descriptions.
**Validates: Requirements 2.2**

**Property 7: Explanation Level Adaptation**
*For any* file explanation generated at different explanation levels (beginner, intermediate, expert, ELI12), the technical depth and language complexity should differ appropriately, with ELI12 being simplest and expert being most technical.
**Validates: Requirements 2.5, 7.4, 7.5, 7.6**

**Property 8: Top Components Identification**
*For any* file containing functions or classes, the explanation should identify and highlight at most the top 5 most important components, or all components if fewer than 5 exist.
**Validates: Requirements 2.3**

**Property 9: Design Pattern Detection**
*For any* code file implementing a known design pattern (Singleton, Factory, Observer, etc.), the system should detect and identify the pattern in the explanation.
**Validates: Requirements 2.6**

**Property 10: Explanation Performance**
*For any* file under 500 lines of code, the explanation generation should complete within 5 seconds from request to response.
**Validates: Requirements 2.8**

### Architecture Visualization Properties

**Property 11: Visualization Completeness**
*For any* repository, the generated architecture visualization should contain nodes representing major modules, edges representing relationships, and layer classifications for all components.
**Validates: Requirements 3.1, 3.3**

**Property 12: Dependency Highlighting Accuracy**
*For any* component in the architecture diagram, when selected, the system should correctly identify and highlight all its direct dependencies and dependents based on the actual code relationships.
**Validates: Requirements 3.2**

**Property 13: Architecture Pattern Detection**
*For any* repository following a known architecture pattern (MVC, microservices, layered), the system should detect and correctly label the pattern with confidence above the threshold.
**Validates: Requirements 3.4**

**Property 14: Circular Dependency Detection**
*For any* repository containing circular dependencies in its module graph, the system should identify all cycles and flag them with appropriate warning indicators.
**Validates: Requirements 3.7**

**Property 15: Relationship Type Annotation**
*For any* edge in the architecture diagram, the system should annotate it with the correct relationship type (imports, calls, dataflow, extends) based on the actual code connections.
**Validates: Requirements 3.5, 3.8**

### Learning Path Properties

**Property 16: Learning Path Validity**
*For any* generated learning path, all steps should form a valid sequence where each step's prerequisites are satisfied by earlier steps in the path.
**Validates: Requirements 4.1**

**Property 17: Entry Point Prioritization**
*For any* learning path, the first steps should consist of identified entry point files (main files, index files, application bootstrapping) before progressing to dependent modules.
**Validates: Requirements 4.2**

**Property 18: Complexity Ordering**
*For any* learning path at a given experience level, files should be ordered such that simpler files (lower complexity scores) are recommended before more complex files within each module.
**Validates: Requirements 4.3**

**Property 19: Related File Grouping**
*For any* learning path, files that share dependencies or belong to the same functional module should be grouped together in the same learning step.
**Validates: Requirements 4.4**

**Property 20: Progress Tracking**
*For any* learning step marked as completed, the system should persist this state and suggest the next uncompleted step in the sequence.
**Validates: Requirements 4.5**

**Property 21: Time Estimation Presence**
*For any* learning step, the system should provide an estimated time to complete based on file complexity and length, with the estimate being a positive number.
**Validates: Requirements 4.6**

**Property 22: Goal-Focused Path Filtering**
*For any* learning path generated with a specific goal, all included files should be relevant to achieving that goal, excluding unrelated modules.
**Validates: Requirements 4.7**

**Property 23: Experience Level Adaptation**
*For any* repository, learning paths generated for different experience levels should differ in complexity thresholds and file selection.
**Validates: Requirements 4.8**

### Interactive Chat Properties

**Property 24: Chat Response Performance**
*For any* question asked about the codebase, the system should provide a response within 8 seconds from question submission to answer delivery.
**Validates: Requirements 5.1**

**Property 25: Conversation Context Maintenance**
*For any* sequence of questions within a user session, the system should maintain context such that follow-up questions can reference previous questions and answers without re-stating context.
**Validates: Requirements 5.2**

**Property 26: Answer Citation Completeness**
*For any* chat answer provided, the system should include citations to specific files and line numbers that support the answer.
**Validates: Requirements 5.3**

**Property 27: Question Type Support**
*For any* question about code functionality, architecture decisions, or implementation patterns, the system should provide a relevant answer addressing the question type.
**Validates: Requirements 5.5**

**Property 28: Explanation Depth in Answers**
*For any* "how does X work" question, the answer should contain both a high-level overview section and a detailed implementation section.
**Validates: Requirements 5.6**

**Property 29: Security Analysis Detection**
*For any* question about security vulnerabilities or code smells, the system should analyze the codebase and provide findings if vulnerabilities exist.
**Validates: Requirements 5.8**

**Property 30: Limitation Acknowledgment**
*For any* question that cannot be answered from the codebase content, the system should explicitly state that the information is not available rather than providing speculative answers.
**Validates: Requirements 5.9**

### Complexity Analysis Properties

**Property 31: Universal Complexity Scoring**
*For any* file in a repository, the system should assign a complexity score in the range [1, 10] based on cyclomatic complexity, nesting depth, file length, and dependencies.
**Validates: Requirements 6.1, 6.2**

**Property 32: Complexity Indicator Presence**
*For any* file with a complexity score, the system should provide a visual indicator (color coding) that corresponds to the complexity level.
**Validates: Requirements 6.3**

**Property 33: Complexity Filtering Accuracy**
*For any* complexity range filter applied, the returned file list should contain only files whose complexity scores fall within the specified range.
**Validates: Requirements 6.4**

**Property 34: High Complexity Flagging**
*For any* file with complexity score above 7/10, the system should flag it as a refactoring candidate with appropriate warnings.
**Validates: Requirements 6.5**

**Property 35: Complexity Distribution Completeness**
*For any* repository, the system should generate a complexity distribution chart showing the count of files in each complexity range.
**Validates: Requirements 6.7**

**Property 36: Refactoring Suggestions**
*For any* file with complexity exceeding 8/10, the system should provide suggestions for breaking it into smaller modules.
**Validates: Requirements 6.8**

### Documentation Generation Properties

**Property 37: README Generation Completeness**
*For any* repository, the generated README documentation should contain all required sections: project overview, setup instructions, and architecture summary.
**Validates: Requirements 8.1**

**Property 38: API Documentation Completeness**
*For any* repository containing API endpoints, the generated API documentation should include all public endpoints with request/response examples.
**Validates: Requirements 8.2**

**Property 39: Comment Extraction**
*For any* file containing inline comments or docstrings, the documentation generation should extract and include these comments to preserve developer intent.
**Validates: Requirements 8.3**

**Property 40: Contributing Guide Generation**
*For any* repository, the generated CONTRIBUTING.md should contain setup steps and development workflow instructions.
**Validates: Requirements 8.4**

**Property 41: Folder Structure Documentation**
*For any* repository, the generated documentation should include a folder structure diagram with descriptions for each major directory.
**Validates: Requirements 8.5**

**Property 42: Configuration Documentation**
*For any* repository containing configuration files, the documentation should list and explain all configuration options and their purposes.
**Validates: Requirements 8.6**

**Property 43: Code Example Generation**
*For any* repository, the documentation should include code examples demonstrating usage of key functions and classes.
**Validates: Requirements 8.7**

**Property 44: Multi-Format Export**
*For any* documentation generation request, the system should support exporting in all specified formats (Markdown, HTML, PDF) with equivalent content.
**Validates: Requirements 8.8**

### Multi-Language Support Properties

**Property 45: Language Support Coverage**
*For any* repository written in JavaScript, TypeScript, Python, Java, Go, Rust, C++, C#, Ruby, or PHP, the system should successfully analyze the repository and provide language-specific insights.
**Validates: Requirements 9.1**

**Property 46: Multi-Language Distribution**
*For any* repository using multiple programming languages, the system should analyze each language separately and provide accurate language distribution percentages.
**Validates: Requirements 9.4**

**Property 47: Graceful Language Degradation**
*For any* repository using uncommon or unsupported languages, the system should provide basic structure analysis (file tree, folder organization) even without deep language-specific analysis.
**Validates: Requirements 9.6**

### Performance Properties

**Property 48: Small Repository Analysis Performance**
*For any* repository containing fewer than 1,000 files, the initial analysis should complete within 15 seconds from request to completion.
**Validates: Requirements 10.1**

**Property 49: Cache Expiry Consistency**
*For any* analyzed repository, the cache entry should have an expiry time set to 24 hours from the analysis completion time.
**Validates: Requirements 10.2**

**Property 50: Exponential Backoff Implementation**
*For any* sequence of API requests approaching rate limits, the delay between retries should increase exponentially (e.g., 1s, 2s, 4s, 8s).
**Validates: Requirements 10.4**

**Property 51: Adjacent File Preloading**
*For any* file being viewed, the system should initiate preload requests for adjacent files in the file tree to reduce perceived latency.
**Validates: Requirements 10.5**

**Property 52: Streaming Response Delivery**
*For any* large repository analysis, the system should stream partial results to the client as they become available rather than waiting for complete analysis.
**Validates: Requirements 10.6**

**Property 53: Large File Chunking**
*For any* file exceeding 1,000 lines, the explanation engine should divide it into chunks and analyze sections in parallel.
**Validates: Requirements 10.7**

**Property 54: Pagination Implementation**
*For any* repository containing more than 500 files, the file list should be paginated with a maximum of 500 files per page.
**Validates: Requirements 10.8**

### Session Management Properties

**Property 55: Session State Persistence**
*For any* user session, all analysis state including viewed files, completed learning steps, and preferences should be persisted to storage and retrievable on subsequent visits.
**Validates: Requirements 11.1, 11.2**

**Property 56: Progress Restoration**
*For any* user returning to a previously analyzed repository, the system should restore their exact progress including current position in learning path and viewed file status.
**Validates: Requirements 11.3**

**Property 57: Repository History Tracking**
*For any* user session, the system should maintain a chronological history of all analyzed repositories accessible from the dashboard.
**Validates: Requirements 11.4**

**Property 58: Bookmark Persistence**
*For any* file or explanation bookmarked by a user, the bookmark should be saved with optional notes and retrievable in future sessions.
**Validates: Requirements 11.5**

**Property 59: Visited File Tracking**
*For any* file viewed by a user, the system should mark it as "visited" and persist this status across sessions.
**Validates: Requirements 11.6**

**Property 60: Shareable Link Generation**
*For any* completed repository analysis, the system should generate a unique shareable link with configurable read-only permissions.
**Validates: Requirements 11.7, 15.1**

**Property 61: Session Expiry**
*For any* user session with no activity for 30 days, the system should mark it as expired and schedule it for cleanup.
**Validates: Requirements 11.8**

### Error Handling Properties

**Property 62: Binary File Exclusion**
*For any* repository containing binary files or unsupported file formats, the system should skip these files during analysis and log the exclusions without failing the entire analysis.
**Validates: Requirements 12.3**

**Property 63: Large File Summary Fallback**
*For any* file exceeding 5,000 lines, the system should provide a high-level summary instead of detailed line-by-line analysis.
**Validates: Requirements 12.5**

**Property 64: Malformed File Recovery**
*For any* repository containing corrupted or malformed files, the system should skip the problematic files and continue analyzing the remaining valid files.
**Validates: Requirements 12.7**

**Property 65: Error Logging Completeness**
*For any* error that occurs during analysis, the system should log the error with sufficient context (timestamp, user ID, repository, operation) while excluding sensitive information (tokens, passwords).
**Validates: Requirements 12.8**

### Security Properties

**Property 66: Token Encryption**
*For any* GitHub personal access token provided by a user, the system should encrypt it using strong encryption before storing and decrypt only when needed for API calls.
**Validates: Requirements 13.1**

**Property 67: Code Non-Persistence**
*For any* repository analyzed, the system should never store the actual source code permanently, only metadata and analysis results, with code cached temporarily at most.
**Validates: Requirements 13.2**

**Property 68: Private Repository Isolation**
*For any* private repository analyzed, the analysis results and metadata should be isolated such that no other user can access them without explicit sharing permissions.
**Validates: Requirements 13.3**

**Property 69: Per-User Rate Limiting**
*For any* user making requests, the system should enforce rate limits on a per-user basis to prevent abuse, with limits reset on a rolling time window.
**Validates: Requirements 13.4**

**Property 70: Sensitive Data Stripping**
*For any* code sent to external AI APIs, the system should first scan and strip sensitive patterns (API keys, passwords, tokens, credentials) before transmission.
**Validates: Requirements 13.5**

**Property 71: Data Deletion Compliance**
*For any* user session deletion request, the system should permanently remove all associated data (analysis history, bookmarks, preferences) within 24 hours.
**Validates: Requirements 13.7**

**Property 72: HTTPS Enforcement**
*For any* HTTP request to the system, it should be redirected to HTTPS, and all cookies should be marked as secure and httpOnly.
**Validates: Requirements 13.8**

### Search Properties

**Property 73: Search Result Completeness**
*For any* search term, the results should include all matching entities: files, functions, classes, and comments that contain the term.
**Validates: Requirements 14.1**

**Property 74: Fuzzy Search Tolerance**
*For any* search term with typos or partial matches, the fuzzy search should return relevant results that approximately match the intended term.
**Validates: Requirements 14.2**

**Property 75: Search Result Context**
*For any* search result returned, it should include a context snippet showing the match with highlighting and surrounding lines for context.
**Validates: Requirements 14.3**

**Property 76: Search Filter Accuracy**
*For any* search with filters applied (file type, complexity, folder), the results should contain only items matching all specified filter criteria.
**Validates: Requirements 14.4**

**Property 77: Semantic Search Capability**
*For any* concept-based search query (e.g., "authentication"), the system should return semantically related code even when exact keywords don't match.
**Validates: Requirements 14.5**

**Property 78: Search Suggestion Generation**
*For any* search query, the system should provide relevant search suggestions based on repository content and common query patterns.
**Validates: Requirements 14.6**

**Property 79: In-File Search Completeness**
*For any* search within a specific file, the system should find and highlight all occurrences of the search term and enable navigation between matches.
**Validates: Requirements 14.7**

**Property 80: Search History Persistence**
*For any* user session, the system should maintain a history of search queries and allow quick re-execution of previous searches.
**Validates: Requirements 14.8**

### Collaboration Properties

**Property 81: Read-Only Sharing Enforcement**
*For any* shared repository analysis link with read-only permissions, recipients should be able to view all analysis data but unable to modify any settings, annotations, or progress.
**Validates: Requirements 15.2**

**Property 82: Shared Link Access Without Re-Analysis**
*For any* valid shared link accessed, the system should display the complete analysis without requiring the recipient to re-analyze the repository.
**Validates: Requirements 15.3**

**Property 83: HTML Export Completeness**
*For any* repository analysis exported as HTML, the static report should contain all analysis data including summaries, explanations, and visualizations in a standalone format.
**Validates: Requirements 15.4**

**Property 84: Visibility Inheritance**
*For any* shared repository analysis, the sharing permissions should respect the original repository's visibility settings (public repositories can be shared publicly, private repositories require authentication).
**Validates: Requirements 15.5**

**Property 85: Team Workspace Collaboration**
*For any* team workspace, multiple users should be able to view and contribute to the same repository analysis with changes visible to all workspace members.
**Validates: Requirements 15.6**

**Property 86: Annotation Persistence and Sharing**
*For any* annotation or note added to a file, it should be saved to the analysis and included when the analysis is shared with other users.
**Validates: Requirements 15.7**

**Property 87: Embeddable Widget Generation**
*For any* repository analysis, the system should generate embeddable widget code that displays the repository summary and can be embedded in external websites.
**Validates: Requirements 15.8**


## Error Handling

### Error Classification

The system categorizes errors into four main types:

1. **Client Errors (4xx)**: Invalid input, authentication failures, not found
2. **Server Errors (5xx)**: Internal failures, database errors, unexpected exceptions
3. **External Service Errors**: GitHub API failures, OpenAI API failures
4. **Transient Errors**: Network timeouts, rate limits, temporary unavailability

### Error Response Format

All errors follow a consistent response format:

```typescript
interface ErrorResponse {
  code: string;              // Machine-readable error code
  message: string;           // Technical error message
  userMessage: string;       // User-friendly explanation
  statusCode: number;        // HTTP status code
  retryable: boolean;        // Whether the operation can be retried
  retryAfter?: number;       // Seconds to wait before retry
  fallbackMode?: string;     // Alternative mode if available
  details?: Record<string, any>; // Additional context
}
```

### Error Handling Strategies

**GitHub API Errors:**
- 404 Not Found → Clear message about repository not existing
- 403 Rate Limit → Queue request, show estimated wait time
- 401 Unauthorized → Prompt for access token
- 403 Private Repo → Request authentication
- Network timeout → Retry with exponential backoff (max 3 attempts)

**OpenAI API Errors:**
- Rate limit exceeded → Fall back to static analysis, inform user
- Token limit exceeded → Chunk content and retry
- API unavailable → Use cached explanations or static analysis
- Invalid response → Log error, retry once, then fall back

**Validation Errors:**
- Invalid URL format → Immediate feedback with correction suggestions
- Unsupported file type → Skip file, continue analysis
- Missing required fields → Clear message about what's missing

**Database Errors:**
- Connection failure → Retry with exponential backoff
- Query timeout → Optimize query or return partial results
- Constraint violation → Log and return appropriate error

**Cache Errors:**
- Redis unavailable → Continue without caching, log warning
- Cache corruption → Invalidate cache entry, regenerate
- Serialization error → Skip caching for this item

### Fallback Mechanisms

**AI Service Unavailable:**
```typescript
async function generateExplanation(file: FileContent): Promise<Explanation> {
  try {
    return await openAIService.generateExplanation(file);
  } catch (error) {
    if (error instanceof OpenAIError) {
      logger.warn('OpenAI unavailable, falling back to static analysis');
      return staticAnalyzer.generateBasicExplanation(file);
    }
    throw error;
  }
}
```

**Partial Analysis Success:**
- If some files fail, continue with successful files
- Report failed files in summary
- Allow user to retry failed files individually

**Graceful Degradation:**
- No AI → Static analysis only
- No cache → Direct API calls (slower but functional)
- No database → In-memory session only (no persistence)

### Error Recovery

**Automatic Retry Logic:**
```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  backoffMs: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts || !isRetryable(error)) {
        throw error;
      }
      await sleep(backoffMs * Math.pow(2, attempt - 1));
    }
  }
  throw new Error('Max retries exceeded');
}
```

**Partial Progress Saving:**
- Save analysis progress every 10 files
- Allow resumption from last checkpoint
- Store failed file list for retry

**User Notification:**
- Real-time error notifications in UI
- Detailed error logs in developer console
- Suggested actions for resolution

### Monitoring and Alerting

**Error Metrics:**
- Error rate by type and endpoint
- Failed analysis count and reasons
- API failure rates (GitHub, OpenAI)
- Average retry attempts before success

**Alerting Thresholds:**
- Error rate > 5% → Warning
- Error rate > 10% → Critical alert
- API unavailable > 5 minutes → Page on-call
- Database connection failures → Immediate alert

## Testing Strategy

### Testing Approach

The AI Codebase Explainer requires a comprehensive testing strategy that combines unit tests, property-based tests, integration tests, and end-to-end tests. Given the AI-powered nature of the system, we also need specialized testing for AI outputs and external API interactions.

### Property-Based Testing

Property-based testing is the primary method for validating the correctness properties defined in this design. We will use **fast-check** (for TypeScript/JavaScript) as our property-based testing library.

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Seed-based reproducibility for failed tests
- Shrinking enabled to find minimal failing cases

**Example Property Test:**

```typescript
import fc from 'fast-check';

// Feature: ai-codebase-explainer, Property 1: Valid URL Analysis Completeness
describe('Repository Analysis', () => {
  it('should return complete metadata for any valid GitHub URL', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          owner: fc.stringOf(fc.char(), { minLength: 1, maxLength: 39 }),
          repo: fc.stringOf(fc.char(), { minLength: 1, maxLength: 100 })
        }),
        async ({ owner, repo }) => {
          const url = `https://github.com/${owner}/${repo}`;
          const result = await analyzeRepository(url);
          
          // Verify completeness
          expect(result).toHaveProperty('repository');
          expect(result.repository).toHaveProperty('owner');
          expect(result.repository).toHaveProperty('name');
          expect(result.repository).toHaveProperty('languages');
          expect(result).toHaveProperty('structure');
          expect(result).toHaveProperty('summary');
          expect(result.summary).toHaveProperty('purpose');
          expect(result.summary).toHaveProperty('techStack');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: ai-codebase-explainer, Property 3: Cache Consistency
describe('Cache Management', () => {
  it('should return equivalent data from cache', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5 }),
        async (repoId) => {
          // First analysis
          const firstResult = await analyzeRepository(repoId);
          
          // Second analysis (should hit cache)
          const cachedResult = await analyzeRepository(repoId);
          
          // Results should be equivalent
          expect(cachedResult).toEqual(firstResult);
          expect(cachedResult.cacheHit).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: ai-codebase-explainer, Property 18: Complexity Ordering
describe('Learning Path Generation', () => {
  it('should order files by increasing complexity within modules', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.record({
          path: fc.string(),
          complexity: fc.integer({ min: 1, max: 10 })
        }), { minLength: 5, maxLength: 50 }),
        async (files) => {
          const learningPath = await generateLearningPath(files, 'beginner');
          
          // Check each module maintains complexity ordering
          for (const step of learningPath.steps) {
            const stepFiles = step.files.map(path => 
              files.find(f => f.path === path)
            );
            
            for (let i = 1; i < stepFiles.length; i++) {
              expect(stepFiles[i].complexity).toBeGreaterThanOrEqual(
                stepFiles[i - 1].complexity
              );
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: ai-codebase-explainer, Property 50: Exponential Backoff Implementation
describe('Rate Limiting', () => {
  it('should implement exponential backoff', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (numRetries) => {
          const delays: number[] = [];
          
          await rateLimiter.executeWithBackoff(
            async () => { throw new Error('Rate limited'); },
            numRetries,
            (delay) => delays.push(delay)
          ).catch(() => {});
          
          // Verify exponential growth
          for (let i = 1; i < delays.length; i++) {
            expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1] * 1.5);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing

Unit tests validate specific examples, edge cases, and error conditions. They complement property tests by testing concrete scenarios.

**Unit Test Coverage:**

```typescript
describe('Complexity Calculator', () => {
  it('should assign score of 1 for empty file', () => {
    const score = calculateComplexity('', 'javascript');
    expect(score).toBe(1);
  });
  
  it('should assign score of 10 for highly complex file', () => {
    const complexCode = generateHighlyNestedCode();
    const score = calculateComplexity(complexCode, 'javascript');
    expect(score).toBe(10);
  });
  
  it('should handle files with no functions', () => {
    const code = 'const x = 1;\nconst y = 2;';
    const score = calculateComplexity(code, 'javascript');
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(3);
  });
});

describe('URL Validation', () => {
  it('should accept valid GitHub URLs', () => {
    expect(validateGitHubUrl('https://github.com/owner/repo')).toBe(true);
  });
  
  it('should reject non-GitHub URLs', () => {
    expect(validateGitHubUrl('https://gitlab.com/owner/repo')).toBe(false);
  });
  
  it('should reject malformed URLs', () => {
    expect(validateGitHubUrl('not-a-url')).toBe(false);
  });
  
  it('should handle URLs with trailing slashes', () => {
    expect(validateGitHubUrl('https://github.com/owner/repo/')).toBe(true);
  });
});

describe('Error Handler', () => {
  it('should return 404 for repository not found', () => {
    const error = new GitHubAPIError('Not Found', 404);
    const response = errorHandler.handle(error);
    expect(response.statusCode).toBe(404);
    expect(response.code).toBe('REPO_NOT_FOUND');
    expect(response.retryable).toBe(false);
  });
  
  it('should enable retry for rate limit errors', () => {
    const error = new GitHubAPIError('Rate Limited', 403);
    const response = errorHandler.handle(error);
    expect(response.retryable).toBe(true);
    expect(response.retryAfter).toBeDefined();
  });
});
```

### Integration Testing

Integration tests verify that components work together correctly, especially external service integrations.

**Integration Test Scenarios:**

```typescript
describe('Repository Analysis Integration', () => {
  it('should fetch, analyze, and cache a real repository', async () => {
    const url = 'https://github.com/facebook/react';
    
    // First request - should fetch from GitHub
    const result1 = await request(app)
      .post('/api/repositories/analyze')
      .send({ url })
      .expect(200);
    
    expect(result1.body.repository.name).toBe('react');
    expect(result1.body.structure).toBeDefined();
    
    // Second request - should hit cache
    const result2 = await request(app)
      .post('/api/repositories/analyze')
      .send({ url })
      .expect(200);
    
    expect(result2.body).toEqual(result1.body);
  });
  
  it('should generate explanation with OpenAI integration', async () => {
    const repositoryId = 'test-repo-id';
    const filePath = 'src/index.js';
    
    const result = await request(app)
      .post('/api/files/explain')
      .send({ repositoryId, filePath, explanationLevel: 'beginner' })
      .expect(200);
    
    expect(result.body.explanation.overview).toBeDefined();
    expect(result.body.explanation.keyComponents).toBeInstanceOf(Array);
    expect(result.body.explanation.dependencies).toBeInstanceOf(Array);
  });
});

describe('Chat Integration', () => {
  it('should maintain context across multiple questions', async () => {
    const sessionId = 'test-session';
    const repositoryId = 'test-repo';
    
    // First question
    const q1 = await request(app)
      .post('/api/chat/ask')
      .send({
        repositoryId,
        sessionId,
        question: 'What does the main function do?'
      })
      .expect(200);
    
    expect(q1.body.answer).toBeDefined();
    
    // Follow-up question (should use context)
    const q2 = await request(app)
      .post('/api/chat/ask')
      .send({
        repositoryId,
        sessionId,
        question: 'Can you show me an example?'
      })
      .expect(200);
    
    expect(q2.body.answer).toBeDefined();
    // Answer should reference previous context
  });
});
```

### End-to-End Testing

E2E tests validate complete user workflows using a headless browser.

**E2E Test Scenarios:**

```typescript
describe('Complete Analysis Workflow', () => {
  it('should analyze repository and navigate through explanations', async () => {
    await page.goto('http://localhost:3000');
    
    // Enter repository URL
    await page.fill('input[name="repoUrl"]', 'https://github.com/vercel/next.js');
    await page.click('button[type="submit"]');
    
    // Wait for analysis to complete
    await page.waitForSelector('.repository-summary');
    
    // Verify summary is displayed
    const summary = await page.textContent('.repository-summary');
    expect(summary).toContain('Next.js');
    
    // Click on a file
    await page.click('.file-tree .file-item:first-child');
    
    // Wait for explanation
    await page.waitForSelector('.file-explanation');
    
    // Verify explanation components
    const overview = await page.textContent('.explanation-overview');
    expect(overview).toBeTruthy();
    
    const components = await page.$$('.key-component');
    expect(components.length).toBeGreaterThan(0);
  });
  
  it('should generate and follow learning path', async () => {
    await page.goto('http://localhost:3000/repository/test-repo-id');
    
    // Request learning path
    await page.click('button:has-text("Generate Learning Path")');
    
    // Wait for path generation
    await page.waitForSelector('.learning-path');
    
    // Verify steps are displayed
    const steps = await page.$$('.learning-step');
    expect(steps.length).toBeGreaterThan(0);
    
    // Start first step
    await page.click('.learning-step:first-child button:has-text("Start")');
    
    // Verify file is opened
    await page.waitForSelector('.file-explanation');
    
    // Complete step
    await page.click('button:has-text("Mark Complete")');
    
    // Verify next step is suggested
    const nextStep = await page.textContent('.next-step-suggestion');
    expect(nextStep).toBeTruthy();
  });
});
```

### AI Output Testing

Testing AI-generated content requires special approaches:

**Structural Validation:**
```typescript
describe('AI Explanation Quality', () => {
  it('should generate explanations with required structure', async () => {
    const explanation = await generateExplanation(sampleFile);
    
    // Verify structure
    expect(explanation).toHaveProperty('overview');
    expect(explanation.overview.length).toBeGreaterThan(50);
    
    expect(explanation).toHaveProperty('keyComponents');
    expect(explanation.keyComponents.length).toBeGreaterThan(0);
    expect(explanation.keyComponents.length).toBeLessThanOrEqual(5);
    
    // Verify each component has required fields
    explanation.keyComponents.forEach(component => {
      expect(component).toHaveProperty('name');
      expect(component).toHaveProperty('description');
      expect(component).toHaveProperty('importance');
    });
  });
});
```

**Consistency Testing:**
```typescript
describe('AI Consistency', () => {
  it('should generate similar explanations for same file', async () => {
    const exp1 = await generateExplanation(sampleFile);
    const exp2 = await generateExplanation(sampleFile);
    
    // Should identify same key components (order may vary)
    const names1 = exp1.keyComponents.map(c => c.name).sort();
    const names2 = exp2.keyComponents.map(c => c.name).sort();
    
    const similarity = calculateSimilarity(names1, names2);
    expect(similarity).toBeGreaterThan(0.8); // 80% similarity
  });
});
```

**Regression Testing:**
```typescript
describe('AI Regression', () => {
  it('should maintain quality on known examples', async () => {
    const knownGoodExamples = loadKnownGoodExamples();
    
    for (const example of knownGoodExamples) {
      const explanation = await generateExplanation(example.file);
      
      // Compare against baseline
      const score = evaluateExplanationQuality(explanation, example.baseline);
      expect(score).toBeGreaterThan(0.7); // 70% quality threshold
    }
  });
});
```

### Mock and Stub Strategy

**GitHub API Mocking:**
```typescript
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    repos: {
      get: jest.fn().mockResolvedValue({ data: mockRepoData }),
      getContent: jest.fn().mockResolvedValue({ data: mockFileData })
    },
    git: {
      getTree: jest.fn().mockResolvedValue({ data: mockTreeData })
    }
  }))
}));
```

**OpenAI API Mocking:**
```typescript
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: mockExplanation } }]
        })
      }
    }
  }))
}));
```

### Performance Testing

**Load Testing:**
- Simulate 100 concurrent users analyzing repositories
- Measure response times under load
- Verify cache effectiveness reduces API calls

**Stress Testing:**
- Test with repositories of varying sizes (10 to 10,000 files)
- Verify graceful degradation under extreme load
- Test rate limiting behavior

**Benchmark Tests:**
```typescript
describe('Performance Benchmarks', () => {
  it('should analyze small repo within 15 seconds', async () => {
    const start = Date.now();
    await analyzeRepository(smallRepoUrl);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(15000);
  });
  
  it('should generate explanation within 5 seconds', async () => {
    const start = Date.now();
    await generateExplanation(smallFile);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(5000);
  });
});
```

### Test Coverage Goals

- **Unit Test Coverage**: Minimum 80% code coverage
- **Property Test Coverage**: All 87 correctness properties tested
- **Integration Test Coverage**: All API endpoints and service integrations
- **E2E Test Coverage**: All critical user workflows

### Continuous Testing

**Pre-commit Hooks:**
- Run unit tests and linting
- Verify no console.log statements
- Check TypeScript compilation

**CI/CD Pipeline:**
1. Run all unit tests
2. Run property-based tests (100 iterations each)
3. Run integration tests
4. Run E2E tests on staging
5. Generate coverage report
6. Deploy only if all tests pass

**Monitoring in Production:**
- Track error rates and types
- Monitor API response times
- Alert on property violations detected in production
- Collect user feedback on explanation quality

