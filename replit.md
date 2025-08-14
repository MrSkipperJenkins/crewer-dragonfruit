# Crewer - TV Production Management Platform

## Overview

Crewer is a comprehensive SaaS platform designed to streamline television production workflows. It manages crews, shows, and resources through an innovative 3-tier scheduling architecture that separates editorial concepts from scheduling blueprints and concrete calendar instances. The platform's core value proposition includes automated scheduling, resource optimization, production intelligence via analytics, and enterprise scalability with a multi-tenant architecture. It targets production managers, show producers, resource coordinators, crew members, and executives, aiming to transform manual scheduling into efficient, automated processes.

## User Preferences

- **Communication Style**: Simple, everyday language suitable for non-technical production staff
- **Technical Approach**: Focus on TV production industry workflows and terminology
- **UI/UX**: Professional, clean interface optimized for broadcast professionals
- **Performance**: Prioritize responsiveness and real-time collaboration
- **Accessibility**: Ensure compliance with WCAG guidelines for inclusive design

## System Architecture

Crewer employs a modern full-stack monolithic architecture with comprehensive user authentication and workspace management, clearly separating `client/` (React frontend), `server/` (Express.js backend), and `shared/` (shared types and schemas).

**Authentication & User Management:**
- **Independent User Accounts**: Users register with email/name and can exist independently of workspaces
- **Workspace Membership System**: Many-to-many relationship between users and workspaces with roles (owner, admin, member, viewer)
- **Invitation System**: Workspace owners can invite users via email with time-limited tokens
- **Role-Based Access Control**: Different permission levels for workspace operations

**Frontend Technologies:**
- **React 18**: With hooks and concurrent features
- **TypeScript**: For type safety
- **Vite**: Build tool and development server
- **Wouter**: Lightweight routing
- **TanStack Query v5**: Server state management and caching
- **React Hook Form**: Form handling with validation
- **Zod**: Runtime type validation
- **Shadcn/ui**: Accessible component library on Radix UI
- **Tailwind CSS**: Utility-first styling
- **FullCalendar**: Professional calendar components
- **Framer Motion**: Animations

**Backend Technologies:**
- **Express.js**: Fast, minimalist web framework
- **TypeScript**: End-to-end type safety
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL**: Robust relational database
- **Express Session**: Session management

**System Design Choices:**

- **Multi-Tenancy**: Achieved through workspace isolation, with all data scoped by a `workspace_id`. Users can belong to multiple workspaces with different roles and permissions.
- **User-Centric Design**: Authentication system allows users to create accounts independently and then create/join workspaces, supporting real SaaS workflows.
- **3-Tier Scheduling Architecture**:
    - **Tier 1: Productions**: High-level show concepts (editorial/creative containers without scheduling information).
    - **Tier 2: Show Templates**: Define how productions should be scheduled, including recurring patterns, duration, job requirements, and resource needs. These are blueprints for automated schedule generation.
    - **Tier 3: Scheduled Events**: Concrete calendar instances with specific dates/times, actual crew and resource assignments, and status tracking. These are generated from templates or created as one-off events.
- **Core Modules and Features**: 
  - **Authentication System**: User registration, login, and workspace discovery
  - **Workspace Management**: Creation, membership management, and invitations
  - **Production Management**: 3-tier scheduling architecture
  - **Crew Management**: Members, job roles, and assignments
  - **Resource Management**: Inventory and conflict detection
  - **Scheduling & Calendar System**: FullCalendar integration with real-time updates
  - **Notifications System**: User and workspace-level notifications

**UI/UX Decisions:**
The UI features a two-column layout, modal forms, sortable/filterable data tables, and multiple calendar views. It prioritizes real-time updates, an intuitive user experience, professional aesthetics, and responsiveness.

## External Dependencies

**Required Services:**
- **Neon Database**: Serverless PostgreSQL hosting for production data.

**Key Libraries & Frameworks (Actual Integrations):**
- `@neondatabase/serverless`: Serverless PostgreSQL database connection.
- `drizzle-orm` & `drizzle-zod`: Type-safe ORM and Zod schema generation.
- `express` & `express-session`: Backend web framework and session management.
- `zod`: Runtime type validation.
- `react`, `react-dom`, `@tanstack/react-query`, `wouter`, `react-hook-form`, `@hookform/resolvers`: Frontend core libraries.
- `@radix-ui/*`, `tailwindcss`, `tailwindcss-animate`, `lucide-react`, `framer-motion`, `next-themes`: UI and styling libraries.
- `@fullcalendar/*` (with various plugins), `date-fns`, `react-day-picker`, `rrule`: Calendar and date handling.