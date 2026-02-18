# CourseFin Frontend Style Guide

**Version:** 1.0.0  
**Last Updated:** February 18, 2026  
**For:** Frontend Development with React + TypeScript + Tailwind CSS v4 + shadcn/ui

---

## ⚠️ CRITICAL: This is a WAILS DESKTOP APPLICATION

**CourseFin is NOT a web app. It's a native desktop application built with Wails v2.11.0.**

### What This Means for Frontend Development:

1. **Backend Communication**:
   - ❌ NO `fetch()`, `axios`, or HTTP requests
   - ✅ Use Wails-generated bindings from `@/wailsjs/go/main/App`
   - Example: `import { GetAllCourses } from '@/wailsjs/go/main/App';`

2. **Native Features Available**:
   - Native file/folder dialogs (use Wails runtime APIs)
   - System notifications
   - Window management (fullscreen, minimize, etc.)
   - Direct file system access through Go backend

3. **Build & Distribution**:
   - Frontend is embedded in Go binary
   - No web server, no deployment, no CORS issues
   - Runs as native desktop app on Linux, Windows, macOS

4. **Development**:
   - Frontend directory: `/frontend/`
   - Use `pnpm` for package management
   - Wails dev mode: `wails dev` (runs both frontend and backend)
   - Build: `wails build` (creates single executable)

5. **Key Differences from Web Apps**:
   - No URLs or routing in traditional sense (desktop navigation)
   - No authentication/sessions (single-user local app)
   - Direct access to local file system via backend
   - Native OS integration capabilities

**When you see "API call" in this guide, it means calling Wails bindings, NOT HTTP requests.**

---

## 📋 Table of Contents

1. [Overview & Philosophy](#1-overview--philosophy)
2. [Setup & Configuration](#2-setup--configuration)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Spacing & Layout](#5-spacing--layout)
6. [Component Guidelines](#6-component-guidelines)
7. [Animation & Motion](#7-animation--motion)
8. [Responsive Design](#8-responsive-design)
9. [Accessibility](#9-accessibility)
10. [Code Organization](#10-code-organization)
11. [Common Patterns](#11-common-patterns)
12. [State Management](#12-state-management)
13. [Do's and Don'ts](#13-dos-and-donts)
14. [Reference Examples](#14-reference-examples)
15. [Wails-Specific Patterns](#15-wails-specific-patterns)
16. [Checklist for AI Agents](#16-checklist-for-ai-agents)
17. [Quick Reference](#17-quick-reference)

---

## 1. Overview & Philosophy

### 1.1 Design Principles

**CourseFin** follows a **Modern Tech aesthetic** with these core principles:

- **Minimal & Elegant**: Clean interfaces inspired by Jellyfin's media-focused design
- **Content-First**: Let course posters and videos shine
- **Consistency**: Use shadcn/ui components everywhere possible
- **Accessibility**: Keyboard navigation and proper focus management
- **Performance**: Smooth 60fps interactions, optimized renders

### 1.2 Visual Identity

- **Color Scheme**: Blue primary (#2563eb) with slate neutrals and teal/cyan accents
- **Typography**: Inter for UI, JetBrains Mono for code/monospace content
- **Tone**: Professional, modern, learning-focused
- **Style**: Balanced roundness (0.5rem), subtle shadows, soft dark theme

### 1.3 Tech Stack

```
Application Type: Wails v2.11.0 Desktop App (NOT a web app)
Frontend Directory: /frontend/
Package Manager: pnpm (ALWAYS use pnpm, never npm or yarn)
Framework: React 18.3+ with TypeScript
Styling: Tailwind CSS v4.1+
Components: shadcn/ui (NEVER write custom versions of shadcn components)
Icons: lucide-react + @heroicons/react
State: Zustand for global state
Build: Vite 5.4+ (integrated with Wails)
Backend Communication: Wails bindings (NOT fetch/axios)
```

**Important Wails-specific considerations:**
- Frontend runs embedded in native window, not browser
- Use Wails runtime for native dialogs: `import { BrowserOpenURL, OpenFileDialog } from '@/wailsjs/runtime/runtime'`
- Backend calls are synchronous RPC-style, not async HTTP
- No CORS, no web security restrictions (it's a desktop app)

---

## 2. Setup & Configuration

### 2.1 Package Manager Rules

**CRITICAL: ALWAYS USE `pnpm`**

```bash
# ✅ CORRECT
pnpm install
pnpm add package-name
pnpm add -D dev-package
pnpm run dev

# ❌ WRONG - NEVER USE
npm install
yarn add
```

### 2.2 Adding shadcn/ui Components

**ALWAYS use the shadcn CLI to add components. NEVER copy/paste or write them manually.**

```bash
# ✅ CORRECT: Use shadcn CLI
cd frontend
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add toast

# Install multiple at once
pnpm dlx shadcn@latest add button card dialog toast skeleton

# ❌ WRONG: Creating components manually
# Never create files in src/components/ui/ yourself
```

### 2.3 shadcn Configuration

Current configuration in `frontend/components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",          // ⚠️ Update from "new-york" to "default"
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/style.css",
    "baseColor": "slate",      // ⚠️ Update from "neutral" to "slate"
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

**Action Required**: Update `components.json` to use `"style": "default"` and `"baseColor": "slate"`

### 2.4 Directory Structure

```
frontend/
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Root component
│   ├── index.css                   # Tailwind imports
│   ├── style.css                   # Theme variables
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn components (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   │
│   │   ├── courses/                # Course-related features
│   │   │   ├── CourseCard.tsx
│   │   │   ├── CourseGrid.tsx
│   │   │   ├── CourseDetail.tsx
│   │   │   └── CourseProgress.tsx
│   │   │
│   │   ├── player/                 # Video player features
│   │   │   ├── PlayerView.tsx
│   │   │   ├── PlayerControls.tsx
│   │   │   └── LectureList.tsx
│   │   │
│   │   ├── library/                # Library view features
│   │   │   ├── LibraryHeader.tsx
│   │   │   ├── EmptyLibrary.tsx
│   │   │   └── LibraryFilters.tsx
│   │   │
│   │   ├── settings/               # Settings features
│   │   │   └── SettingsView.tsx
│   │   │
│   │   └── common/                 # Shared components
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── AppLayout.tsx
│   │
│   ├── hooks/
│   │   ├── useCourses.ts
│   │   ├── usePlayer.ts
│   │   └── useProgress.ts
│   │
│   ├── stores/                     # Zustand stores
│   │   ├── courseStore.ts
│   │   ├── playerStore.ts
│   │   └── settingsStore.ts
│   │
│   ├── types/
│   │   └── index.ts                # TypeScript types
│   │
│   ├── lib/
│   │   ├── utils.ts                # shadcn utils
│   │   └── api.ts                  # Wails bindings wrapper
│   │
│   └── assets/
│       ├── images/
│       └── icons/
│
├── wailsjs/                        # Generated Wails bindings (DO NOT EDIT)
├── components.json                 # shadcn config
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

**Naming Conventions:**
- **Components**: `PascalCase.tsx` (e.g., `CourseCard.tsx`)
- **Hooks**: `camelCase.ts` with `use` prefix (e.g., `useCourses.ts`)
- **Stores**: `camelCase.ts` with `Store` suffix (e.g., `courseStore.ts`)
- **Types**: `PascalCase` interfaces and types
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`

---

## 3. Color System

### 3.1 Core Principle: NEVER Hardcode Colors

**❌ NEVER DO THIS:**
```tsx
// BAD - Hardcoded colors
<div className="bg-blue-600 text-white">
<div style={{ backgroundColor: '#2563eb' }}>
<div className="border-slate-700">
```

**✅ ALWAYS DO THIS:**
```tsx
// GOOD - Use CSS variables
<div className="bg-primary text-primary-foreground">
<div className="bg-card text-card-foreground">
<div className="border-border">
```

### 3.2 Color Palette

CourseFin uses **OKLCH color space** for better perceptual uniformity and the **Modern Tech** aesthetic.

#### Primary Colors
- **Primary** (Blue 600): `#2563eb` / `oklch(0.553 0.212 264.376)`
  - Use for: Primary buttons, links, active states, progress bars
  - Accessible pairing: `primary-foreground` (white)

#### Accent Colors
- **Accent** (Teal/Cyan): For secondary actions and highlights
  - Use for: Secondary CTAs, notifications, hover states
  - Never hardcode - use `accent` and `accent-foreground` variables

#### Neutral Colors (Slate)
- **Background**: Soft dark (`#0f172a` range)
- **Foreground**: Light text (`#f1f5f9`)
- **Muted**: Subtle backgrounds and disabled states
- **Border**: Subtle borders with 10% opacity

#### Semantic Colors (Muted)
- **Destructive**: Muted red for errors/delete actions
- **Success**: Muted green for success states (define custom if needed)
- **Warning**: Muted amber for warnings (define custom if needed)

### 3.3 CSS Variables

Update `frontend/src/style.css` with these CourseFin-specific colors:

```css
/* Dark Theme (Default) */
.dark {
  /* Base Colors - Soft Dark Slate */
  --background: oklch(0.098 0.015 250);           /* #0f172a - Slate 900 */
  --foreground: oklch(0.984 0.002 247);           /* #f1f5f9 - Slate 100 */
  
  /* Card */
  --card: oklch(0.157 0.017 252);                 /* #1e293b - Slate 800 */
  --card-foreground: oklch(0.984 0.002 247);
  
  /* Popover */
  --popover: oklch(0.157 0.017 252);              /* Same as card */
  --popover-foreground: oklch(0.984 0.002 247);
  
  /* Primary - Blue 600 */
  --primary: oklch(0.553 0.212 264.376);          /* #2563eb */
  --primary-foreground: oklch(0.984 0.002 247);   /* White text */
  
  /* Secondary */
  --secondary: oklch(0.228 0.020 252);            /* #334155 - Slate 700 */
  --secondary-foreground: oklch(0.984 0.002 247);
  
  /* Muted */
  --muted: oklch(0.228 0.020 252);                /* #334155 - Slate 700 */
  --muted-foreground: oklch(0.635 0.014 252);     /* #94a3b8 - Slate 400 */
  
  /* Accent - Teal/Cyan */
  --accent: oklch(0.628 0.118 195);               /* #06b6d4 - Cyan 500 */
  --accent-foreground: oklch(0.098 0.015 250);    /* Dark text */
  
  /* Destructive - Muted Red */
  --destructive: oklch(0.577 0.165 25);           /* #dc2626 - Red 600 muted */
  --destructive-foreground: oklch(0.984 0.002 247);
  
  /* Borders & Inputs */
  --border: oklch(0.228 0.020 252 / 40%);         /* Slate 700 at 40% */
  --input: oklch(0.228 0.020 252 / 50%);          /* Slate 700 at 50% */
  --ring: oklch(0.553 0.212 264.376 / 50%);       /* Primary at 50% for focus */
  
  /* Success (Custom) */
  --success: oklch(0.628 0.148 155);              /* #10b981 - Emerald 500 muted */
  --success-foreground: oklch(0.098 0.015 250);
  
  /* Warning (Custom) */
  --warning: oklch(0.731 0.156 75);               /* #f59e0b - Amber 500 muted */
  --warning-foreground: oklch(0.098 0.015 250);
  
  /* Sidebar (if needed) */
  --sidebar: oklch(0.157 0.017 252);
  --sidebar-foreground: oklch(0.984 0.002 247);
  --sidebar-primary: oklch(0.553 0.212 264.376);
  --sidebar-primary-foreground: oklch(0.984 0.002 247);
  --sidebar-accent: oklch(0.228 0.020 252);
  --sidebar-accent-foreground: oklch(0.984 0.002 247);
  --sidebar-border: oklch(0.228 0.020 252 / 40%);
  --sidebar-ring: oklch(0.553 0.212 264.376 / 50%);
}

/* Light Theme (Future) */
:root {
  --background: oklch(0.985 0.002 247);           /* #f8fafc - Slate 50 */
  --foreground: oklch(0.157 0.017 252);           /* #1e293b - Slate 800 */
  
  --card: oklch(1 0 0);                           /* White */
  --card-foreground: oklch(0.157 0.017 252);
  
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.157 0.017 252);
  
  --primary: oklch(0.553 0.212 264.376);          /* #2563eb - Blue 600 */
  --primary-foreground: oklch(0.985 0.002 247);   /* White */
  
  --secondary: oklch(0.945 0.006 247);            /* #e2e8f0 - Slate 200 */
  --secondary-foreground: oklch(0.157 0.017 252);
  
  --muted: oklch(0.945 0.006 247);                /* #e2e8f0 */
  --muted-foreground: oklch(0.478 0.026 252);     /* #64748b - Slate 500 */
  
  --accent: oklch(0.628 0.118 195);               /* #06b6d4 - Cyan 500 */
  --accent-foreground: oklch(0.985 0.002 247);
  
  --destructive: oklch(0.577 0.245 27.325);       /* #dc2626 - Red 600 */
  --destructive-foreground: oklch(0.985 0.002 247);
  
  --border: oklch(0.898 0.009 247);               /* #cbd5e1 - Slate 300 */
  --input: oklch(0.898 0.009 247);
  --ring: oklch(0.553 0.212 264.376);
  
  --success: oklch(0.628 0.148 155);
  --success-foreground: oklch(0.985 0.002 247);
  
  --warning: oklch(0.731 0.156 75);
  --warning-foreground: oklch(0.157 0.017 252);
}

/* Radius Variables */
:root {
  --radius: 0.5rem;  /* Moderate roundness */
}

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  
  /* Map to Tailwind colors */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
}
```

### 3.4 Using Colors in Components

```tsx
// ✅ Semantic color usage
<Button variant="default">      {/* Uses primary */}
<Button variant="secondary">    {/* Uses secondary */}
<Button variant="destructive">  {/* Uses destructive */}
<Button variant="ghost">        {/* Uses muted */}

// ✅ Background colors
<div className="bg-background">       {/* App background */}
<div className="bg-card">             {/* Card surfaces */}
<div className="bg-muted">            {/* Subtle backgrounds */}

// ✅ Text colors
<p className="text-foreground">       {/* Primary text */}
<p className="text-muted-foreground"> {/* Secondary text */}
<p className="text-primary">          {/* Accent/link text */}

// ✅ Borders
<div className="border border-border">
<div className="ring-2 ring-ring">

// ✅ Custom semantic colors
<div className="bg-success text-success-foreground">
<div className="bg-warning text-warning-foreground">
```

### 3.5 Color Opacity

Use Tailwind's opacity utilities with CSS variables:

```tsx
// ✅ Correct opacity usage
<div className="bg-primary/10">     {/* 10% primary */}
<div className="bg-primary/20">     {/* 20% primary */}
<div className="border-border/50">  {/* 50% border */}

// ❌ Never hardcode with opacity
<div className="bg-blue-600/20">   {/* BAD */}
```

---

## 4. Typography

### 4.1 Font Family

**Primary Font**: Inter (UI, body text, headings)  
**Monospace Font**: JetBrains Mono (code, timestamps, technical data)

#### Installation

```bash
cd frontend
pnpm add @fontsource/inter @fontsource/jetbrains-mono
```

#### Setup in `main.tsx`

```tsx
import '@fontsource/inter/400.css';  // Regular
import '@fontsource/inter/500.css';  // Medium
import '@fontsource/inter/600.css';  // Semi-bold
import '@fontsource/inter/700.css';  // Bold
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
```

#### Configure in `style.css`

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  
  body {
    @apply bg-background text-foreground;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  
  code, pre, kbd, .mono {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
  }
}
```

### 4.2 Type Scale

Use Tailwind's default type scale with semantic sizing:

| Use Case | Class | Size | Weight |
|----------|-------|------|--------|
| **Page Title** | `text-4xl font-bold` | 36px | 700 |
| **Section Header** | `text-3xl font-bold` | 30px | 700 |
| **Card Title** | `text-xl font-semibold` | 20px | 600 |
| **Subsection** | `text-lg font-semibold` | 18px | 600 |
| **Body Large** | `text-base` | 16px | 400 |
| **Body** | `text-sm` | 14px | 400 |
| **Caption** | `text-xs text-muted-foreground` | 12px | 400 |
| **Label** | `text-sm font-medium` | 14px | 500 |

### 4.3 Typography Examples

```tsx
// ✅ Page headers
<h1 className="text-4xl font-bold tracking-tight">
  My Courses
</h1>

// ✅ Course title
<h2 className="text-xl font-semibold line-clamp-2">
  Complete React Developer Course
</h2>

// ✅ Instructor name
<p className="text-sm text-muted-foreground">
  by John Doe
</p>

// ✅ Duration/metadata
<span className="text-xs text-muted-foreground mono">
  4h 32m
</span>

// ✅ Description
<p className="text-sm leading-relaxed">
  Learn React from scratch...
</p>

// ✅ Section heading
<h3 className="text-lg font-semibold">
  Section 1: Introduction
</h3>
```

### 4.4 Line Height & Spacing

- **Headings**: Use `tracking-tight` for large text
- **Body**: Default `leading-normal` (1.5)
- **Descriptions**: Use `leading-relaxed` (1.625)
- **Labels**: Use `leading-none` for compact labels

---

## 5. Spacing & Layout

### 5.1 Spacing Scale

Use Tailwind's default 4px-based spacing scale:

| Value | Pixels | Use Case |
|-------|--------|----------|
| `1` | 4px | Tight spacing, icon gaps |
| `2` | 8px | Small gaps, button padding |
| `3` | 12px | Compact layouts |
| `4` | 16px | Standard component spacing |
| `6` | 24px | Section spacing |
| `8` | 32px | Large gaps |
| `12` | 48px | Major section breaks |
| `16` | 64px | Page-level spacing |

### 5.2 Container & Layout

```tsx
// ✅ Main app container
<div className="min-h-screen bg-background">
  {children}
</div>

// ✅ Content container with max width
<div className="container mx-auto px-4 py-6">
  {content}
</div>

// ✅ Grid for course cards
<div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
  {courses.map(course => <CourseCard key={course.id} {...course} />)}
</div>

// ✅ Flex layouts
<div className="flex items-center justify-between gap-4">
  <h1>Title</h1>
  <Button>Action</Button>
</div>
```

### 5.3 Card Spacing

```tsx
// ✅ Standard card padding
<Card className="p-6">
  <CardHeader className="p-0 pb-4">
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent className="p-0">
    Content
  </CardContent>
</Card>

// ✅ Compact card
<Card className="p-4">
  {content}
</Card>
```

### 5.4 Course Grid Layout

```tsx
// ✅ Fluid auto-fit grid (recommended)
<div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 p-6">
  {courses.map(course => (
    <CourseCard key={course.id} course={course} />
  ))}
</div>

// ✅ Responsive grid (alternative)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-6">
  {courses.map(course => (
    <CourseCard key={course.id} course={course} />
  ))}
</div>
```

---

## 6. Component Guidelines

### 6.1 CRITICAL: shadcn/ui Usage

**NEVER write custom versions of shadcn components. ALWAYS use the CLI.**

#### ✅ Required shadcn Components

Install these components for CourseFin:

```bash
cd frontend

# Basic UI
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add label
pnpm dlx shadcn@latest add separator

# Overlays
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add sheet
pnpm dlx shadcn@latest add popover
pnpm dlx shadcn@latest add tooltip

# Feedback
pnpm dlx shadcn@latest add toast
pnpm dlx shadcn@latest add skeleton
pnpm dlx shadcn@latest add progress
pnpm dlx shadcn@latest add alert

# Forms
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add checkbox
pnpm dlx shadcn@latest add radio-group
pnpm dlx shadcn@latest add slider

# Navigation
pnpm dlx shadcn@latest add tabs
pnpm dlx shadcn@latest add dropdown-menu
pnpm dlx shadcn@latest add scroll-area

# Display
pnpm dlx shadcn@latest add badge
pnpm dlx shadcn@latest add avatar
pnpm dlx shadcn@latest add accordion
```

### 6.2 Course Card Component

```tsx
// src/components/courses/CourseCard.tsx
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface CourseCardProps {
  course: {
    id: number;
    title: string;
    instructor: string;
    thumbnail: string;
    progress?: number;
    duration?: string;
  };
  onClick?: () => void;
}

export function CourseCard({ course, onClick }: CourseCardProps) {
  return (
    <Card 
      className="group cursor-pointer overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg"
      onClick={onClick}
    >
      {/* 16:9 Poster */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img 
          src={course.thumbnail} 
          alt={course.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        {course.duration && (
          <Badge 
            variant="secondary" 
            className="absolute bottom-2 right-2 mono text-xs"
          >
            {course.duration}
          </Badge>
        )}
      </div>

      {/* Metadata below poster */}
      <CardContent className="p-4">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug">
          {course.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {course.instructor}
        </p>
      </CardContent>

      {/* Progress bar at bottom */}
      {course.progress !== undefined && (
        <CardFooter className="p-0">
          <Progress 
            value={course.progress} 
            className="h-1 rounded-none" 
          />
        </CardFooter>
      )}
    </Card>
  );
}
```

### 6.3 Button Usage

```tsx
// ✅ Primary action
<Button variant="default" size="default">
  Add Course
</Button>

// ✅ Secondary action
<Button variant="secondary">
  Cancel
</Button>

// ✅ Destructive action
<Button variant="destructive">
  Delete Course
</Button>

// ✅ Ghost (subtle)
<Button variant="ghost" size="icon">
  <MoreVertical className="h-4 w-4" />
</Button>

// ✅ With icon
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Course
</Button>

// ✅ Loading state
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Save
</Button>
```

### 6.4 Dialog/Modal Pattern

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-[600px]">
    <DialogHeader>
      <DialogTitle>Add New Course</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4 py-4">
      {/* Form content */}
    </div>
    
    <DialogFooter>
      <Button variant="secondary" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSubmit}>
        Import Course
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 6.5 Toast Notifications

```tsx
import { useToast } from '@/hooks/use-toast';

function Component() {
  const { toast } = useToast();
  
  const handleSuccess = () => {
    toast({
      title: "Course added successfully",
      description: "React Developer Course has been imported.",
    });
  };
  
  const handleError = () => {
    toast({
      variant: "destructive",
      title: "Import failed",
      description: "Could not import course. Please try again.",
    });
  };
  
  // Custom success toast (using CSS variable)
  const handleCustomSuccess = () => {
    toast({
      className: "bg-success text-success-foreground",
      title: "Import complete",
      description: "All videos processed successfully.",
    });
  };
}
```

---

## 7. Animation & Motion

### 7.1 Animation Principles

- **Subtle**: Prefer small, quick animations
- **Purposeful**: Animate to provide feedback, not decoration
- **Respect User Preferences**: Honor `prefers-reduced-motion`

### 7.2 Transition Utilities

```tsx
// ✅ Standard transitions
<div className="transition-all duration-200 ease-in-out">
<div className="transition-colors duration-150">
<div className="transition-transform duration-200">

// ✅ Hover effects
<Card className="transition-all hover:scale-[1.02] hover:shadow-lg">

// ✅ Focus effects
<Button className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
```

### 7.3 Reduced Motion Support

Add to `style.css`:

```css
@layer utilities {
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}
```

### 7.4 Loading Animations

```tsx
// ✅ Skeleton loading
import { Skeleton } from '@/components/ui/skeleton';

<Card className="p-4">
  <Skeleton className="aspect-video w-full" />
  <Skeleton className="mt-4 h-4 w-3/4" />
  <Skeleton className="mt-2 h-3 w-1/2" />
</Card>

// ✅ Spinner (for buttons/inline)
import { Loader2 } from 'lucide-react';

<Loader2 className="h-4 w-4 animate-spin" />
```

### 7.5 Scale + Shadow Hover Pattern

```tsx
// ✅ Course card hover
<Card className="group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
  <img className="transition-transform duration-300 group-hover:scale-105" />
</Card>

// ✅ Button hover
<button className="transition-all hover:scale-105 active:scale-95">
```

---

## 8. Responsive Design

### 8.1 Breakpoints

Use Tailwind's default breakpoints:

| Prefix | Min Width | Typical Use |
|--------|-----------|-------------|
| `sm:` | 640px | Large phones |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large displays |

### 8.2 Mobile-First Approach

Always design mobile-first, then enhance for larger screens:

```tsx
// ✅ Mobile-first responsive
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// ✅ Responsive padding
<div className="px-4 py-6 md:px-6 lg:px-8">

// ✅ Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">

// ❌ Desktop-first (avoid)
<div className="grid-cols-4 lg:grid-cols-2 sm:grid-cols-1">
```

### 8.3 Course Grid Responsive

```tsx
// ✅ Recommended: Fluid auto-fit
<div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 md:gap-6">

// ✅ Alternative: Explicit breakpoints
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
```

### 8.4 Dialog Responsiveness

```tsx
// ✅ Responsive dialog
<DialogContent className="w-full max-w-[95vw] sm:max-w-[600px]">
  <DialogTitle className="text-xl sm:text-2xl">

// ✅ Sheet for mobile, dialog for desktop
const isMobile = useMediaQuery('(max-width: 640px)');

{isMobile ? (
  <Sheet>
    <SheetContent side="bottom">
      {content}
    </SheetContent>
  </Sheet>
) : (
  <Dialog>
    <DialogContent>
      {content}
    </DialogContent>
  </Dialog>
)}
```

---

## 9. Accessibility

### 9.1 Keyboard Navigation (REQUIRED)

All interactive elements MUST be keyboard accessible:

```tsx
// ✅ Proper button focus
<Button className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">

// ✅ Custom interactive elements
<div 
  role="button" 
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
>

// ✅ Skip to content link
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50"
>
  Skip to content
</a>
```

### 9.2 Focus Indicators

NEVER remove focus outlines. Always provide visible focus states:

```css
/* ✅ Custom focus styles */
.focus-visible\:ring-2 {
  outline: none;
  ring: 2px solid hsl(var(--ring));
}

/* ❌ NEVER DO THIS */
*:focus {
  outline: none; /* BAD - removes accessibility */
}
```

### 9.3 ARIA Labels

```tsx
// ✅ Icon buttons need labels
<Button variant="ghost" size="icon" aria-label="Delete course">
  <Trash2 className="h-4 w-4" />
</Button>

// ✅ Descriptive links
<a href="#" aria-label={`View ${course.title}`}>

// ✅ Live regions for dynamic updates
<div role="status" aria-live="polite" aria-atomic="true">
  {toastMessage}
</div>

// ✅ Loading states
<Button disabled aria-busy="true">
  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
  Loading...
</Button>
```

### 9.4 Text Scaling Support

Support browser text size adjustments (DO NOT use fixed pixel heights for text containers):

```tsx
// ✅ Flexible text containers
<div className="min-h-[3rem] leading-normal">  {/* Uses rem, scales */}

// ❌ Fixed height (avoid)
<div className="h-[48px]">  {/* Won't scale with text size */}

// ✅ Line clamping with proper spacing
<p className="line-clamp-2 leading-relaxed">
```

### 9.5 Color Contrast

All text must meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text):

- Use `text-foreground` on `bg-background` ✅
- Use `text-primary-foreground` on `bg-primary` ✅
- Use `text-muted-foreground` on `bg-background` ✅ (carefully)
- NEVER use `text-muted-foreground` on `bg-muted` ❌ (likely fails contrast)

---

## 10. Code Organization

### 10.1 Component Structure

```tsx
// ✅ Proper component structure
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCourses } from '@/hooks/useCourses';
import type { Course } from '@/types';

// Props interface
interface CourseCardProps {
  course: Course;
  onSelect?: (course: Course) => void;
}

// Component
export function CourseCard({ course, onSelect }: CourseCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleClick = () => {
    onSelect?.(course);
  };
  
  return (
    <Card>
      {/* Component JSX */}
    </Card>
  );
}

// Helper functions below component (if needed)
function formatDuration(seconds: number): string {
  // ...
}
```

### 10.2 Import Order

```tsx
// 1. React imports
import { useState, useEffect } from 'react';

// 2. Third-party libraries
import { create } from 'zustand';

// 3. shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 4. Custom components
import { CourseCard } from '@/components/courses/CourseCard';

// 5. Hooks
import { useCourses } from '@/hooks/useCourses';

// 6. Stores
import { usePlayerStore } from '@/stores/playerStore';

// 7. Utilities
import { cn } from '@/lib/utils';

// 8. Types
import type { Course, Lecture } from '@/types';

// 9. Assets
import logo from '@/assets/images/logo.png';
```

### 10.3 Feature-Based Organization

```
components/
├── courses/
│   ├── CourseCard.tsx         # Single responsibility
│   ├── CourseGrid.tsx         # Composes CourseCard
│   ├── CourseDetail.tsx       # Detail view
│   ├── CourseProgress.tsx     # Progress component
│   └── index.ts               # Export barrel
│
└── player/
    ├── PlayerView.tsx
    ├── PlayerControls.tsx
    └── index.ts
```

Export barrel (`index.ts`):
```tsx
export { CourseCard } from './CourseCard';
export { CourseGrid } from './CourseGrid';
export { CourseDetail } from './CourseDetail';
export { CourseProgress } from './CourseProgress';
```

---

## 11. Common Patterns

### 11.1 Empty States

```tsx
// src/components/library/EmptyLibrary.tsx
import { BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyLibrary({ onAddCourse }: { onAddCourse: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      {/* Icon */}
      <div className="mb-6 rounded-full bg-primary/10 p-6">
        <BookOpen className="h-12 w-12 text-primary" />
      </div>
      
      {/* Heading */}
      <h2 className="mb-2 text-2xl font-bold">
        No courses yet
      </h2>
      
      {/* Description */}
      <p className="mb-8 max-w-sm text-muted-foreground">
        Get started by importing your first Udemy course to build your learning library.
      </p>
      
      {/* CTA */}
      <Button size="lg" onClick={onAddCourse}>
        <Plus className="mr-2 h-5 w-5" />
        Add Your First Course
      </Button>
    </div>
  );
}
```

### 11.2 Loading States

```tsx
// Skeleton for course grid
export function CourseGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-video w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-1 w-full rounded-none" />
        </Card>
      ))}
    </div>
  );
}

// Usage
{isLoading ? (
  <CourseGridSkeleton />
) : (
  <CourseGrid courses={courses} />
)}
```

### 11.3 Error States

```tsx
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function ErrorState({ 
  title = "Something went wrong",
  message,
  onRetry 
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2">
          {message}
        </AlertDescription>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="mt-4"
          >
            Try Again
          </Button>
        )}
      </Alert>
    </div>
  );
}
```

### 11.4 Progress Bar

```tsx
// Thin progress bar at bottom of course card
import { Progress } from '@/components/ui/progress';

<CardFooter className="p-0">
  <Progress 
    value={progressPercent} 
    className="h-1 rounded-none" 
  />
</CardFooter>

// Progress with text
<div className="space-y-2">
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">Progress</span>
    <span className="font-medium">{progressPercent}%</span>
  </div>
  <Progress value={progressPercent} />
</div>
```

### 11.5 Video Player Controls Overlay

```tsx
// src/components/player/PlayerControls.tsx
export function PlayerControls({ 
  isPlaying, 
  currentTime, 
  duration,
  onPlayPause,
  onSeek 
}: PlayerControlsProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent p-4">
      <div className="space-y-2">
        {/* Timeline */}
        <Slider
          value={[currentTime]}
          max={duration}
          step={0.1}
          onValueChange={([value]) => onSeek(value)}
          className="cursor-pointer"
        />
        
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onPlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            
            <span className="mono text-sm text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Fullscreen">
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 12. State Management

### 12.1 Zustand Setup

```bash
cd frontend
pnpm add zustand
```

### 12.2 Course Store Example

```tsx
// src/stores/courseStore.ts
import { create } from 'zustand';
import type { Course } from '@/types';

interface CourseState {
  courses: Course[];
  selectedCourse: Course | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCourses: (courses: Course[]) => void;
  selectCourse: (course: Course | null) => void;
  addCourse: (course: Course) => void;
  removeCourse: (id: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCourseStore = create<CourseState>((set) => ({
  courses: [],
  selectedCourse: null,
  isLoading: false,
  error: null,
  
  setCourses: (courses) => set({ courses }),
  selectCourse: (course) => set({ selectedCourse: course }),
  addCourse: (course) => set((state) => ({ 
    courses: [...state.courses, course] 
  })),
  removeCourse: (id) => set((state) => ({
    courses: state.courses.filter((c) => c.id !== id)
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
```

### 12.3 Using Stores in Components

```tsx
import { useCourseStore } from '@/stores/courseStore';

export function CourseGrid() {
  const { courses, isLoading, error } = useCourseStore();
  const selectCourse = useCourseStore((state) => state.selectCourse);
  
  if (isLoading) return <CourseGridSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (courses.length === 0) return <EmptyLibrary />;
  
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
      {courses.map((course) => (
        <CourseCard 
          key={course.id} 
          course={course}
          onClick={() => selectCourse(course)}
        />
      ))}
    </div>
  );
}
```

---

## 13. Do's and Don'ts

### 13.1 Wails Desktop App (CRITICAL)

| ✅ DO | ❌ DON'T |
|-------|----------|
| Use Wails bindings: `import { GetCourses } from '@/wailsjs/go/main/App'` | Use fetch/axios for backend calls |
| Use Wails runtime for dialogs | Create web-style file upload inputs |
| Understand it's a desktop app | Think of it as a web app |
| Use async/await with Wails calls | Expect REST API endpoints |
| Handle errors from Go backend | Assume HTTP status codes |

### 13.2 Color & Styling

| ✅ DO | ❌ DON'T |
|-------|----------|
| Use CSS variables: `bg-primary` | Hardcode colors: `bg-blue-600` |
| Use semantic color names | Use arbitrary color values |
| Use `bg-primary/10` for opacity | Use `bg-blue-600/10` |
| Test in both light and dark themes | Assume only dark theme |

### 13.3 Components

| ✅ DO | ❌ DON'T |
|-------|----------|
| Use `pnpm dlx shadcn@latest add button` | Copy shadcn code from docs |
| Import from `@/components/ui/button` | Write custom button component |
| Extend shadcn with `className` | Modify shadcn components directly |
| Use composition for complex components | Create monolithic components |

### 13.4 Package Management

| ✅ DO | ❌ DON'T |
|-------|----------|
| Use `pnpm install` | Use `npm install` or `yarn` |
| Use `pnpm add package` | Use `npm add` or `yarn add` |
| Check `pnpm-lock.yaml` into git | Commit `package-lock.json` |

### 13.5 Accessibility

| ✅ DO | ❌ DON'T |
|-------|----------|
| Provide `aria-label` for icon buttons | Use unlabeled icons |
| Use semantic HTML (`<button>`, `<nav>`) | Use `<div>` for everything |
| Test keyboard navigation | Only test with mouse |
| Show focus indicators | Remove focus outlines |

### 13.6 Responsive Design

| ✅ DO | ❌ DON'T |
|-------|----------|
| Design mobile-first | Start with desktop |
| Use `sm:`, `md:`, `lg:` prefixes | Use arbitrary breakpoints |
| Test on multiple screen sizes | Only test on your display |
| Use fluid grids with `auto-fit` | Use fixed column counts |

### 13.7 TypeScript

| ✅ DO | ❌ DON'T |
|-------|----------|
| Define proper interfaces | Use `any` type |
| Import types with `type` keyword | Import all as values |
| Use optional chaining `course?.title` | Assume properties exist |
| Handle undefined states | Ignore null/undefined |

---

## 14. Reference Examples

### 14.1 Complete Course Card

```tsx
// src/components/courses/CourseCard.tsx
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, User } from 'lucide-react';
import type { Course } from '@/types';

interface CourseCardProps {
  course: Course;
  onClick?: () => void;
}

export function CourseCard({ course, onClick }: CourseCardProps) {
  const progressPercent = course.progress ?? 0;
  const hasProgress = progressPercent > 0;
  
  return (
    <Card 
      className="group cursor-pointer overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
      onClick={onClick}
    >
      {/* 16:9 Aspect Ratio Poster */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img 
          src={course.thumbnailPath || '/placeholder.jpg'} 
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Duration Badge */}
        {course.totalDuration && (
          <Badge 
            variant="secondary" 
            className="absolute bottom-2 right-2 mono text-xs backdrop-blur-sm"
          >
            <Clock className="mr-1 h-3 w-3" />
            {formatDuration(course.totalDuration)}
          </Badge>
        )}
        
        {/* In Progress Indicator */}
        {hasProgress && progressPercent < 100 && (
          <Badge 
            className="absolute top-2 left-2 bg-primary text-primary-foreground"
          >
            In Progress
          </Badge>
        )}
        
        {/* Completed Badge */}
        {progressPercent >= 100 && (
          <Badge 
            className="absolute top-2 left-2 bg-success text-success-foreground"
          >
            Completed
          </Badge>
        )}
      </div>
      
      {/* Course Info */}
      <CardContent className="p-4 space-y-2">
        {/* Title */}
        <h3 className="line-clamp-2 text-base font-semibold leading-snug">
          {course.title}
        </h3>
        
        {/* Instructor */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <User className="h-3.5 w-3.5" />
          <span className="truncate">{course.instructorName}</span>
        </div>
        
        {/* Metadata Row */}
        {course.totalLectures && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{course.totalLectures} lectures</span>
            {course.level && (
              <>
                <span>•</span>
                <span>{course.level}</span>
              </>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Progress Bar */}
      {hasProgress && (
        <CardFooter className="p-0">
          <Progress 
            value={progressPercent} 
            className="h-1 rounded-none"
            aria-label={`${progressPercent}% complete`}
          />
        </CardFooter>
      )}
    </Card>
  );
}

// Helper function
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
```

### 14.2 Import Dialog

```tsx
// src/components/courses/ImportCourseDialog.tsx
import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportCourseDialog({ open, onOpenChange }: ImportCourseDialogProps) {
  const [folderPath, setFolderPath] = useState('');
  const [udemyUrl, setUdemyUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  
  const handleSelectFolder = async () => {
    // Call Wails backend to open folder picker
    // const path = await SelectFolder();
    // setFolderPath(path);
  };
  
  const handleImport = async () => {
    if (!folderPath || !udemyUrl) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a folder and enter a Udemy URL.",
      });
      return;
    }
    
    setIsImporting(true);
    
    try {
      // Call Wails backend
      // await ImportCourse(folderPath, udemyUrl);
      
      toast({
        title: "Course imported successfully",
        description: "Your course has been added to the library.",
      });
      
      onOpenChange(false);
      setFolderPath('');
      setUdemyUrl('');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Course</DialogTitle>
          <DialogDescription>
            Select a course folder and provide the Udemy URL to import metadata.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Folder Selection */}
          <div className="space-y-2">
            <Label htmlFor="folder">Course Folder</Label>
            <div className="flex gap-2">
              <Input
                id="folder"
                value={folderPath}
                placeholder="Select course folder..."
                readOnly
                className="flex-1"
              />
              <Button 
                variant="secondary" 
                onClick={handleSelectFolder}
                disabled={isImporting}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Browse
              </Button>
            </div>
          </div>
          
          {/* Udemy URL */}
          <div className="space-y-2">
            <Label htmlFor="url">Udemy Course URL</Label>
            <Input
              id="url"
              type="url"
              value={udemyUrl}
              onChange={(e) => setUdemyUrl(e.target.value)}
              placeholder="https://www.udemy.com/course/..."
              disabled={isImporting}
            />
            <p className="text-xs text-muted-foreground">
              We'll fetch course metadata from this URL
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="secondary" 
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            disabled={isImporting || !folderPath || !udemyUrl}
          >
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import Course
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 14.3 Library View

```tsx
// src/components/library/LibraryView.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { CourseGrid } from '@/components/courses/CourseGrid';
import { CourseGridSkeleton } from '@/components/courses/CourseGridSkeleton';
import { EmptyLibrary } from '@/components/library/EmptyLibrary';
import { ImportCourseDialog } from '@/components/courses/ImportCourseDialog';
import { useCourseStore } from '@/stores/courseStore';

export function LibraryView() {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { courses, isLoading } = useCourseStore();
  
  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.instructorName?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const isEmpty = !isLoading && courses.length === 0;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4 md:px-6">
          {/* Title */}
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            My Courses
          </h1>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search - Hide on mobile if empty */}
            {!isEmpty && (
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-9"
                />
              </div>
            )}
            
            {/* Add Course Button */}
            <Button onClick={() => setImportDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add Course</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
        
        {/* Mobile Search */}
        {!isEmpty && (
          <div className="container mx-auto px-4 pb-4 sm:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        )}
      </header>
      
      {/* Content */}
      <main id="main-content" className="container mx-auto px-4 py-6 md:px-6">
        {isLoading ? (
          <CourseGridSkeleton />
        ) : isEmpty ? (
          <EmptyLibrary onAddCourse={() => setImportDialogOpen(true)} />
        ) : filteredCourses.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-muted-foreground">
              No courses match your search
            </p>
          </div>
        ) : (
          <CourseGrid courses={filteredCourses} />
        )}
      </main>
      
      {/* Import Dialog */}
      <ImportCourseDialog 
        open={importDialogOpen} 
        onOpenChange={setImportDialogOpen} 
      />
    </div>
  );
}
```

---

## 15. Wails-Specific Patterns

### 15.1 Backend Communication

**NEVER use fetch/axios. ALWAYS use Wails bindings.**

```tsx
// ❌ WRONG - This is NOT a web app
const response = await fetch('/api/courses');
const courses = await response.json();

// ✅ CORRECT - Use Wails bindings
import { GetAllCourses } from '@/wailsjs/go/main/App';

const courses = await GetAllCourses();  // Direct Go function call
```

### 15.2 Native File Dialogs

```tsx
// Use Wails runtime for file/folder selection
import { SelectFolder, SelectFile } from '@/wailsjs/go/main/App';

// Example: Import course dialog
const handleSelectFolder = async () => {
  try {
    const folderPath = await SelectFolder();
    setFolderPath(folderPath);
  } catch (error) {
    console.error('Folder selection cancelled or failed');
  }
};

// Usage in component
<Button onClick={handleSelectFolder}>
  <FolderOpen className="mr-2 h-4 w-4" />
  Browse
</Button>
```

### 15.3 Error Handling with Wails

```tsx
// Wails bindings throw errors that can be caught
import { ImportCourse } from '@/wailsjs/go/main/App';
import { useToast } from '@/hooks/use-toast';

const handleImport = async () => {
  try {
    const course = await ImportCourse(folderPath, udemyUrl);
    
    toast({
      title: "Success",
      description: `${course.title} imported successfully`,
    });
  } catch (error) {
    // Error from Go backend
    toast({
      variant: "destructive",
      title: "Import failed",
      description: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
```

### 15.4 Window Management

```tsx
// Use Wails runtime for window operations
import { WindowMinimise, WindowMaximise, WindowFullscreen, Quit } from '@/wailsjs/runtime/runtime';

// Custom title bar buttons (if using frameless window)
<div className="flex items-center gap-2">
  <Button variant="ghost" size="icon" onClick={WindowMinimise}>
    <Minimize2 className="h-4 w-4" />
  </Button>
  <Button variant="ghost" size="icon" onClick={WindowMaximise}>
    <Maximize2 className="h-4 w-4" />
  </Button>
  <Button variant="ghost" size="icon" onClick={Quit}>
    <X className="h-4 w-4" />
  </Button>
</div>
```

### 15.5 Loading States with Async Wails Calls

```tsx
import { GetCourseDetail } from '@/wailsjs/go/main/App';

function CourseDetail({ courseId }: { courseId: number }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadCourse = async () => {
      try {
        setIsLoading(true);
        const data = await GetCourseDetail(courseId);
        setCourse(data);
      } catch (error) {
        console.error('Failed to load course:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCourse();
  }, [courseId]);
  
  if (isLoading) return <Skeleton />;
  if (!course) return <ErrorState />;
  
  return <div>{/* Course detail UI */}</div>;
}
```

### 15.6 Events from Backend

```tsx
// Listen to events from Go backend
import { EventsOn, EventsOff } from '@/wailsjs/runtime/runtime';

useEffect(() => {
  // Listen for progress updates from backend
  EventsOn('import:progress', (progress: number) => {
    setImportProgress(progress);
  });
  
  EventsOn('import:complete', (course: Course) => {
    toast({ title: "Import complete" });
    // Update state...
  });
  
  // Cleanup
  return () => {
    EventsOff('import:progress');
    EventsOff('import:complete');
  };
}, []);
```

### 15.7 Typical Wails Component Pattern

```tsx
// src/components/courses/ImportCourseDialog.tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderOpen, Loader2 } from 'lucide-react';

// Import Wails bindings
import { SelectCourseFolder, ImportCourse } from '@/wailsjs/go/main/App';
import { useToast } from '@/hooks/use-toast';

export function ImportCourseDialog({ open, onOpenChange }: Props) {
  const [folderPath, setFolderPath] = useState('');
  const [udemyUrl, setUdemyUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  
  // Use Wails binding for folder selection
  const handleBrowse = async () => {
    try {
      const path = await SelectCourseFolder();
      if (path) setFolderPath(path);
    } catch (error) {
      console.error('Folder selection cancelled');
    }
  };
  
  // Use Wails binding for import
  const handleImport = async () => {
    if (!folderPath || !udemyUrl) return;
    
    setIsImporting(true);
    try {
      const course = await ImportCourse(folderPath, udemyUrl);
      
      toast({
        title: "Course imported",
        description: course.title,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Course</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input 
              value={folderPath} 
              readOnly 
              placeholder="Select folder..."
            />
            <Button onClick={handleBrowse}>
              <FolderOpen className="h-4 w-4" />
            </Button>
          </div>
          
          <Input
            value={udemyUrl}
            onChange={(e) => setUdemyUrl(e.target.value)}
            placeholder="Udemy course URL..."
          />
          
          <Button 
            onClick={handleImport} 
            disabled={isImporting || !folderPath || !udemyUrl}
            className="w-full"
          >
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 16. Checklist for AI Agents

Before generating any frontend code, verify:

- [ ] **THIS IS A WAILS DESKTOP APP** - Not a web app
- [ ] Using Wails bindings for backend communication (NOT fetch/axios)
- [ ] Working in `/frontend/` directory
- [ ] Using `pnpm` for all package operations
- [ ] Using shadcn CLI (`pnpm dlx shadcn@latest add`) for UI components
- [ ] NEVER hardcoding colors (always use CSS variables)
- [ ] Using proper TypeScript types
- [ ] Following feature-based component organization
- [ ] Including proper accessibility attributes
- [ ] Testing keyboard navigation
- [ ] Using semantic HTML
- [ ] Including loading and error states
- [ ] Following mobile-first responsive design
- [ ] Using `@/` import alias
- [ ] Adding proper ARIA labels for icon buttons
- [ ] Respecting `prefers-reduced-motion`
- [ ] Using Inter font for UI, JetBrains Mono for code
- [ ] Following the Scale + Shadow hover pattern
- [ ] Using skeleton loaders for loading states
- [ ] Positioning toasts in bottom right
- [ ] Using Zustand for state management
- [ ] Following the Do's and Don'ts section
- [ ] Understanding this is a DESKTOP app with native capabilities

---

## 17. Quick Reference

### Color Classes
```tsx
// Backgrounds
bg-background, bg-card, bg-primary, bg-secondary, bg-muted, bg-accent

// Text
text-foreground, text-muted-foreground, text-primary, text-accent

// Borders
border-border, ring-ring

// Custom semantic
bg-success, bg-warning, text-success-foreground, text-warning-foreground
```

### Common Patterns
```tsx
// Hover effect
className="transition-all hover:scale-[1.02] hover:shadow-lg"

// Focus ring
className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

// Loading button
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Save
</Button>

// Fluid grid
className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6"
```

### Keyboard Shortcuts (to implement)
- `Space`: Play/Pause
- `←/→`: Seek ±10s
- `↑/↓`: Volume ±5%
- `F`: Fullscreen
- `N`: Next lecture
- `P`: Previous lecture

---

**End of Style Guide**

This document should be provided to all AI agents working on the CourseFin frontend. Adherence to these guidelines ensures consistency, accessibility, and maintainability throughout the project.

**Last Updated:** February 18, 2026  
**Version:** 1.0.0
