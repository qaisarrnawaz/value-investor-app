# Stock Research Application

## Overview

This is a full-stack stock research application built with React, Express, and TypeScript. The application allows users to search for stocks, view company details, and analyze financial data using the Polygon.io API. It features a modern UI built with shadcn/ui components and Recharts for data visualization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and data fetching
- Recharts for financial data visualization (charts and graphs)

**UI Framework:**
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Component architecture following the "New York" style variant
- CSS variables for theming support (light/dark modes)

**Design Decisions:**
- **Problem:** Need a consistent, accessible UI component library
- **Solution:** shadcn/ui provides unstyled, accessible components that can be customized
- **Rationale:** Better than pre-styled libraries as it allows full control over design while maintaining accessibility standards

### Backend Architecture

**Technology Stack:**
- Express.js as the web application framework
- Node.js with ESM module support
- TypeScript for type safety across the full stack
- tsx for development with hot reload capabilities

**API Design:**
- RESTful API endpoints under `/api` prefix
- Proxy pattern to Polygon.io API for stock data
- Environment-based configuration for API keys and database connections

**Storage Layer:**
- In-memory storage implementation (`MemStorage`) for user data
- Interface-based design (`IStorage`) allows easy swapping to database-backed storage
- Drizzle ORM configured for PostgreSQL (prepared for future database integration)

**Design Decisions:**
- **Problem:** Need to abstract third-party API complexity from frontend
- **Solution:** Backend acts as a proxy, handling API key management and request formatting
- **Pros:** Security (API keys not exposed to client), ability to add caching/rate limiting
- **Cons:** Additional latency from proxy layer

### Database Schema

**ORM Configuration:**
- Drizzle ORM with PostgreSQL dialect
- Type-safe schema definitions using drizzle-zod for validation
- Migration support via drizzle-kit

**Current Schema:**
- Users table with UUID primary keys, username, and password fields
- Username uniqueness constraint enforced at database level

**Design Decisions:**
- **Problem:** Need type-safe database operations with minimal boilerplate
- **Solution:** Drizzle ORM provides TypeScript-first API with automatic type inference
- **Alternative Considered:** Prisma (heavier, more opinionated)
- **Rationale:** Drizzle is lightweight, closer to SQL, and integrates well with edge runtimes

### External Dependencies

**Third-Party Services:**
- **Polygon.io API:** Stock market data provider
  - Used for: Company search, ticker details, financial data, and market aggregates
  - Authentication: API key via environment variable (`POLYGON_API_KEY`)
  - Endpoints: `/v3/reference/tickers` for search and details

**Database:**
- **Neon Serverless PostgreSQL:** Configured via `@neondatabase/serverless` driver
  - Connection string via `DATABASE_URL` environment variable
  - Serverless-optimized for edge deployments

**Development Tools:**
- **Replit Integration:** Custom Vite plugins for development experience
  - `@replit/vite-plugin-runtime-error-modal`: Error overlay in development
  - `@replit/vite-plugin-cartographer`: Code navigation
  - `@replit/vite-plugin-dev-banner`: Development environment indicator

**UI Component Libraries:**
- **Radix UI:** Headless component primitives (20+ components imported)
- **Recharts:** Chart library for financial data visualization
- **Lucide React:** Icon library
- **cmdk:** Command palette component
- **embla-carousel-react:** Carousel functionality

**Design Decisions:**
- **Problem:** Need reliable, real-time stock market data
- **Solution:** Polygon.io provides comprehensive financial data API
- **Rationale:** Industry-standard provider with good documentation and free tier for development

### Build and Deployment

**Development:**
- Concurrent frontend (Vite) and backend (tsx) processes
- Vite middleware mode integrates with Express for unified dev server
- Hot reload for both frontend and backend code

**Production:**
- Frontend: Vite builds to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js`
- Static file serving from Express in production
- Environment-aware configuration (NODE_ENV)

**Design Decisions:**
- **Problem:** Need efficient development experience and optimized production builds
- **Solution:** Vite for frontend (fast HMR), esbuild for backend (fast bundling)
- **Rationale:** Modern tooling optimized for TypeScript and ESM modules