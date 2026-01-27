# Project Structure

## Root Configuration

- `package.json`: Dependencies and scripts
- `tsconfig.json`: TypeScript configuration
- `biome.json`: Linter and formatter configuration
- `next.config.mjs`: Next.js configuration with MDX and i18n plugins
- `drizzle.config.ts`: Database migration configuration
- `tailwind.config.ts`: Tailwind CSS configuration

## Source Directory (`src/`)

### App Router (`src/app/`)

Next.js 15 App Router with route groups and internationalization:

```
src/app/
├── [locale]/                    # Internationalized routes
│   ├── (auth)/                  # Auth layout group
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/             # Dashboard layout group
│   │   └── dashboard/
│   │       ├── chat/
│   │       ├── credits/
│   │       ├── settings/
│   │       └── support/
│   ├── (marketing)/             # Marketing layout group
│   │   ├── blog/
│   │   ├── legal/
│   │   └── page.tsx (homepage)
│   ├── (admin)/                 # Admin layout group
│   │   └── admin/
│   │       ├── tickets/
│   │       └── users/
│   └── docs/                    # Documentation
├── api/                         # API routes
│   ├── ai/chat/                 # AI chat endpoint
│   ├── auth/[...all]/           # Better Auth handler
│   ├── jobs/credits/expire/     # Cron job for credit expiration
│   └── webhooks/stripe/         # Stripe webhook handler
└── globals.css                  # Global styles
```

### Features (`src/features/`)

Feature-based organization with components and logic:

- `admin/`: Admin panel components (sidebar, etc.)
- `ai/`: AI chat interface
- `analytics/`: Analytics system with Google Analytics integration
- `auth/`: Sign-in/sign-up forms
- `blog/`: Blog post components
- `credits/`: Credits system with double-entry accounting
- `dashboard/`: Dashboard UI components (sidebar, topbar, cards)
- `mail/`: Email system with templates and actions
- `marketing/`: Landing page components (hero, pricing, testimonials)
- `payment/`: Payment processing with Stripe integration
- `settings/`: User settings with actions and schemas
- `shared/`: Shared components and utilities (providers, UI components)
- `storage/`: File storage system with S3 integration
- `support/`: Support ticket system with actions and schemas

Each feature may contain:
- `components/`: React components
- `actions/`: Server actions
- `schemas/`: Zod validation schemas

### Core Systems

#### Database (`src/db/`)
- `schema.ts`: Drizzle ORM schema definitions
- `index.ts`: Database client export

#### Authentication (`src/lib/auth/`)
- `index.ts`: Better Auth configuration
- `server.ts`: Server-side auth utilities
- `client.ts`: Client-side auth hooks
- `api.ts`: API route auth utilities
- `edge.ts`: Edge runtime auth utilities
- `admin.ts`: Admin authorization checks

#### Credits System (`src/features/credits/`)
- `core.ts`: Double-entry accounting logic with FIFO
- `actions.ts`: Server actions for credit operations
- `config.ts`: Credit system configuration
- `components/`: Credit UI components

#### Payment (`src/features/payment/`)
- `stripe.ts`: Stripe client and utilities
- `actions.ts`: Payment server actions
- `types.ts`: Payment type definitions

#### Email (`src/features/mail/`)
- `client.ts`: Resend client
- `templates/`: React Email templates
- `actions.ts`: Email sending actions

#### Storage (`src/features/storage/`)
- `providers/s3.ts`: S3 storage implementation
- `actions.ts`: File upload/download actions
- `types.ts`: Storage type definitions

#### Analytics System (`src/features/analytics/`)
- `components/analytics.tsx`: Google Analytics integration with cookie consent
- Conditional rendering based on user cookie preferences
- Listens to localStorage changes for consent updates

#### Shared Components (`src/features/shared/`)
- `components/`: Reusable UI components (language switcher, mode toggle, etc.)
- `providers.tsx`: Global context providers (theme, UI framework)
- `icons/`: Shared icon components

### UI Components (`src/components/ui/`)

Radix UI components with Tailwind styling:
- Accordion, Avatar, Badge, Button, Card, Checkbox
- Dialog, Dropdown Menu, Form, Input, Label
- Navigation Menu, Pagination, Popover, Radio Group
- Select, Separator, Switch, Tabs, Textarea

### Configuration (`src/config/`)
- `site.ts`: Site metadata and SEO
- `nav.ts`: Navigation configuration
- `payment.ts`: Payment plans and pricing

### Content (`src/content/`)

MDX content for blog, docs, and legal pages:
- `blog/`: Blog posts (en, zh)
- `docs/`: Documentation pages
- `legal/`: Terms, privacy, cookie policy

#### Internationalization (`src/i18n/`)
- `routing.ts`: Route configuration for locales
- `request.ts`: Server-side i18n setup

## Conventions

### File Naming
- Components: PascalCase (e.g., `DashboardSidebar.tsx`)
- Utilities: kebab-case (e.g., `safe-action.ts`)
- Server actions: kebab-case in `actions/` folders
- Schemas: kebab-case in `schemas/` folders

### Import Aliases
- `@/`: Maps to `src/`
- Example: `import { db } from "@/db"`

### Code Style (Biome)
- 2-space indentation
- Double quotes for strings
- Semicolons required
- 80 character line width
- Trailing commas (ES5 style)
- Import type enforcement
- No unused imports/variables
- No explicit `any` types

### Component Patterns
- Server Components by default
- Client Components marked with `"use client"`
- Co-locate related files in feature folders
- Export components from `index.ts` barrel files

### Database Patterns
- All tables use text IDs (UUIDs)
- Timestamps: `createdAt`, `updatedAt`
- Soft deletes via status fields (not hard deletes)
- Foreign keys with cascade deletes
- Enums for fixed value sets

### Server Actions
- Use `next-safe-action` for type safety
- Define schemas with Zod
- Return structured results with success/error states
- Handle errors gracefully with user-friendly messages

### Internationalization
- All user-facing text in translation files (`messages/`)
- Use `useTranslations()` hook in components
- Route structure: `/[locale]/...`
- Default locale: `en`, supported: `en`, `zh`
