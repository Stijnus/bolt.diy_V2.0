# BoltDYI Design System

**Brand Identity & UI/UX Guidelines**  
**Version:** 1.0  
**Last Updated:** January 3, 2025

---

## 🎨 Brand Overview

**BoltDYI** represents AI-powered development with a focus on:
- **Speed** (Lightning bolt symbolism)
- **Technology** (Circuit board patterns)
- **Intelligence** (AI badge)
- **Innovation** (Modern, futuristic aesthetic)

The logo features:
- ⚡ Circuit board lightning bolt (core symbol)
- 🔵 Circular tech rings (orbital design)
- 🤖 "AI" badge (intelligent assistance)
- 💠 Gradient cyan-to-blue palette (tech-forward)

---

## 🎨 Color Palette

### Primary Colors

#### Cyan (Primary Brand Color)
```css
--cyan-50:  #E0F7FA;   /* Very light cyan - backgrounds */
--cyan-100: #B2EBF2;   /* Light cyan - hover states */
--cyan-200: #80DEEA;   /* Soft cyan */
--cyan-300: #4DD0E1;   /* Medium cyan */
--cyan-400: #26C6DA;   /* Bright cyan */
--cyan-500: #00BCD4;   /* Primary cyan - main brand color */
--cyan-600: #00ACC1;   /* Deep cyan */
--cyan-700: #0097A7;   /* Darker cyan */
--cyan-800: #00838F;   /* Very dark cyan */
--cyan-900: #006064;   /* Darkest cyan */
```

#### Electric Blue (Secondary Brand Color)
```css
--blue-50:  #E3F2FD;   /* Very light blue */
--blue-100: #BBDEFB;   /* Light blue */
--blue-200: #90CAF9;   /* Soft blue */
--blue-300: #64B5F6;   /* Medium blue */
--blue-400: #42A5F5;   /* Bright blue */
--blue-500: #2196F3;   /* Primary blue */
--blue-600: #1E88E5;   /* Deep blue */
--blue-700: #1976D2;   /* Darker blue */
--blue-800: #1565C0;   /* Very dark blue */
--blue-900: #0D47A1;   /* Darkest blue */
```

### Gradient Definitions

#### Brand Gradient (Primary)
```css
--gradient-primary: linear-gradient(135deg, #00BCD4 0%, #2196F3 100%);
--gradient-primary-hover: linear-gradient(135deg, #00ACC1 0%, #1E88E5 100%);
```

#### Circuit Gradient (Accent)
```css
--gradient-circuit: linear-gradient(90deg, #00BCD4 0%, #4DD0E1 50%, #00BCD4 100%);
```

#### Glow Gradient (Effects)
```css
--gradient-glow: radial-gradient(circle, rgba(0,188,212,0.3) 0%, transparent 70%);
```

### Neutral Colors

#### Light Theme
```css
--gray-50:  #FAFAFA;   /* Lightest gray */
--gray-100: #F5F5F5;   /* Very light gray - backgrounds */
--gray-200: #EEEEEE;   /* Light gray - borders */
--gray-300: #E0E0E0;   /* Medium light gray */
--gray-400: #BDBDBD;   /* Medium gray - disabled */
--gray-500: #9E9E9E;   /* Gray - secondary text */
--gray-600: #757575;   /* Dark gray - text */
--gray-700: #616161;   /* Darker gray */
--gray-800: #424242;   /* Very dark gray */
--gray-900: #212121;   /* Darkest gray - headings */
```

#### Dark Theme
```css
--dark-50:  #1E1E1E;   /* Lightest dark */
--dark-100: #1A1A1A;   /* Very light dark */
--dark-200: #161616;   /* Light dark - cards */
--dark-300: #121212;   /* Medium dark - surfaces */
--dark-400: #0D0D0D;   /* Dark - backgrounds */
--dark-500: #0A0A0A;   /* Darker background */
--dark-600: #070707;   /* Very dark background */
--dark-700: #050505;   /* Darkest background */
```

### Semantic Colors

#### Success (Green)
```css
--success-light: #81C784;
--success-main:  #4CAF50;
--success-dark:  #388E3C;
```

#### Warning (Orange/Yellow)
```css
--warning-light: #FFB74D;
--warning-main:  #FF9800;
--warning-dark:  #F57C00;
```

#### Error (Red)
```css
--error-light: #E57373;
--error-main:  #F44336;
--error-dark:  #D32F2F;
```

#### Info (Cyan - matches brand)
```css
--info-light: #4DD0E1;
--info-main:  #00BCD4;
--info-dark:  #0097A7;
```

---

## 🔤 Typography

### Font Families

#### Primary Font: Inter
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```
**Usage:** Body text, UI elements, most content

#### Secondary Font: JetBrains Mono (Code)
```css
--font-code: 'JetBrains Mono', 'Fira Code', 'Monaco', monospace;
```
**Usage:** Code editor, terminal, technical content

#### Display Font: Orbitron (Optional - for headings)
```css
--font-display: 'Orbitron', 'Inter', sans-serif;
```
**Usage:** Large headings, hero text, tech-focused sections

### Font Scales

#### Headings
```css
--text-xs:   0.75rem;   /* 12px */
--text-sm:   0.875rem;  /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg:   1.125rem;  /* 18px */
--text-xl:   1.25rem;   /* 20px */
--text-2xl:  1.5rem;    /* 24px */
--text-3xl:  1.875rem;  /* 30px */
--text-4xl:  2.25rem;   /* 36px */
--text-5xl:  3rem;      /* 48px */
--text-6xl:  3.75rem;   /* 60px */
```

#### Font Weights
```css
--font-light:   300;
--font-normal:  400;
--font-medium:  500;
--font-semibold: 600;
--font-bold:    700;
--font-black:   900;
```

#### Line Heights
```css
--leading-none:   1;
--leading-tight:  1.25;
--leading-snug:   1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose:  2;
```

---

## 🎭 Themes

### Light Theme Variables
```css
:root {
  /* Backgrounds */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F5F5;
  --bg-tertiary: #FAFAFA;
  --bg-hover: #EEEEEE;
  
  /* Text */
  --text-primary: #212121;
  --text-secondary: #616161;
  --text-tertiary: #9E9E9E;
  --text-disabled: #BDBDBD;
  --text-inverse: #FFFFFF;
  
  /* Borders */
  --border-light: #EEEEEE;
  --border-main: #E0E0E0;
  --border-dark: #BDBDBD;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
  
  /* Brand accents */
  --accent-primary: #00BCD4;
  --accent-secondary: #2196F3;
  --accent-glow: rgba(0, 188, 212, 0.15);
}
```

### Dark Theme Variables
```css
[data-theme="dark"] {
  /* Backgrounds */
  --bg-primary: #121212;
  --bg-secondary: #1A1A1A;
  --bg-tertiary: #1E1E1E;
  --bg-hover: #262626;
  
  /* Text */
  --text-primary: #FFFFFF;
  --text-secondary: #B0B0B0;
  --text-tertiary: #808080;
  --text-disabled: #505050;
  --text-inverse: #121212;
  
  /* Borders */
  --border-light: #262626;
  --border-main: #303030;
  --border-dark: #404040;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.6);
  
  /* Brand accents (more vibrant in dark mode) */
  --accent-primary: #26C6DA;
  --accent-secondary: #42A5F5;
  --accent-glow: rgba(38, 198, 218, 0.25);
}
```

---

## 🎯 UI Components

### Buttons

#### Primary Button (Brand)
```css
.btn-primary {
  background: linear-gradient(135deg, #00BCD4 0%, #2196F3 100%);
  color: white;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 188, 212, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 188, 212, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: transparent;
  color: var(--accent-primary);
  border: 2px solid var(--accent-primary);
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: var(--accent-primary);
  color: white;
}
```

#### Ghost Button
```css
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: none;
  font-weight: 500;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
```

### Cards

#### Base Card
```css
.card {
  background: var(--bg-primary);
  border: 1px solid var(--border-main);
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--accent-primary);
}
```

#### Featured Card (with glow)
```css
.card-featured {
  background: var(--bg-primary);
  border: 2px solid var(--accent-primary);
  border-radius: 0.75rem;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

.card-featured::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: var(--gradient-glow);
  opacity: 0.1;
  pointer-events: none;
}
```

### Inputs

#### Text Input
```css
.input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-main);
  border-radius: 0.5rem;
  color: var(--text-primary);
  font-size: 1rem;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.input::placeholder {
  color: var(--text-tertiary);
}
```

#### Code Input (Terminal-style)
```css
.input-code {
  font-family: var(--font-code);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-dark);
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: var(--accent-primary);
}
```

---

## ✨ Effects & Animations

### Circuit Glow Effect
```css
.circuit-glow {
  position: relative;
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 10px rgba(0, 188, 212, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(0, 188, 212, 0.6);
  }
}
```

### Loading Animation (Circuit Pattern)
```css
.loader-circuit {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-main);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### Hover Glow
```css
.hover-glow {
  transition: all 0.3s ease;
}

.hover-glow:hover {
  box-shadow: 0 0 20px var(--accent-glow);
  border-color: var(--accent-primary);
}
```

### Slide In Animation
```css
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-in {
  animation: slideInUp 0.4s ease-out;
}
```

---

## 🎨 Component Patterns

### Hero Section
```jsx
<div className="hero">
  <div className="circuit-glow">
    <img src="/logo.svg" alt="BoltDYI" />
  </div>
  <h1 className="text-5xl font-bold gradient-text">
    AI-Powered Development
  </h1>
  <p className="text-secondary">
    Build full-stack applications at lightning speed
  </p>
  <button className="btn-primary">
    Get Started →
  </button>
</div>

<style>
.gradient-text {
  background: linear-gradient(135deg, #00BCD4 0%, #2196F3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
```

### Navigation Bar
```jsx
<nav className="navbar">
  <div className="nav-logo">
    <img src="/logo-small.svg" alt="BoltDYI" />
    <span className="gradient-text">BoltDYI</span>
  </div>
  
  <div className="nav-links">
    <a href="/projects">Projects</a>
    <a href="/templates">Templates</a>
    <a href="/docs">Docs</a>
  </div>
  
  <div className="nav-actions">
    <button className="btn-ghost">
      <ThemeToggle />
    </button>
    <button className="btn-primary">Sign In</button>
  </div>
</nav>

<style>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-main);
  backdrop-filter: blur(10px);
}
</style>
```

### Project Card
```jsx
<div className="card hover-glow">
  <div className="card-header">
    <div className="project-icon circuit-pattern">
      <TerminalIcon />
    </div>
    <h3>My React App</h3>
  </div>
  
  <p className="text-secondary">
    Full-stack React application with TypeScript
  </p>
  
  <div className="card-footer">
    <span className="badge badge-cyan">React</span>
    <span className="badge badge-blue">TypeScript</span>
  </div>
  
  <button className="btn-secondary">Open →</button>
</div>
```

### Chat Message (AI)
```jsx
<div className="message message-ai">
  <div className="message-avatar gradient-bg">
    <AIIcon />
  </div>
  
  <div className="message-content">
    <div className="message-header">
      <span className="font-semibold">BoltDYI AI</span>
      <span className="badge-ai">AI</span>
    </div>
    
    <div className="message-body">
      I'll help you build that feature...
    </div>
  </div>
</div>

<style>
.badge-ai {
  background: linear-gradient(135deg, #00BCD4, #2196F3);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.gradient-bg {
  background: linear-gradient(135deg, #00BCD4, #2196F3);
}
</style>
```

---

## 🖼️ Iconography

### Style Guidelines
- **Line Weight:** 2px strokes
- **Corner Radius:** Rounded (4px)
- **Size Scale:** 16px, 20px, 24px, 32px, 48px
- **Color:** Match text color or use accent colors

### Icon Sets to Use
1. **Phosphor Icons** (recommended - matches tech aesthetic)
2. **Heroicons** (clean, modern alternative)
3. **Lucide** (consistent, customizable)

### Circuit Pattern Icons
For special occasions, use circuit board pattern overlays:
```css
.icon-circuit {
  position: relative;
  background: linear-gradient(135deg, #00BCD4, #2196F3);
  -webkit-mask: url('icon.svg');
  mask: url('icon.svg');
}
```

---

## 📐 Spacing System

### Scale
```css
--space-0:   0;
--space-1:   0.25rem;  /* 4px */
--space-2:   0.5rem;   /* 8px */
--space-3:   0.75rem;  /* 12px */
--space-4:   1rem;     /* 16px */
--space-5:   1.25rem;  /* 20px */
--space-6:   1.5rem;   /* 24px */
--space-8:   2rem;     /* 32px */
--space-10:  2.5rem;   /* 40px */
--space-12:  3rem;     /* 48px */
--space-16:  4rem;     /* 64px */
--space-20:  5rem;     /* 80px */
--space-24:  6rem;     /* 96px */
```

### Layout Guidelines
- **Compact:** 8px - 12px (terminal, dense lists)
- **Comfortable:** 16px - 24px (default UI)
- **Spacious:** 32px - 48px (landing pages, marketing)

---

## 🎬 Motion & Transitions

### Timing Functions
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Duration Scale
```css
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
```

### Animation Principles
1. **Fast feedback:** Button interactions (150ms)
2. **Normal transitions:** State changes (300ms)
3. **Slow animations:** Page transitions (500ms)
4. **Always ease-out** for user-triggered animations

---

## 📱 Responsive Breakpoints

```css
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
--breakpoint-2xl: 1536px; /* Extra large */
```

### Usage
```css
/* Mobile first approach */
.container {
  padding: 1rem;
}

@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 3rem;
  }
}
```

---

## ♿ Accessibility

### Color Contrast
- **Text on background:** Minimum 4.5:1 ratio (WCAG AA)
- **Large text:** Minimum 3:1 ratio
- **Interactive elements:** Minimum 3:1 ratio

### Focus States
```css
:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
```

### Screen Reader Support
- Use semantic HTML
- Add `aria-label` for icon buttons
- Include `alt` text for images
- Ensure keyboard navigation works

---

## 🎨 Brand Assets

### Logo Usage

#### Primary Logo (Full Color)
- Use on light backgrounds
- Maintain clear space (equal to bolt height)
- Minimum size: 120px width

#### Inverted Logo (White)
- Use on dark backgrounds or photos
- Same clear space rules apply

#### Icon Only (Bolt)
- Use in small spaces (favicon, app icons)
- Minimum size: 32px

### Don'ts
❌ Don't rotate the logo  
❌ Don't change the colors  
❌ Don't add effects (except approved glow)  
❌ Don't stretch or distort  
❌ Don't place on busy backgrounds without contrast

---

## 📦 Implementation

### CSS Variables Setup
```css
/* Load in your root CSS */
@import './design-system/colors.css';
@import './design-system/typography.css';
@import './design-system/components.css';
@import './design-system/animations.css';
```

### UnoCSS Configuration
```typescript
// uno.config.ts
export default {
  theme: {
    colors: {
      cyan: {
        50: '#E0F7FA',
        500: '#00BCD4',
        // ... rest of palette
      },
      // Add other colors
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
  },
}
```

### Tailwind Configuration (if used)
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        cyan: {
          // Your cyan palette
        },
      },
      fontFamily: {
        primary: ['Inter', 'sans-serif'],
        code: ['JetBrains Mono', 'monospace'],
      },
    },
  },
}
```

---

## 🚀 Getting Started

1. **Install fonts:**
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
   <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
   ```

2. **Load design tokens:**
   ```css
   @import './design-system.css';
   ```

3. **Set up theme toggle:**
   ```javascript
   document.documentElement.setAttribute('data-theme', 'dark');
   ```

4. **Use components:**
   ```jsx
   <button className="btn-primary">Click me</button>
   ```

---

## 📚 Resources

- **Figma Design File:** [Link to Figma]
- **Component Library:** [Link to Storybook]
- **Brand Guidelines:** This document
- **Logo Assets:** `/public/brand/`

---

**Questions?** Reach out to the design team or create an issue.

**Version History:**
- v1.0 (Jan 2025): Initial design system based on new BoltDYI brand
