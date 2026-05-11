# Frontend UI/UX Rules & Standards

**Version:** 1.0  
**Last Updated:** 2026-05-11  
**Status:** Active (Phase 9 - UI/UX Stabilization)

This document defines the UI/UX standards, patterns, and best practices for the GuimiCell OS frontend. All components must follow these guidelines to maintain visual consistency, performance, and accessibility.

---

## Table of Contents

1. [Design System Overview](#design-system-overview)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Shadows & Borders](#shadows--borders)
6. [Animation Standards](#animation-standards)
7. [Component Guidelines](#component-guidelines)
8. [Loading States & Feedback](#loading-states--feedback)
9. [Accessibility & Responsive Design](#accessibility--responsive-design)
10. [Pre-Submission Checklist](#pre-submission-checklist)

---

## Design System Overview

### Tech Stack
- **Framework:** Next.js 16.2.2 + React 19.2.4 + TypeScript 5
- **Styling:** Tailwind CSS 4 + CVA (Class Variance Authority)
- **UI Components:** shadcn/ui
- **State Management:** Zustand
- **Icons:** Lucide React
- **Charts:** Recharts (with centralized color constants)

### Core Principles
1. **Consistency:** Use predefined tokens, not magic values
2. **Performance:** Memoize expensive computations, lazy-load heavy components
3. **Accessibility:** WCAG 2.1 AA compliance minimum
4. **Semantic HTML:** Use proper semantic elements
5. **Responsive First:** Mobile-first design approach

---

## Color System

### Semantic Color Mapping

All colors are centralized in `lib/colors-config.ts`. DO NOT hardcode colors in components.

#### Primary Colors (From `tailwind.config.ts`)
```typescript
// Use Tailwind semantic tokens in components
className="text-primary"           // Primary blue (#0f42f2)
className="bg-secondary"           // Secondary accent
className="text-destructive"       // Red for errors
className="text-foreground"        // Text color (semantic)
className="bg-muted"               // Muted background
```

#### Status & Semantic Colors

**Success/Completed:**
```typescript
// Use emerald for positive/growth states
className="text-emerald-500"       // Icon
className="bg-emerald-500/10"      // Background
className="border-emerald-500/20"  // Border
```

**Warning/In-Progress:**
```typescript
// Use amber for caution states
className="text-amber-500"
className="bg-amber-500/10"
className="border-amber-500/20"
```

**Danger/Error:**
```typescript
// Use red for errors/critical
className="text-red-500"
className="bg-red-500/10"
className="border-red-500/20"
```

**Coming Soon:**
```typescript
// Use coming-soon badge variant instead of inline color
import { Badge } from "@/components/ui/badge"
<Badge variant="coming-soon">Em breve</Badge>
```

### Color Opacity Standards

All semantic color combinations use **consistent opacity patterns**:

| Usage | Background | Border | Text |
|-------|-----------|--------|------|
| Badge/Status | `{color}-500/10` | `{color}-500/20` | `{color}-600` |
| Alert Box | `{color}-500/5` | `{color}-500/20` | `{color}-700` |
| Icon + BG | `{color}-500/10` | N/A | `{color}-500` |

**Example - Alert Component:**
```tsx
import { ALERT_COLORS } from "@/lib/colors-config"

<div className={cn("rounded-lg p-3", ALERT_COLORS.urgente.bg)}>
  <Zap className={`w-4 h-4 ${ALERT_COLORS.urgente.icon}`} />
  Mensagem urgente
</div>
```

### Using Centralized Color Constants

```typescript
// ❌ DON'T: Hardcode colors
<div className="bg-red-500/10 text-red-600 border-red-500/20">
  Alta Prioridade
</div>

// ✅ DO: Use color constants
import { PRIORITY_COLORS } from "@/lib/colors-config"

<div className={PRIORITY_COLORS.ALTA}>
  Alta Prioridade
</div>
```

### Chart Colors

For Recharts and data visualizations, use hex colors from `CHART_COLORS_HEX`:

```typescript
import { CHART_COLORS_HEX } from "@/lib/colors-config"

<Bar 
  dataKey="revenue" 
  fill={CHART_COLORS_HEX.blue} 
  radius={[4, 4, 0, 0]} 
/>
```

**Available colors:**
- `blue: "#3b82f6"` - Primary data
- `red: "#ef4444"` - Negative/expense data
- `emerald: "#10b981"` - Profit/positive data
- `amber: "#f59e0b"` - Warning/caution data
- `purple: "#a855f7"` - Secondary data
- `orange: "#f97316"` - Tertiary data
- `zinc: "#71717a"` - Neutral data

---

## Typography

### Headings

Use semantic heading tags (`<h1>`, `<h2>`, etc.) with Tailwind classes:

```typescript
// Page Title (h1)
<h1 className="text-3xl font-bold">Dashboard</h1>

// Section Title (h2)
<h2 className="text-2xl font-semibold">Tarefas</h2>

// Subsection Title (h3)
<h3 className="text-xl font-semibold">Urgentes</h3>

// Card Title (use CardTitle component)
<CardTitle className="text-lg">Métrica</CardTitle>
```

### Body Text

```typescript
// Large body text (default)
<p className="text-base">Descrição normal</p>

// Small text (secondary info)
<p className="text-sm text-muted-foreground">Info secundária</p>

// Extra small (labels, badges)
<span className="text-xs font-medium">Label</span>

// Monospace (codes, values)
<code className="font-mono text-sm">const x = 10</code>
```

### Font Weights

```typescript
font-light      // 300 - Rarely used
font-normal     // 400 - Default body
font-medium     // 500 - Labels, secondary info
font-semibold   // 600 - Headings, emphasis
font-bold       // 700 - Strong emphasis
```

---

## Spacing & Layout

### Spacing Scale

Tailwind spacing uses `4px` base unit:

```typescript
space-0   = 0px
space-1   = 4px
space-2   = 8px
space-3   = 12px
space-4   = 16px   // Default spacing
space-6   = 24px   // Between sections
space-8   = 32px   // Major spacing
space-12  = 48px
space-16  = 64px
```

### Common Patterns

```typescript
// Grid gap (consistent spacing between items)
<div className="grid gap-4">
  {/* Each item gets 16px margin */}
</div>

// Flex spacing
<div className="flex items-center gap-2">
  {/* 8px between items */}
</div>

// Padding (container)
<div className="p-6">
  {/* 24px padding on all sides */}
</div>

// Padding (card)
<Card className="p-4">
  {/* 16px padding */}
</Card>
```

### Responsive Breakpoints

```typescript
// Mobile-first approach
className="p-4 sm:p-6 md:p-8 lg:p-12"

// Hide on mobile
className="hidden md:block"

// Show only on mobile
className="md:hidden"
```

### Grid Layout

```typescript
// Auto-layout grid
<div className="grid gap-4">
  {/* Single column, responsive stacking */}
</div>

// Fixed 2-column grid
<div className="grid grid-cols-2 gap-4">
  {/* 2 columns on all screens */}
</div>

// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 col on mobile, 2 on tablet, 3 on desktop */}
</div>
```

---

## Shadows & Borders

### Border Styles

```typescript
// Default border (subtle)
<div className="border">Bordered</div>

// No border
<div className="border-0">No border</div>

// Border color
<div className="border-2 border-destructive">Error border</div>

// Rounded corners
<div className="rounded">Default (4px)</div>
<div className="rounded-lg">Large (8px)</div>
<div className="rounded-full">Full (50%)</div>

// Border combined with color
<div className="border border-amber-500/20">Subtle</div>
```

### Shadow Styles

```typescript
// No shadow (cards need definition)
<Card>Content</Card>

// Using Card component (includes shadow)
<Card className="shadow-sm">Subtle shadow</Card>

// For custom elements needing depth
<div className="bg-white shadow-sm rounded-lg">
  Subtle shadow element
</div>
```

### Ring (Focus) Styles

All interactive elements need visible focus indicators:

```typescript
// Automatic (shadcn components handle this)
<Button>Default Button</Button>

// Custom ring
<input 
  className="focus:outline-none focus:ring-2 focus:ring-primary"
  type="text"
/>

// Ring offset (space between element and ring)
<button className="focus-visible:ring-2 focus-visible:ring-offset-2">
  Button
</button>
```

---

## Animation Standards

### Duration Guidelines

All animations use **ANIMATION_DURATIONS** from `lib/animation-config.ts`:

```typescript
import { ANIMATION_DURATIONS, ANIMATIONS } from "@/lib/animation-config"

// Fast: 100ms (quick feedback, dropdowns)
ANIMATION_DURATIONS.FAST          // 100ms

// Standard: 200ms (default, most transitions)
ANIMATION_DURATIONS.STANDARD      // 200ms

// Slow: 300ms (emphasis, modals)
ANIMATION_DURATIONS.SLOW          // 300ms

// Never use: 500ms+ (feels sluggish)
```

### Easing Functions

```typescript
import { ANIMATION_EASING } from "@/lib/animation-config"

// ease-linear: No acceleration (constant speed)
// Use for: Sidebar collapse, loading spinners
className="transition-all duration-200 ease-linear"

// ease-in-out: Smooth on both ends (recommended default)
// Use for: Modal appears, dialogs open
className="transition-all duration-200 ease-in-out"

// ease-out: Starts fast, ends slow (snappy, responsive)
// Use for: Dropdown menus, quick actions
className="transition-all duration-100 ease-out"

// ease-in: Starts slow, ends fast
// Use for: Very rare, avoid usually
```

### Pre-configured Animations

Use these instead of custom transition strings:

```typescript
import { ANIMATIONS } from "@/lib/animation-config"

// Sidebar collapse/expand
<div className={ANIMATIONS.SIDEBAR_COLLAPSE.class}>
  {/* Sidebar content */}
</div>

// Dropdown menu
<div className={ANIMATIONS.DROPDOWN.class}>
  Menu items
</div>

// Modal/Dialog
<div className={ANIMATIONS.MODAL.class}>
  Modal content
</div>

// Color hover transition
<button className={ANIMATIONS.HOVER_STATE.class}>
  Hover me
</button>

// Badge appear/disappear
<div className={ANIMATIONS.BADGE.class}>
  <Badge>Status</Badge>
</div>

// Loading spinner
<div className={ANIMATIONS.SPINNER.class}>
  Loading...
</div>
```

### When NOT to Animate

- Page transitions (use Next.js route changes)
- Scrolling (let browser handle naturally)
- Rapid state changes (can cause jank)
- Low-powered devices (add `prefers-reduced-motion` checks)

### Reduce Motion Support

```typescript
// Respect user preferences
<div className="transition-all duration-200 motion-safe:duration-200 motion-reduce:duration-0">
  Accessible animation
</div>
```

---

## Component Guidelines

### Button Component

```typescript
import { Button } from "@/components/ui/button"

// Variants
<Button>Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>

// States
<Button disabled>Disabled</Button>
<Button isLoading>Loading...</Button>

// With icon
<Button className="gap-2">
  <Save className="w-4 h-4" />
  Save Changes
</Button>
```

### Badge Component

```typescript
import { Badge } from "@/components/ui/badge"

// Available variants
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="ghost">Ghost</Badge>
<Badge variant="coming-soon">Em breve</Badge>

// With icon
<Badge className="gap-1">
  <AlertCircle className="w-3 h-3" />
  Urgente
</Badge>

// Always use for status labels, never inline colors
// ❌ DON'T: <span className="bg-red-500/10 px-2 py-1 rounded">Status</span>
// ✅ DO: <Badge variant="destructive">Status</Badge>
```

### Card Component

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader className="pb-3">
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    Content here
  </CardContent>
</Card>

// Variants
<Card className="border-2">Emphasized</Card>
<Card className="border-dashed">Dashed border</Card>
```

### Form Components

```typescript
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

// Always wrap inputs with Label for accessibility
<div className="space-y-2">
  <Label htmlFor="name">Name</Label>
  <Input id="name" placeholder="Enter name" />
</div>

// Form layout
<form className="space-y-6">
  <div className="space-y-2">
    <Label>Field 1</Label>
    <Input />
  </div>
  <div className="space-y-2">
    <Label>Field 2</Label>
    <Input />
  </div>
</form>
```

### Dialog/Modal

```typescript
import { AlertDialog, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"

<AlertDialog>
  <AlertDialogTrigger>Open</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Confirmar?</AlertDialogTitle>
    <AlertDialogDescription>
      Esta ação não pode ser desfeita.
    </AlertDialogDescription>
    <AlertDialogCancel>Cancelar</AlertDialogCancel>
    <AlertDialogAction>Confirmar</AlertDialogAction>
  </AlertDialogContent>
</AlertDialog>
```

### Sidebar Component

```typescript
// Sidebar uses data-collapsible attribute
// CSS pattern: group-data-[collapsible=icon] controls responsive hiding
// Example: Hide badges when sidebar collapses to icon-only view
<Badge className="group-data-[collapsible=icon]:hidden">Status</Badge>

// Sidebar respects ANIMATIONS.SIDEBAR_COLLAPSE (200ms ease-linear)
```

### Table Component

```typescript
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column 1</TableHead>
      <TableHead>Column 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Value 1</TableCell>
      <TableCell>Value 2</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## Loading States & Feedback

### Spinners & Loading Indicators

```typescript
import { Loader2 } from "lucide-react"
import { ANIMATIONS } from "@/lib/animation-config"

// Loading spinner (animated)
<Loader2 className={`w-4 h-4 ${ANIMATIONS.SPINNER.class}`} />

// Loading text
<span className="text-sm text-muted-foreground">Carregando...</span>

// Button with loading state
<Button disabled className="gap-2">
  <Loader2 className={ANIMATIONS.SPINNER.class} />
  Salvando...
</Button>
```

### Skeleton Loading

```typescript
import { Skeleton } from "@/components/ui/skeleton"

<div className="space-y-3">
  <Skeleton className="h-12 w-full rounded-lg" />
  <Skeleton className="h-12 w-3/4 rounded-lg" />
</div>
```

### Toast Notifications

```typescript
import { toast } from "sonner"

// Success
toast.success("Salvo com sucesso!")

// Error
toast.error("Erro ao salvar")

// Info
toast.info("Operação em progresso")

// Loading toast
const id = toast.loading("Processando...")
// Later: toast.dismiss(id)
```

### Empty States

Always provide helpful empty state messaging:

```typescript
<div className="flex flex-col items-center justify-center py-12 text-center">
  <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
  <h3 className="font-semibold mb-2">Nenhum item encontrado</h3>
  <p className="text-sm text-muted-foreground mb-4">
    Comece criando seu primeiro item
  </p>
  <Button>Criar Item</Button>
</div>
```

---

## Accessibility & Responsive Design

### WCAG 2.1 AA Compliance

#### Focus Management
```typescript
// All interactive elements must have visible focus indicators
// shadcn components handle this automatically
<Button>Default focus ring (automatic)</Button>

// Custom elements
<input className="focus:outline-none focus:ring-2 focus:ring-primary" />
```

#### Color Contrast
- Text on backgrounds: Minimum 4.5:1 contrast ratio
- Large text (18pt+): Minimum 3:1 contrast ratio
- Use our tested color palette which meets AA standards

#### Semantic HTML
```typescript
// ❌ DON'T: Use divs for buttons
<div onClick={handleClick}>Click me</div>

// ✅ DO: Use semantic HTML
<button onClick={handleClick}>Click me</button>
<a href="/page">Link</a>
<nav>{navigation}</nav>
```

#### ARIA Labels
```typescript
// Icon-only buttons need labels
<Button aria-label="Close menu">
  <X className="w-4 h-4" />
</Button>

// Skip link for keyboard navigation
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### Responsive Design

#### Mobile-First Approach
```typescript
// Start with mobile, enhance upward
className="
  w-full
  sm:w-1/2      // tablets
  md:w-1/3      // desktop
  lg:w-1/4      // large screens
"

// Hide on mobile, show on desktop
className="hidden md:block"

// Show on mobile, hide on desktop
className="md:hidden"
```

#### Touch Targets
- Minimum 44x44px for touch targets
- Buttons should have `min-h-10` minimum
- Padding around clickable elements

#### Viewport Meta
```html
<!-- Already in layout.tsx -->
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

### Dark Mode Support

Our components support dark mode via Tailwind's `dark:` prefix:

```typescript
// Automatic in shadcn components
<div className="bg-white dark:bg-slate-950">
  Auto-adapts to dark mode
</div>

// Theme toggle available in sidebar footer
// Users can switch light/dark mode with ThemeToggle component
```

---

## Pre-Submission Checklist

Before submitting a PR, verify:

### Visual Design
- [ ] All colors use centralized constants from `lib/colors-config.ts`
- [ ] No hardcoded colors (no `#fff`, `rgb()`, `hsl()`)
- [ ] Badge variants are used for status (not inline span with colors)
- [ ] Spacing follows the Tailwind scale (`space-4`, `p-6`, etc.)
- [ ] Shadows use Card component or subtle shadow classes
- [ ] Borders have proper color with opacity (e.g., `border-red-500/20`)

### Animations
- [ ] All transitions use `ANIMATIONS.*` presets or `ANIMATION_DURATIONS.*`
- [ ] Duration is 200ms standard (100ms fast, 300ms slow)
- [ ] Easing function is appropriate for the interaction
- [ ] No `transition-all` with durations >300ms
- [ ] Respects `prefers-reduced-motion` system preference

### Components
- [ ] Using shadcn/ui components when available
- [ ] Custom components follow CVA pattern with Tailwind classes
- [ ] Props are documented if complex
- [ ] Memoization applied where needed (useMemo, useCallback)
- [ ] No inline styles (use Tailwind classes)

### Accessibility
- [ ] All buttons and links have proper labels
- [ ] Focus indicators are visible
- [ ] Form labels associated with inputs (`htmlFor`, `id`)
- [ ] Color not the only indicator (also use icons, text, patterns)
- [ ] Contrast ratio meets AA standard (4.5:1 normal text)
- [ ] Keyboard navigation works (tab, enter, escape)

### Performance
- [ ] No unnecessary re-renders
- [ ] Heavy components are lazy-loaded (`dynamic()`)
- [ ] Images are optimized (use Next.js Image)
- [ ] No console errors or warnings
- [ ] Build completes without errors

### Responsive Design
- [ ] Mobile view (375px) looks good
- [ ] Tablet view (768px) looks good
- [ ] Desktop view (1024px+) looks good
- [ ] No horizontal scrolling on mobile
- [ ] Touch targets are 44x44px minimum

### TypeScript
- [ ] No `any` types
- [ ] All props are properly typed
- [ ] Error handling is typed
- [ ] Union types for variants

### Documentation
- [ ] Comments for complex logic
- [ ] README or guide if new pattern
- [ ] Jsdoc for exported functions/components

---

## Quick Reference Commands

```bash
# Check build
npm run build

# Type check
npm run type-check

# Lint
npm run lint

# Development
npm run dev

# Visual development (Storybook-like, if available)
npm run storybook

# Format code
npm run format
```

---

## Common Patterns

### Loading Skeleton Pattern
```tsx
import { Skeleton } from "@/components/ui/skeleton"

function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-24 rounded" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-3/4 rounded-lg" />
      </CardContent>
    </Card>
  )
}
```

### Error Boundary Pattern
```tsx
import { AlertCircle } from "lucide-react"

function ErrorState({ error, onRetry }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="flex gap-3 pt-6">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-red-900">{error}</h3>
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
            Tentar novamente
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Status Badge Pattern
```tsx
import { Badge } from "@/components/ui/badge"
import { PRIORITY_COLORS } from "@/lib/colors-config"

function StatusBadge({ status }: { status: 'ALTA' | 'MEDIA' | 'BAIXA' }) {
  return <Badge className={PRIORITY_COLORS[status]}>{status}</Badge>
}
```

---

## Resources

- **Tailwind Docs:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **Next.js Docs:** https://nextjs.org/docs
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **Color Config:** `/lib/colors-config.ts`
- **Animation Config:** `/lib/animation-config.ts`

---

## Questions or Clarifications?

If you have questions about these standards:

1. Check existing components in `/components` for examples
2. Review `/lib/colors-config.ts` and `/lib/animation-config.ts`
3. Ask in team communication channels
4. Update this doc if you find unclear sections

---

**Remember:** Consistency > Perfection. When in doubt, match the pattern of similar components in the codebase.
