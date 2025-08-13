# Crewer - TV Production Management Platform

## Overview
Crewer is a comprehensive SaaS platform for television production companies, designed to manage crews, shows, and resources. It streamlines TV production workflows using an innovative 3-tier scheduling architecture that separates editorial concepts from scheduling blueprints and concrete calendar instances. Its core value proposition includes automated scheduling, resource optimization, production intelligence through analytics, and enterprise scalability via a multi-tenant architecture. The platform aims to transform manual scheduling into efficient automated workflows, prevent conflicts, optimize resource utilization, and provide insights for improved production efficiency and cost management.

## User Preferences
- **Communication Style**: Simple, everyday language suitable for non-technical production staff
- **Technical Approach**: Focus on TV production industry workflows and terminology
- **UI/UX**: Professional, clean interface optimized for broadcast professionals
- **Performance**: Prioritize responsiveness and real-time collaboration
- **Accessibility**: Ensure compliance with WCAG guidelines for inclusive design

## System Architecture
Crewer utilizes a modern full-stack monolithic architecture with a clear separation of concerns, optimized for productivity and scalability.

**Frontend:**
The frontend is built with React 18, TypeScript, Vite, Wouter for routing, TanStack Query for server state management, React Hook Form for forms, Zod for validation, Shadcn/ui for accessible components, Tailwind CSS for styling, FullCalendar for scheduling, and Framer Motion for animations. Key UI patterns include two-column layouts, modal forms, sortable data tables, and multiple calendar views with real-time updates.

**Backend:**
The backend is powered by Express.js, TypeScript, Drizzle ORM, and PostgreSQL hosted on Neon Database. It provides RESTful API endpoints with Zod validation.

**Multi-Tenancy:**
The system ensures complete isolation between production companies through workspace IDs, reflected in URL structures and database foreign key constraints. Users can belong to multiple workspaces.

**3-Tier Scheduling Architecture:**
- **Tier 1: Productions:** High-level show concepts (e.g., "Morning News") acting as editorial/creative containers without scheduling information.
- **Tier 2: Show Templates:** Define how productions should be scheduled, including recurring patterns (RRule), duration, job requirements, and resource needs. Templates can generate multiple scheduled events.
- **Tier 3: Scheduled Events:** Concrete calendar instances with specific dates, times, and actual crew/resource assignments. These can be generated from templates or created as one-off events and track status.

This architecture ensures separation of concerns, enables powerful automation for generating episodes and managing resources, supports flexible scheduling for both recurring and one-off events, and improves workflow efficiency by defining requirements once.

## External Dependencies

**Core Technologies:**
- **Database:** PostgreSQL (with Neon Database for hosting), Drizzle ORM
- **Backend Framework:** Express.js
- **Frontend Framework:** React
- **State Management:** TanStack Query
- **Routing:** Wouter
- **Form Management:** React Hook Form
- **Validation:** Zod
- **UI Components:** Shadcn/ui (built on Radix UI)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Calendar:** FullCalendar (with React, DayGrid, TimeGrid, Interaction, Resource TimeGrid plugins)
- **Date Utilities:** date-fns
- **Recurring Events:** rrule

**Development Tools:**
- TypeScript
- Vite
- tsx
- esbuild
- Drizzle Kit
- Jest (for testing)

**Required External Services:**
- **Neon Database**: For serverless PostgreSQL hosting, providing automatic backups, scaling, connection pooling, and edge locations.

**Optional Integrations (Prepared):**
- **Authentication Providers**: OAuth integration via Passport.js
- **Email Service**: For notifications
- **File Storage**: For asset management
- **Analytics**: For user behavior and application performance tracking