# Operations Hub - Design Guidelines

## Design Approach

**System**: Custom design system inspired by Linear's dark professional aesthetic with fintech precision, optimized for mobile-first financial data visualization.

**Philosophy**: Premium, calm, competent — every element should reinforce trust and operational clarity. The interface behaves as a "digital operations employee" with clear, actionable information hierarchy.

---

## Core Design Elements

### A. Color Palette

**Dark Mode Foundation** (Primary):
- Background Base: `222 47% 11%` (deep slate, immersive)
- Surface Cards: `215 25% 17%` (elevated panels)
- Surface Elevated: `215 20% 22%` (interactive elements)

**Accent & Data Visualization**:
- Primary Accent: `186 100% 50%` (turquoise/cyan - financial positive actions)
- Success/Money In: `142 76% 36%` (emerald green)
- Warning/Due Soon: `43 96% 56%` (amber)
- Alert/Overdue: `0 84% 60%` (coral red)
- Neutral Data: `217 33% 97%` (cool white for text)

**Semantic Hierarchy**:
- Primary Text: `0 0% 98%` (near white, high contrast)
- Secondary Text: `215 16% 65%` (muted slate)
- Tertiary/Labels: `215 14% 45%` (subdued labels)

### B. Typography

**Font Stack**:
- Primary: Inter (via Google Fonts CDN) - clean, professional, excellent at small sizes
- Monospace: JetBrains Mono (for financial figures, amounts)

**Type Scale**:
- Hero Numbers: `text-5xl md:text-6xl font-bold` (dashboard metrics)
- Section Headers: `text-2xl md:text-3xl font-semibold` 
- Card Titles: `text-lg font-medium`
- Body Text: `text-base` (16px)
- Labels/Meta: `text-sm` (14px)
- Financial Amounts: `font-mono font-semibold` (all currency displays)

### C. Layout System

**Spacing Primitives**: Tailwind units of `2, 4, 6, 8, 12, 16, 20, 24`
- Component padding: `p-4 md:p-6`
- Card spacing: `space-y-4` or `gap-4`
- Section margins: `mb-8 md:mb-12`
- Mobile gutters: `px-4`
- Desktop containers: `max-w-7xl mx-auto px-8`

**Grid System**:
- Mobile: Single column, stacked cards
- Tablet (md:): 2-column for metric tiles
- Desktop (lg:): 3-4 column dashboard grid

### D. Component Library

**Dashboard Metric Tiles**:
- Rounded corners: `rounded-2xl`
- Background: Surface card color with subtle border `border border-slate-700/50`
- Padding: `p-6`
- Icon size: `w-12 h-12` with circular background
- Number display: Large monospace font with color-coded indicators
- Progress bars: Height `h-2`, rounded `rounded-full`, animated width transitions

**Bills & Invoices Cards**:
- List items: `p-4 border-b border-slate-700/30`
- Due date badges: Small pill shapes `px-3 py-1 rounded-full text-xs`
- Status indicators: Color-coded dot `w-2 h-2 rounded-full` + text
- Amount alignment: Right-aligned monospace

**Charts & Graphs**:
- Background: Transparent or subtle surface
- Grid lines: `stroke-slate-700/30`
- Data lines: `stroke-width: 3`, smooth curves
- Tooltips: Dark surface with white text, `rounded-lg shadow-xl`

**Navigation (Bottom Mobile)**:
- Fixed bottom bar: `h-16` with safe area padding
- Icon size: `w-6 h-6`
- Active state: Accent color fill + label
- Inactive: Muted slate with 60% opacity

**Action Buttons**:
- Primary: Accent gradient background, white text, `rounded-xl px-6 py-3`
- Secondary: Border style with accent color, `border-2 rounded-xl`
- Icon buttons: `w-12 h-12 rounded-xl` with centered icon

**Forms & Inputs**:
- Input fields: Dark surface `bg-slate-800/50 border border-slate-700`
- Focus state: Accent color border `focus:border-[hsl(186,100%,50%)]`
- Labels: Small caps or medium weight, `text-sm text-slate-400`
- Rounded: `rounded-lg`

**Status Indicators**:
- System health: Small badge `px-3 py-1 rounded-full` with dot indicator
- Colors: Green (operational), Yellow (warning), Red (error)
- Position: Top right of dashboard or header

### E. Animations

**Minimal & Purposeful**:
- Progress bar fills: `transition-all duration-500 ease-out`
- Card hover: Subtle lift `hover:translate-y-[-2px] transition-transform`
- Number changes: CountUp animation for metric updates (library)
- Chart renders: Fade in on load, `animate-fadeIn`
- Loading states: Skeleton screens with pulse, not spinners

---

## Mobile-First Implementation

**Critical Mobile Patterns**:
- Bottom navigation (Home, Finances, Workflows, Reports) with icons + labels
- Swipeable metric cards for horizontal scrolling on narrow viewports
- Collapsible sections with chevron indicators
- Pull-to-refresh for dashboard updates
- Sticky header with contextual title + system status

**Desktop Enhancements**:
- Side navigation (replaces bottom bar)
- Multi-column dashboard grid (2-4 columns)
- Hover states and tooltips
- Expanded chart views with more data points
- Keyboard shortcuts overlay (press `?`)

---

## Brand Integration

**Operations Hub Identity**:
- Subtle "OPS HUB" or "Kusler Consulting" wordmark in header (small, uppercase, spaced letters)
- Loading screen: Animated logo or brand mark on dark background
- Email template: Matches dashboard dark theme with white text blocks

**Trust Elements**:
- "All systems running" indicator always visible
- Last sync timestamp on data tiles
- Secure connection badge in footer
- Professional color choices (avoid playful/bright colors)

---

## Data Visualization Principles

**Financial Clarity**:
- Always show currency symbol and proper formatting ($12,345.67)
- Use color semantics: Green (positive/income), Red (negative/expense), Amber (warning)
- Percentage changes with up/down arrows
- Comparison metrics: "vs last month" in muted text below main number

**Chart Guidelines**:
- Line charts for trends (cash flow, profit over time)
- Bar charts for comparisons (monthly breakdown)
- Simple, clean axes with minimal grid lines
- Data point highlights on hover/tap
- Legend only when necessary (use inline labels)

---

## Responsive Behavior

**Breakpoints**:
- Mobile: `< 768px` (base styles)
- Tablet: `md: 768px+`
- Desktop: `lg: 1024px+`
- Wide: `xl: 1280px+`

**Component Adaptation**:
- Metric tiles: Stack on mobile, 2-col on tablet, 3-4 col on desktop
- Charts: Full width on mobile, constrained with sidebar on desktop
- Tables: Horizontal scroll on mobile, full table on desktop
- Forms: Single column on mobile, 2-column on desktop