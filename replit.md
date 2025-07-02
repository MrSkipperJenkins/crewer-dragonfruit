# Crewer - Crew Management System

## Overview

Crewer is a full-stack web application for managing television production crews, shows, and resources. It's built as a multi-tenant SaaS platform that allows production companies to organize their crew schedules, manage show assignments, and track resource utilization.

## System Architecture

The application follows a monolithic full-stack architecture with the following structure:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Shadcn/ui components built on Radix UI
- **Styling**: Tailwind CSS
- **Development Environment**: Replit with Node.js 20

## Key Components

### Frontend Architecture

- **React 18** with TypeScript for type safety
- **Wouter** for client-side routing (lightweight React Router alternative)
- **TanStack Query** for server state management and caching
- **React Hook Form** with Zod validation for form handling
- **Shadcn/ui** component library for consistent design system
- **FullCalendar** for calendar views and scheduling interfaces

### Backend Architecture

- **Express.js** server with TypeScript
- **Drizzle ORM** for database operations and migrations
- **Neon Database** (PostgreSQL-compatible) for cloud hosting
- RESTful API design with JSON responses
- Custom middleware for logging and error handling

### Database Schema - NEW 3-TIER ARCHITECTURE (June 24, 2025)

The application now uses a revolutionary 3-tier scheduling architecture:

#### Tier 1: Productions (High-level containers)

- **Productions**: Show concepts like "Morning News Live" or "Weekly Sports Roundup"
- Contains: name, description, workspace association
- No time-specific information

#### Tier 2: Show Templates (Recurring blueprints)

- **Show Templates**: The "recipe" for how a production should be scheduled
- Contains: recurring patterns, duration, job requirements, resource needs
- Links to a Production but has no specific dates

#### Tier 3: Scheduled Events (Concrete calendar instances)

- **Scheduled Events**: Actual calendar items with specific dates and crew assignments
- Contains: specific start/end times, actual crew assignments, resource bookings
- Can be generated from templates OR created as one-off events

### Multi-Tenancy

- Workspace-based tenant isolation
- URL-based workspace routing (`/workspaces/{slug}`)
- Data scoping through workspace IDs in all queries

## Data Flow

1. **Authentication**: Simple workspace-based access (no complex auth system yet)
2. **Workspace Selection**: Users select/create workspaces on entry
3. **Data Scoping**: All queries are scoped to the current workspace
4. **Real-time Updates**: Using TanStack Query for optimistic updates and cache invalidation
5. **Form Handling**: React Hook Form → Zod validation → API calls → Cache updates

## External Dependencies

### Core Dependencies

- **@neondatabase/serverless**: PostgreSQL cloud database
- **drizzle-orm**: Type-safe ORM with automatic migrations
- **@tanstack/react-query**: Server state management
- **@hookform/resolvers**: Form validation integration
- **@radix-ui/\***: Accessible UI primitives
- **@fullcalendar/\***: Calendar components for scheduling
- **wouter**: Lightweight routing
- **tailwindcss**: Utility-first CSS framework

### Development Dependencies

- **vite**: Fast build tool and dev server
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production
- **jest**: Testing framework (configured but minimal tests)

## Deployment Strategy

### Development

- Runs on Replit with hot reloading
- PostgreSQL module auto-provisioned
- Port 5000 for development server
- Vite dev server with Express API proxy

### Production Build

```bash
npm run build  # Builds client and server
npm run start  # Runs production server
```

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (auto-provided by Replit)
- `NODE_ENV`: Environment flag (development/production)

### Replit Configuration

- **Modules**: nodejs-20, web, postgresql-16
- **Deployment**: Autoscale with build step
- **Port Mapping**: 5000 (local) → 80 (external)

## Recent Changes

### July 2, 2025 - Schema Refactoring and Cleanup

1. **Complete Schema Cleanup**: Removed all legacy tables and migration code from schema.ts
   - **Removed Legacy Tables**: shows, showCategoryAssignments, requiredJobs, showResources, crewAssignments, crewSchedules, crewTimeOff, notifications, earlyAccessSignups
   - **Streamlined Structure**: Organized remaining tables by functional groups (core, production, resources, assignments)
   - **Cleaned Relations**: Simplified relationship definitions for new 3-tier architecture
   - **Reduced Complexity**: Removed outdated migration helpers and unused types
   - **Current Status**: Schema now only contains the new 3-tier architecture tables

2. **Routes Cleanup**: Partially cleaned server/routes.ts file
   - **Updated Imports**: Removed references to deleted schema exports
   - **Legacy Routes**: Many legacy route handlers still present and causing errors
   - **Current Status**: Application runs but with many unused/broken routes that need removal

3. **Storage Layer**: Issues identified in storage.ts
   - **Missing Methods**: Many methods referenced in routes no longer exist in storage interface
   - **TypeScript Errors**: Multiple type errors due to missing properties and methods
   - **Current Status**: Core functionality works but legacy code causes compilation warnings

4. **New Productions UI**: Previously implemented two-column administrative interface
   - **Left Column**: Production list with card-based layout and click-to-select
   - **Right Column**: Production details with templates table
   - **Template Form**: Comprehensive modal with recurring patterns and requirements
   - **Requirements Management**: Dynamic job and resource requirements with tabs
   - **Real-time Statistics**: Template and event counts per production

### June 24, 2025 - Major Architecture Overhaul

1. **Landing Page & Onboarding**: Created comprehensive landing page with early access signup and 4-step onboarding flow
2. **3-Tier Scheduling Architecture**: Implemented new Productions → Show Templates → Scheduled Events structure
   - **Database Schema**: Added productions, showTemplates, scheduledEvents tables with supporting tables
   - **Migration System**: Auto-migration from legacy shows to new 3-tier structure
   - **API Layer**: Complete REST API for all new entities with CRUD operations
   - **Backward Compatibility**: Legacy shows API maintained during transition period
   - **Template Requirements**: Job and resource requirements at template level
   - **Event Assignments**: Concrete crew and resource assignments at event level
   - **Template Management**: Complete template creation, editing, and requirements management
   - **Template Requirements**: Job and resource requirements with quantity management
   - **Production Integration**: Templates linked to productions with filtering and navigation
   - **Template Actions**: Duplicate, edit, delete with comprehensive statistics
   - Separated abstract show concepts from concrete calendar instances
   - Added powerful recurring pattern support
   - Enabled flexible one-off event creation
   - Improved scheduling efficiency and clarity

## User Preferences

- **Communication Style**: Simple, everyday language
- **Technical Approach**: Focus on TV production industry needs
- **UI/UX**: Professional, clean interface suitable for broadcast professionals
