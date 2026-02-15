# RepoNinja 🥷

> An AI-powered codebase explainer that transforms GitHub repository exploration into an intelligent, guided learning journey.

## 🎯 Problem Statement

**AI for Learning & Developer Productivity**

Build an AI-powered solution that helps people learn faster, work smarter, or become more productive while building or understanding technology.

## 💡 Solution

RepoNinja addresses the critical challenge faced by developers—especially students, beginners, and open-source contributors—who struggle to understand large, unfamiliar codebases. When opening a new GitHub repository, developers face:

- Too many files with no clear starting point
- Unknown architecture and confusing logic
- Lack of comprehensive documentation
- Overwhelming complexity for beginners

RepoNinja leverages AI to democratize codebase understanding by providing:

✨ **Intelligent Repository Analysis** - Instant project summaries with tech stack detection  
🗺️ **Architecture Visualization** - Interactive diagrams showing component relationships  
📚 **Guided Learning Paths** - AI-generated step-by-step exploration sequences  
💬 **Interactive Q&A** - Ask questions about any part of the codebase  
🎓 **Explain Like I'm 12 Mode** - Simplified explanations for complete beginners  
📖 **Auto-Documentation** - Generate comprehensive docs automatically  
🔍 **Smart Complexity Scoring** - Know which files are easier to understand first  

## 🏗️ Architecture

RepoNinja is built with a modern, scalable architecture:

**Frontend**: Next.js 14 + React 18 + TypeScript + TailwindCSS  
**Backend**: Node.js + Express + TypeScript  
**AI Layer**: OpenAI API for intelligent code analysis  
**Data**: PostgreSQL + Redis for caching  
**Infrastructure**: Docker + Cloud deployment ready

## 📋 Features

### Core Features
- **Repository Analyzer** - Paste any GitHub URL and get instant insights
- **File & Folder Explainer** - Click any item for detailed AI-generated explanations
- **Architecture Visualizer** - See how components connect with interactive diagrams
- **Learning Path Generator** - Get personalized exploration sequences
- **Interactive Chat** - Ask questions and get instant, contextual answers
- **Complexity Dashboard** - Visual indicators showing code difficulty levels
- **Multi-Language Support** - Works with JavaScript, Python, Java, Go, Rust, and more

### Advanced Features
- **ELI12 Mode** - Explanations using simple language and analogies
- **Documentation Generator** - Auto-create README, API docs, and contributing guides
- **Search & Navigation** - Powerful fuzzy search with semantic understanding
- **Collaboration** - Share analyses with teams via shareable links
- **Session Management** - Save progress and resume learning anytime

## 🎓 AI for Bharat Hackathon

This project is developed as part of **AI for Bharat**, a two-phase program designed to help developers in India turn AI theory into practice. The program provides hands-on experience through curated workshops and challenges, empowering developers to build real-world AI solutions.

## 👥 Team ZYPHER

- **Aishwanth M S** - [GitHub](https://github.com/aishwanth-dev)
- **Govind DS**
- **Skandhan K S**
- **Nithish S**

## 📚 Documentation

Comprehensive specification documents are available in the `.kiro/specs/ai-codebase-explainer/` directory:

- **requirements.md** - Detailed functional requirements with acceptance criteria
- **design.md** - Complete system design with architecture, API contracts, and testing strategy

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL
- Redis
- OpenAI API key
- GitHub Personal Access Token (for private repos)

### Installation

```bash
# Clone the repository
git clone https://github.com/aishwanth-dev/RepoNinja---Ai-For-Bharat-Hackathon.git
cd RepoNinja---Ai-For-Bharat-Hackathon

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

### Environment Variables

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# GitHub
GITHUB_TOKEN=your_github_token

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/reponinja

# Redis
REDIS_URL=redis://localhost:6379

# App
PORT=3000
NODE_ENV=development
```

## 🎯 Use Cases

### For Students
- Learn from open-source projects without getting overwhelmed
- Understand complex codebases for academic projects
- Build confidence by starting with simpler files

### For Developers
- Quickly onboard to new company codebases
- Contribute to open-source projects faster
- Understand legacy code without extensive documentation

### For Teams
- Accelerate developer onboarding
- Generate documentation automatically
- Share codebase knowledge across team members

### For Hackathons
- Rapidly understand starter templates
- Learn new frameworks and libraries
- Build on existing projects efficiently

## 🔬 Technical Highlights

### AI-Powered Analysis
- Static code analysis combined with GPT-4 for intelligent explanations
- Context-aware responses that understand project structure
- Pattern detection for common architectures (MVC, microservices, etc.)

### Performance Optimizations
- Aggressive caching with Redis (24-hour TTL)
- Streaming responses for large repositories
- Parallel file analysis for faster processing
- Smart preloading of adjacent files

### Security & Privacy
- Token encryption at rest and in transit
- No permanent storage of source code
- Private repository isolation
- Rate limiting to prevent abuse

## 🧪 Testing

The project includes comprehensive testing:

- **Property-Based Tests** - 87 correctness properties validated
- **Unit Tests** - 80%+ code coverage
- **Integration Tests** - All API endpoints covered
- **E2E Tests** - Critical user workflows validated

```bash
# Run all tests
npm test

# Run property-based tests
npm run test:properties

# Run with coverage
npm run test:coverage
```

## 🛣️ Roadmap

### Phase 1 (MVP) ✅
- Repository analysis and structure fetching
- AI-powered file explanations
- Basic chat interface
- Complexity scoring

### Phase 2 (Current)
- Architecture visualization
- Learning path generation
- ELI12 mode
- Documentation generation

### Phase 3 (Future)
- VS Code extension
- GitHub App integration
- Team collaboration features
- Code review assistance
- Multi-repository analysis

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](.kiro/specs/ai-codebase-explainer/design.md#testing-strategy) for details.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **AI for Bharat** for organizing this amazing hackathon
- OpenAI for providing powerful AI capabilities
- The open-source community for inspiration and tools

## 📞 Contact

For questions or feedback, reach out to Team ZYPHER:
- GitHub: [@aishwanth-dev](https://github.com/aishwanth-dev)

---

**Built with ❤️ by Team ZYPHER for AI for Bharat Hackathon**

*Making codebases accessible to developers everywhere* 🚀
