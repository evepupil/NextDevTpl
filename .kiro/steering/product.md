# Product Overview

NextDevTpl is a modern SaaS boilerplate built with Next.js 15, designed to help developers ship products faster.

## Core Features

- **Authentication**: Email/password and OAuth (GitHub, Google) via Better Auth
- **Credits System**: Enterprise-grade double-entry accounting with FIFO expiration
- **Payment Integration**: Stripe integration for subscriptions and one-time purchases
- **Support System**: Ticket-based customer support with admin panel
- **AI Integration**: OpenAI integration with streaming chat interface
- **Internationalization**: Multi-language support (English, Chinese)
- **Documentation**: Built-in docs system using Fumadocs
- **Blog**: MDX-based blog with multi-language support
- **Email**: Transactional emails via Resend with React Email templates
- **Storage**: S3-compatible file storage

## User Roles

- **User**: Standard user with access to dashboard, chat, credits, and support
- **Admin**: Full access including user management, ticket management, and analytics

## Architecture

- Feature-based organization with clear separation of concerns
- Server actions for data mutations
- Type-safe database queries with Drizzle ORM
- Responsive UI with Radix UI and Tailwind CSS
