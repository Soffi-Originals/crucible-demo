# Crucible

> Where agents are forged.

A standalone B2B-style workspace app for early Soffi users to evaluate AI
agents — review production runs, inspect simulations, manage tool connectors,
and gate deploys behind eval packs.

Designed to be edited inside Soffi's iframe + style editor: every visual value
is a semantic token, every primitive uses CVA variants, and everything is laid
out in flexboxes so blocks can be rearranged from the Soffi canvas.

## Stack

- **Vite + React 19 + TypeScript** — fast dev loop, strict types
- **Tailwind CSS v4** — CSS-variable-first, semantic tokens via `@theme`
- **class-variance-authority (CVA)** — typed variant API on every primitive
- **Storybook 10** — stories for every primitive and composed view
- **lucide-react** — icon set

## Scripts

```bash
pnpm dev              # Vite dev server (port 5173)
pnpm build            # type-check + production bundle
pnpm preview          # serve the production bundle locally
pnpm storybook        # Storybook on port 6006
pnpm build-storybook  # static Storybook for review
```

## Semantic tokens

Every visual value — color, border, type scale, radius, shadow — is a CSS
custom property declared in [`src/index.css`](src/index.css) and exposed to
Tailwind via `@theme`. Editing a single value retheme the whole app.

```css
/* src/index.css */
@theme {
  --color-canvas: #f7f7f5;
  --color-surface: #ffffff;
  --color-fg: #18181b;
  --color-accent: #2563eb;
  --radius-md: 8px;
  /* ... */
}

.dark {
  --color-canvas: #0a0a0a;
  --color-surface: #141414;
  --color-fg: #fafafa;
  /* ... */
}
```

Token groups:

| Group | Example tokens |
|---|---|
| Surfaces | `--color-canvas`, `--color-surface`, `--color-surface-subtle`, `--color-surface-muted` |
| Foreground | `--color-fg`, `--color-fg-muted`, `--color-fg-subtle`, `--color-fg-inverse` |
| Borders | `--color-border`, `--color-border-strong`, `--color-border-subtle`, `--color-border-focus` |
| Brand | `--color-primary`, `--color-accent`, `--color-accent-soft` |
| Status | `--color-success`, `--color-warning`, `--color-danger`, `--color-info` (each with `-soft` and `-fg` variants) |
| Typography | `--font-sans`, `--font-mono`, `--text-xs` … `--text-4xl` |
| Radius | `--radius-xs` … `--radius-2xl`, `--radius-full` |
| Shadow | `--shadow-xs` … `--shadow-lg`, `--shadow-focus` |

Components reference tokens via arbitrary-value Tailwind syntax:
`bg-(--color-surface)`, `text-(--color-fg-muted)`, `rounded-(--radius-md)`.
The Tailwind `@theme` block also makes them available as classes like
`bg-canvas`, `text-fg`, etc.

## Theme switching (class-driven)

The dark theme is a class override, not a media query. Adding `dark` to
`<body>` (or any ancestor) flips every token in one step:

```tsx
document.body.classList.add('dark')  // → dark theme
document.body.classList.remove('dark') // → light theme
```

The bundled [`useTheme()`](src/lib/theme.ts) hook persists the choice in
`localStorage` and respects the user's OS preference on first load. The header
in [`App.tsx`](src/App.tsx) exposes a toggle.

## CVA variant pattern (Soffi-compatible)

Every primitive and composed view follows the same three rules so Soffi's AST
inspector and React-fiber walker can discover, edit, and live-preview them.

### 1. Typed props (CVA or TS union)

```tsx
// src/components/ui/Button.tsx
export const buttonVariants = cva('inline-flex items-center …', {
  variants: {
    variant: {
      primary: 'bg-(--color-primary) text-(--color-primary-fg) …',
      secondary: 'bg-(--color-surface) border …',
      outline: '…',
      ghost: '…',
      accent: '…',
      danger: '…',
    },
    size: { sm: '…', md: '…', lg: '…' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
})

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  leadingIcon?: React.ReactNode
}
```

Soffi's AST inspector reads the `cva()` config and the `VariantProps<…>`
union to populate the variant dropdowns.

### 2. Named component (React fiber–discoverable)

Components are declared with `React.forwardRef(function Name(…) { … })` so
the React fiber tree carries the component name, source file, and line —
which Soffi uses to map a clicked DOM node back to the source.

### 3. Stories for every component

Every primitive (`src/components/ui/*`) and composed view
(`src/components/views/*`) has a matching `*.stories.tsx`. Stories drive both
Storybook and (optionally) Soffi's design system panel via the
`web/lib/storybook/manifest.ts` mapping.

## Component inventory

### Primitives — `src/components/ui/`

| Component | Variants exposed |
|---|---|
| [`Button`](src/components/ui/Button.tsx) | `variant`, `size`, `fullWidth` |
| [`Card`](src/components/ui/Card.tsx) | `variant`, `padding`, `radius`, `interactive` |
| [`CardSection`](src/components/ui/Card.tsx) | `align`, `gap`, `padding`, `border` |
| [`Badge`](src/components/ui/Badge.tsx) | `variant`, `size`, `shape` |
| [`Input`](src/components/ui/Input.tsx) | `variant`, `size`, `state` |
| [`Avatar`](src/components/ui/Avatar.tsx) | `variant`, `size`, `shape` |
| [`StatusDot`](src/components/ui/StatusDot.tsx) | `status`, `size`, `ring` |
| [`IconButton`](src/components/ui/IconButton.tsx) | `variant`, `size` |
| [`Heading`](src/components/ui/Heading.tsx) | `as`, `size`, `weight`, `tone` |
| [`Text`](src/components/ui/Text.tsx) | `size`, `weight`, `tone`, `family`, `truncate` |
| [`Kbd`](src/components/ui/Kbd.tsx) | `size`, `tone` |
| [`Divider`](src/components/ui/Divider.tsx) | `orientation`, `tone`, `spacing` |
| [`ProgressBar`](src/components/ui/ProgressBar.tsx) | `size`, `tone` |
| [`Skeleton`](src/components/ui/Skeleton.tsx) | `shape` |
| [`Toggle`](src/components/ui/Toggle.tsx) | `size`, `tone` |

### Composed views — `src/components/views/`

| Component | Used in |
|---|---|
| [`AgentRow`](src/components/views/AgentRow.tsx) | Agents page picker |
| [`SimulationStep`](src/components/views/SimulationStep.tsx) | Simulation timeline |
| [`SimulationConversation`](src/components/views/SimulationConversation.tsx) | Simulation detail view |
| [`ConnectorCard`](src/components/views/ConnectorCard.tsx) | Connectors page |
| [`MetricTile`](src/components/views/MetricTile.tsx) | Overview KPIs |
| [`EvalScoreCard`](src/components/views/EvalScoreCard.tsx) | Overview + Evals page |
| [`RunRow`](src/components/views/RunRow.tsx) | Recent runs table |
| [`SidebarNavItem`](src/components/views/SidebarNavItem.tsx) | Left navigation |
| [`PlanCard`](src/components/views/PlanCard.tsx) | Plans page |
| [`AppShell`](src/components/views/AppShell.tsx) | Top-level layout |
| [`Sidebar`](src/components/views/Sidebar.tsx) | App nav |
| [`Header`](src/components/views/Header.tsx) | App header |

## File structure

```
src/
├── App.tsx                       # router-less page switcher
├── main.tsx                      # React entry
├── index.css                     # Tailwind + semantic tokens
├── lib/
│   ├── cn.ts                     # clsx + tailwind-merge
│   └── theme.ts                  # useTheme hook (class-driven)
├── components/
│   ├── ui/                       # CVA primitives + stories
│   └── views/                    # composed views + stories
├── pages/
│   ├── OverviewPage.tsx
│   ├── AgentsPage.tsx
│   ├── SimulationsPage.tsx
│   ├── EvalsPage.tsx
│   ├── ConnectorsPage.tsx
│   └── PlansPage.tsx
└── data/
    └── demo.ts                   # static sample data
```

## Adding a new component

1. Create `src/components/ui/Foo.tsx` (or `views/Foo.tsx`).
2. Export a `cva()` config and a `forwardRef` component named `Foo`.
3. Re-export from the matching `index.ts`.
4. Create `Foo.stories.tsx` with a `default` export and one story per
   notable variant.
5. (Optional) Soffi's design system panel will pick up the story
   automatically if a workspace storybook is built.

## Layout convention

Every container uses flexbox (or grid for tabular layouts) so individual
blocks can be rearranged from Soffi's canvas without breaking surrounding
alignment. No fixed-position absolute layouts outside of overlay primitives.
