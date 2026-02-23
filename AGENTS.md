# AGENTS.md

This document provides guidance for AI coding agents working in this repository.

## Project Overview

AI Novel Writer is a desktop-like web application for writing novels with AI assistance.

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS
- **Backend**: Python + FastAPI
- **AI Integration**: xAI API for AI chat assistance

## Project Structure

```
webook/
├── ai-novel-writer/
│   ├── frontend/           # React + TypeScript frontend
│   │   ├── src/
│   │   │   ├── api/        # API client functions
│   │   │   ├── components/ # React components
│   │   │   ├── types/      # TypeScript type definitions
│   │   │   ├── App.tsx     # Main application component
│   │   │   └── main.tsx    # Entry point
│   │   └── package.json
│   ├── backend/            # Python FastAPI backend
│   │   ├── agent/          # AI agent implementation
│   │   │   ├── core/       # Core agent logic
│   │   │   ├── models.py   # Pydantic data models
│   │   │   └── providers/  # LLM provider implementations
│   │   └── main.py         # FastAPI application
│   └── novels/             # User novel projects (gitignored)
```

## Build, Lint, and Test Commands

### Frontend (from `ai-novel-writer/frontend/`)

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Run ESLint
npm run lint

# Build for production (runs TypeScript check + Vite build)
npm run build

# Preview production build
npm run preview
```

### Backend (from `ai-novel-writer/backend/`)

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server (http://localhost:8000)
python main.py
# or
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Code Style Guidelines

### TypeScript/React

#### Imports
- Use `import type` for type-only imports
- Group imports: external libraries first, then internal modules
```typescript
import React, { useState, useEffect } from 'react';
import { SomeIcon } from 'lucide-react';
import type { Project, FileNode } from '../types';
import { api } from '../api';
import { ComponentName } from './ComponentName';
```

#### Components
- Use functional components with `React.FC<PropsType>` pattern
- Define interface for props at the top of the file
- Destructure props in function signature
```typescript
interface ComponentProps {
  width: number;
  onResize: (delta: number) => void;
}

export const ComponentName: React.FC<ComponentProps> = ({
  width,
  onResize
}) => {
  // component body
};
```

#### State and Hooks
- Use `const` for useState hooks with array destructuring
- Place hooks at the top of the component
- Use `useCallback` for event handlers passed as props

#### Error Handling
- Use try-catch for async operations
- Display errors to users via state, not console only
```typescript
try {
  await api.someFunction();
} catch (error) {
  setError(error instanceof Error ? error.message : '操作失败');
}
```

#### Naming Conventions
- **Components/Interfaces/Types**: PascalCase (`ChatPanel`, `FileNode`)
- **Variables/Functions**: camelCase (`sessionId`, `loadProjects`)
- **Constants**: UPPER_SNAKE_CASE or camelCase
- **CSS Classes**: Use TailwindCSS utility classes

#### File Organization
- One component per file
- Export components as named exports
- Place related components in subdirectories

### Python

#### Imports
- Group imports: standard library, third-party, local modules
```python
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from agent import NovelAgent
```

#### Classes and Functions
- Use PascalCase for classes, snake_case for functions/variables
- Add docstrings for classes and public functions
```python
class ChatSession(BaseModel):
    """对话会话"""
    session_id: str
    title: Optional[str] = None
```

#### Error Handling
- Use `HTTPException` for API errors with appropriate status codes
- Provide descriptive error messages
```python
if not file_path.exists():
    raise HTTPException(status_code=404, detail="File not found")
```

#### Type Hints
- Always use type hints for function parameters and return types
- Use `Optional[T]` for nullable types
- Use Pydantic models for data validation

## Important Notes

### API Communication
- Frontend API base URL: `http://localhost:8000`
- Backend CORS is configured for `localhost:5173` and `localhost:3000`

### File Operations
- All user files are stored in `ai-novel-writer/novels/`
- Chat history is stored in `ai-novel-writer/chat_history/` as JSON files

### Environment Variables
Backend requires these environment variables (set in `.env`):
- `XAI_API_KEY`: API key for xAI/Grok
- `XAI_MODEL`: Model name (default: `grok-4-1-fast-reasoning`)

## Common Patterns

### Adding a New API Endpoint

1. **Backend**: Add route in `main.py`
```python
@app.get("/api/resource")
async def get_resource():
    # implementation
    return {"data": value}
```

2. **Frontend**: Add function in `api/index.ts`
```typescript
getResource: async () => {
  const response = await fetch(`${API_BASE_URL}/api/resource`);
  if (!response.ok) {
    throw new Error('Failed to get resource');
  }
  return response.json();
}
```

### Adding a New Component

1. Create file in `src/components/ComponentName.tsx`
2. Define props interface
3. Export component as named export
4. Import and use in parent component

## Notes for AI Agents

- Always run `npm run lint` after making frontend changes
- Always run `npm run build` to verify TypeScript compiles without errors
- When adding new dependencies, update both `package.json` (frontend) or `requirements.txt` (backend)
- Use Chinese for comments and user-facing strings in the codebase
- DO NOT add comments unless explicitly requested by the user
