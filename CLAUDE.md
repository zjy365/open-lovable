# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
pnpm dev          # Start development server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint

# Package management
pnpm install      # Install dependencies
```

## Project Architecture

**Open Lovable** is an AI-powered React application builder built with Next.js 15.4.3 that allows users to chat with AI to create React apps instantly with sandboxed code execution.

### Core Technologies
- **Framework**: Next.js 15 (App Router) with TypeScript 5
- **Frontend**: React 19, Tailwind CSS, Radix UI, Framer Motion
- **State Management**: Jotai atoms for global state
- **AI Integration**: Multiple LLM providers (Anthropic, OpenAI, Google Gemini, Groq) via Vercel AI SDK
- **Sandbox**: Dual provider architecture (Vercel Sandbox, E2B Code Interpreter)
- **Build Tool**: Turbopack for development

### Key Architectural Patterns

#### 1. Dual Sandbox Architecture
The app supports two sandbox providers for code execution:
- **Vercel Sandbox** (@vercel/sandbox): Node.js runtime with OIDC or Personal Access Token auth
- **E2B Code Interpreter** (@e2b/code-interpreter): Python + Node.js support with API key auth

Configuration in `/config/app.config.ts` controls timeouts, provider selection, and execution settings.

#### 2. Serverless API Architecture
All backend operations handled by Next.js API routes:
- `/api/search` - Website scraping via Firecrawl
- `/api/create-ai-sandbox` - Sandbox initialization
- `/api/apply-ai-code` - Streaming code application
- `/api/install-packages` - Package management
- `/api/conversation-state` - Chat session persistence

#### 3. Component Organization
```
/components/
├── ui/              # shadcn/ui base components
├── app/
│   ├── (home)/      # Landing page components
│   └── generation/  # AI workspace components
├── shared/          # Reusable components
└── effects/         # Visual effects (flames, explosions)
```

#### 4. State Management
Uses Jotai atoms for:
- Sandbox state and execution context
- Chat conversation history
- UI state (modals, sheets, settings)

#### 5. Design System
Fire-inspired design system with:
- **Colors**: CSS custom properties with P3 color space (`--heat-4` to `--heat-100`)
- **Typography**: SuisseIntl font family with systematic scale classes
- **Utilities**: Gradient utilities, layout helpers, animation classes
- **Component styles**: Located in `/styles/components/`

### Important Directories

- `/app` - Next.js App Router pages and API routes
- `/lib` - Core business logic including sandbox providers and AI integration
- `/config` - Centralized configuration (`app.config.ts`)
- `/types` - TypeScript definitions for conversations, sandbox, etc.
- `/styles` - Global CSS, design system, and component styles

### Environment Setup

Required environment variables:
- `FIRECRAWL_API_KEY` - Website scraping
- AI provider key (choose one): `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`
- Sandbox provider: Configure Vercel (OIDC token or team/project/personal access tokens) or E2B (`E2B_API_KEY`)
- Optional: `MORPH_API_KEY` for faster code edits

### Development Notes

- Uses Turbopack for fast development builds
- TypeScript strict mode enabled
- Tailwind CSS with custom design system tokens
- No formal test setup - relies on manual testing
- Component development follows Cursor IDE rules in `.cursor/rules/`

### Key Features

1. **AI-Powered Code Generation** - Multi-provider LLM support with streaming responses
2. **Real-time Code Execution** - Sandboxed environments with package management
3. **Website Analysis** - Firecrawl integration for content extraction and screenshots
4. **Advanced UI** - Fire-themed design with animations and effects