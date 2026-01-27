# Tech Stack

## Core Framework

- **Next.js 16.1.4**: App Router with React Server Components
- **React 19.2.3**: Latest React with server components
- **TypeScript 5**: Full type safety across the codebase

## Database & ORM

- **PostgreSQL**: Primary database (via Neon serverless)
- **Drizzle ORM 0.45.1**: Type-safe database queries
- **Drizzle Kit**: Database migrations and schema management

## Authentication

- **Better Auth 1.4.17**: Modern authentication library
- Supports email/password and OAuth (GitHub, Google)
- Session-based authentication with cookie storage

## UI & Styling

- **Tailwind CSS 4**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **next-themes**: Dark mode support
- **Recharts**: Data visualization

## AI Integration

- **Vercel AI SDK**: Streaming AI responses
- **OpenAI**: GPT models integration

## Payment

- **Stripe**: Payment processing and subscriptions

## Email

- **Resend**: Email delivery service
- **React Email**: Email templates with React components

## Storage

- **AWS S3**: File storage with presigned URLs

## Internationalization

- **next-intl 4.7.0**: Multi-language support (en, zh)

## Documentation

- **Fumadocs**: Documentation site builder with MDX support

## Code Quality

- **Biome 2.3.11**: Fast linter and formatter (replaces ESLint + Prettier)
- **TypeScript**: Strict type checking

## Form Handling

- **React Hook Form 7.71.1**: Form state management
- **Zod 4.3.6**: Schema validation
- **@hookform/resolvers**: Zod integration

## Server Actions

- **next-safe-action 8.0.11**: Type-safe server actions

## Common Commands

### Development
```bash
pnpm dev              # Start dev server with Turbopack
pnpm build            # Build for production
pnpm start            # Start production server
```

### Code Quality
```bash
pnpm lint             # Lint code with Biome
pnpm format           # Format code with Biome
pnpm check            # Lint and format in one command
pnpm typecheck        # Type check with TypeScript
```

### Database
```bash
pnpm db:generate      # Generate migrations from schema
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema directly (dev only)
pnpm db:studio        # Open Drizzle Studio
```

## Environment Variables

Required environment variables (see `.env.example`):
- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_URL`: Base URL for auth callbacks
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`: GitHub OAuth
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth
- `OPENAI_API_KEY`: OpenAI API key
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`: Stripe integration
- `RESEND_API_KEY`: Email service
- `AWS_*`: S3 storage credentials
