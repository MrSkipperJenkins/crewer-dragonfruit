# Crewer - Complete System Documentation
*TV Production Management SaaS Platform*

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Database Schema](#database-schema)
4. [Authentication & Authorization](#authentication--authorization)
5. [Core Modules](#core-modules)
6. [API Endpoints](#api-endpoints)
7. [User Interface Components](#user-interface-components)
8. [Workflow Documentation](#workflow-documentation)
9. [Implementation Guide](#implementation-guide)

---

## System Overview

Crewer is a comprehensive SaaS platform designed to streamline television production workflows through an innovative **3-tier scheduling architecture**:

- **Tier 1: Productions** - High-level show concepts (editorial/creative containers)
- **Tier 2: Show Templates** - Scheduling blueprints with recurring patterns and requirements
- **Tier 3: Scheduled Events** - Concrete calendar instances with actual assignments

### Core Value Propositions
- **Automated Scheduling**: Transform manual scheduling into efficient, automated processes
- **Resource Optimization**: Intelligent crew and equipment allocation with conflict detection
- **Production Intelligence**: Analytics and insights for production optimization
- **Enterprise Scalability**: Multi-tenant architecture supporting multiple production companies

### Target Users
- **Production Managers**: Overall production oversight and resource planning
- **Show Producers**: Content-specific scheduling and crew coordination
- **Resource Coordinators**: Equipment and facility management
- **Crew Members**: Personal schedule access and assignment tracking
- **Executives**: High-level analytics and production insights

---

## Architecture & Technology Stack

### System Architecture
**Full-stack monolithic architecture** with clear separation:
- `client/` - React frontend with TypeScript
- `server/` - Express.js backend with TypeScript
- `shared/` - Shared types and database schemas
- Multi-tenant design with workspace isolation

### Frontend Technologies
```typescript
// Core Framework
"react": "^18.x"
"typescript": "^5.x"
"vite": "^5.x" // Build tool and dev server

// Routing & State Management
"wouter": "^3.x" // Lightweight routing
"@tanstack/react-query": "^5.x" // Server state management

// Forms & Validation
"react-hook-form": "^7.x"
"@hookform/resolvers": "^3.x"
"zod": "^3.x" // Runtime type validation

// UI Components & Styling
"@radix-ui/react-*": "^1.x" // Accessible component primitives
"tailwindcss": "^3.x" // Utility-first CSS
"tailwindcss-animate": "^1.x" // Animation utilities
"lucide-react": "^0.x" // Icon library
"framer-motion": "^11.x" // Animations

// Calendar & Date Handling
"@fullcalendar/react": "^6.x" // Professional calendar components
"@fullcalendar/core": "^6.x"
"@fullcalendar/daygrid": "^6.x"
"@fullcalendar/timegrid": "^6.x"
"@fullcalendar/interaction": "^6.x"
"date-fns": "^3.x" // Date manipulation
"react-day-picker": "^8.x" // Date picker component
"rrule": "^2.x" // Recurring rule generation

// Theme & Dark Mode
"next-themes": "^0.x" // Theme switching
```

### Backend Technologies
```typescript
// Core Framework
"express": "^4.x"
"typescript": "^5.x"
"tsx": "^4.x" // TypeScript execution

// Database & ORM
"@neondatabase/serverless": "^0.x" // Serverless PostgreSQL
"drizzle-orm": "^0.x" // Type-safe ORM
"drizzle-zod": "^0.x" // Zod schema generation
"drizzle-kit": "^0.x" // Database toolkit

// Session & Authentication
"express-session": "^1.x" // Session management
"connect-pg-simple": "^9.x" // PostgreSQL session store
"passport": "^0.x" // Authentication middleware
"openid-client": "^5.x" // OpenID Connect support

// Utilities
"zod": "^3.x" // Runtime validation
"memoizee": "^1.x" // Function memoization
```

### Development Tools
```typescript
// Testing
"jest": "^29.x"
"@types/jest": "^29.x"
"supertest": "^6.x" // API testing
"ts-jest": "^29.x"

// Build & Development
"@vitejs/plugin-react": "^4.x"
"@replit/vite-plugin-cartographer": "^1.x"
"@replit/vite-plugin-runtime-error-modal": "^1.x"
"autoprefixer": "^10.x"
"postcss": "^8.x"
```

---

## Database Schema

### Core System Tables

#### Users & Authentication
```sql
-- Independent user accounts
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  avatar VARCHAR,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Session storage (required for authentication)
CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX idx_session_expire ON sessions(expire);
```

#### Workspace Management
```sql
-- Multi-tenant workspaces
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  slug VARCHAR NOT NULL UNIQUE,
  description TEXT,
  settings JSONB DEFAULT '{}',
  last_accessed TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Many-to-many user-workspace relationships with roles
CREATE TABLE workspace_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role VARCHAR NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
  status VARCHAR NOT NULL DEFAULT 'active', -- active, inactive, pending
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, workspace_id)
);

-- Time-limited workspace invitations
CREATE TABLE workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email VARCHAR NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL DEFAULT 'pending', -- pending, accepted, declined, expired
  token VARCHAR NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User notifications system
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR NOT NULL DEFAULT 'info', -- info, warning, error, success
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Production Management Tables

#### 3-Tier Scheduling System
```sql
-- Tier 1: Productions (High-level show concepts)
CREATE TABLE productions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  color VARCHAR DEFAULT '#3b82f6',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tier 2: Show Templates (Scheduling blueprints)
CREATE TABLE show_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 60, -- minutes
  recurring_pattern TEXT DEFAULT '', -- RRULE string for automation
  notes TEXT,
  color VARCHAR DEFAULT '#3b82f6',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tier 3: Scheduled Events (Concrete calendar instances)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  production_id UUID REFERENCES productions(id) ON DELETE CASCADE,
  template_id UUID REFERENCES show_templates(id) ON DELETE SET NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  notes TEXT,
  color VARCHAR DEFAULT '#3b82f6',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Resource Management
```sql
-- Job definitions and roles
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  department VARCHAR,
  pay_rate INTEGER, -- cents per hour
  requirements TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Equipment and facility resources
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL, -- equipment, vehicle, location, etc.
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  cost_per_hour INTEGER, -- cents
  availability TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crew member profiles with optional user account linking
CREATE TABLE crew_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Optional link to user account
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  primary_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  skills TEXT[],
  hourly_rate INTEGER, -- cents
  availability JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_crew_members_user_id ON crew_members(user_id);
CREATE INDEX idx_crew_members_email ON crew_members(email);
```

#### Template Requirements & Assignments
```sql
-- Template job requirements (blueprints)
CREATE TABLE template_required_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES show_templates(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_essential BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Template resource requirements (blueprints)
CREATE TABLE template_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES show_templates(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Actual crew assignments for scheduled events
CREATE TABLE event_crew_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  crew_member_id UUID NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  confirmed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Actual resource assignments for scheduled events
CREATE TABLE event_resource_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Database Relations (Drizzle ORM)
```typescript
// shared/schema.ts
import { relations } from "drizzle-orm";

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(workspaceMemberships),
  crewMemberProfiles: many(crewMembers),
  notifications: many(notifications),
}));

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  memberships: many(workspaceMemberships),
  productions: many(productions),
  jobs: many(jobs),
  resources: many(resources),
  crewMembers: many(crewMembers),
  events: many(events),
}));

export const crewMembersRelations = relations(crewMembers, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [crewMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [crewMembers.userId],
    references: [users.id],
  }),
  primaryJob: one(jobs, {
    fields: [crewMembers.primaryJobId],
    references: [jobs.id],
  }),
  eventAssignments: many(eventCrewAssignments),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [events.workspaceId],
    references: [workspaces.id],
  }),
  production: one(productions, {
    fields: [events.productionId],
    references: [productions.id],
  }),
  template: one(showTemplates, {
    fields: [events.templateId],
    references: [showTemplates.id],
  }),
  crewAssignments: many(eventCrewAssignments),
  resourceAssignments: many(eventResourceAssignments),
}));
```

---

## Authentication & Authorization

### Authentication Flow
1. **OpenID Connect Integration**: Uses Replit's OAuth provider for secure authentication
2. **Session Management**: PostgreSQL-backed session storage with automatic cleanup
3. **Multi-Domain Support**: Handles multiple deployment domains automatically
4. **Token Refresh**: Automatic token refresh for long-lived sessions

### Authorization Layers
1. **Application Level**: User authentication required for all protected routes
2. **Workspace Level**: Role-based access control (owner, admin, member, viewer)
3. **Resource Level**: Workspace-scoped data access with proper isolation
4. **Personal Access**: Crew members can access their own schedules when linked

### Role Permissions Matrix
```typescript
const ROLE_PERMISSIONS = {
  owner: ['*'], // All permissions
  admin: [
    'workspace.manage',
    'production.create', 'production.update', 'production.delete',
    'crew.create', 'crew.update', 'crew.delete',
    'schedule.create', 'schedule.update', 'schedule.delete',
  ],
  member: [
    'production.view', 'production.create',
    'crew.view', 'crew.create',
    'schedule.view', 'schedule.create',
  ],
  viewer: [
    'production.view',
    'crew.view',
    'schedule.view',
  ]
};
```

### User-Crew Member Association
- **Independent Accounts**: Users can exist without crew member profiles
- **Optional Linking**: Users can claim existing crew member profiles via email matching
- **Personal Schedules**: Linked crew members see personalized schedule views
- **Multi-Workspace**: Users can have different crew profiles in different workspaces

---

## Core Modules

### 1. Workspace Management
**Purpose**: Multi-tenant workspace system for production companies

**Key Features**:
- Workspace creation with unique slugs
- Member invitation system with time-limited tokens
- Role-based access control with four permission levels
- Workspace settings and customization

**Core Workflows**:
1. User creates workspace → Becomes owner
2. Owner invites team members via email
3. Invitees receive time-limited invitation tokens
4. New members join with appropriate roles
5. Workspace collaboration with proper permissions

### 2. Production Management (3-Tier System)
**Purpose**: Hierarchical content and scheduling organization

#### Tier 1: Productions
- High-level show concepts (e.g., "Morning News", "Evening Magazine")
- Editorial and creative containers without scheduling information
- Color-coded organization for visual management

#### Tier 2: Show Templates
- Scheduling blueprints that define how productions should be scheduled
- Recurring patterns using RRULE (RFC 5545) for automation
- Job and resource requirements specification
- Duration and timing preferences

#### Tier 3: Scheduled Events
- Concrete calendar instances with specific dates and times
- Actual crew and resource assignments
- Status tracking (scheduled, in_progress, completed, cancelled)
- Generated from templates or created as one-off events

### 3. Crew Management
**Purpose**: Comprehensive crew member lifecycle management

**Key Features**:
- Detailed crew member profiles with skills and availability
- Job role definitions with pay rates and requirements
- User account linking for personalized access
- Assignment tracking and confirmation workflow

**User Association Workflow**:
1. Production manager creates crew member profiles
2. Crew members register user accounts independently
3. Users search for and claim profiles using email matching
4. Linked users access personal schedules and assignments
5. Confirmation workflow for assignment acceptance

### 4. Resource Management
**Purpose**: Equipment, facility, and asset tracking

**Key Features**:
- Resource categorization (equipment, vehicle, location)
- Quantity tracking and availability management
- Cost tracking and hourly rate management
- Conflict detection and double-booking prevention

### 5. Scheduling & Calendar System
**Purpose**: Professional-grade scheduling with FullCalendar integration

**Key Features**:
- Multiple calendar views (month, week, day, list)
- Drag-and-drop scheduling interface
- Real-time conflict detection
- Template-based event generation
- Crew and resource assignment workflow

### 6. Notifications System
**Purpose**: Real-time communication and status updates

**Key Features**:
- User and workspace-level notifications
- Assignment confirmations and updates
- Schedule change alerts
- System-wide announcements

---

## API Endpoints

### Authentication Endpoints
```typescript
// Authentication flow (handled by middleware)
GET  /api/login          // Initiate OpenID Connect flow
GET  /api/callback       // OAuth callback handler
GET  /api/logout         // Clear session and redirect
GET  /api/auth/user      // Get current user (protected)
```

### User Management
```typescript
GET    /api/users/:id                    // Get user by ID
PUT    /api/users/:id                    // Update user profile
DELETE /api/users/:id                    // Delete user account
GET    /api/users/:id/workspaces         // Get user's workspaces with roles
GET    /api/users/:id/crew-members       // Get user's crew member profiles
```

### Workspace Management
```typescript
GET    /api/workspaces                   // Get all workspaces (admin)
GET    /api/workspaces/:id               // Get workspace details
POST   /api/workspaces                   // Create new workspace
PUT    /api/workspaces/:id               // Update workspace
DELETE /api/workspaces/:id               // Delete workspace

// Membership Management
GET    /api/workspaces/:id/members       // Get workspace members
POST   /api/workspaces/:id/members       // Add member to workspace
PUT    /api/workspaces/:id/members/:uid  // Update member role
DELETE /api/workspaces/:id/members/:uid  // Remove member

// Invitation Management
GET    /api/workspaces/:id/invitations   // Get pending invitations
POST   /api/workspaces/:id/invite        // Send invitation
GET    /api/invitations/:token           // Get invitation details
POST   /api/invitations/:token/accept    // Accept invitation
POST   /api/invitations/:token/decline   // Decline invitation
```

### Production Management (3-Tier System)
```typescript
// Tier 1: Productions
GET    /api/workspaces/:id/productions   // Get workspace productions
GET    /api/productions/:id              // Get production details
POST   /api/productions                  // Create production
PUT    /api/productions/:id              // Update production
DELETE /api/productions/:id              // Delete production

// Tier 2: Show Templates
GET    /api/workspaces/:id/templates     // Get workspace templates
GET    /api/templates/:id                // Get template details
POST   /api/templates                    // Create template
PUT    /api/templates/:id                // Update template
DELETE /api/templates/:id                // Delete template

// Template Requirements
GET    /api/templates/:id/jobs           // Get required jobs
POST   /api/templates/:id/jobs           // Add job requirement
DELETE /api/template-jobs/:id            // Remove job requirement
GET    /api/templates/:id/resources      // Get required resources
POST   /api/templates/:id/resources      // Add resource requirement
DELETE /api/template-resources/:id       // Remove resource requirement

// Tier 3: Scheduled Events
GET    /api/workspaces/:id/events        // Get workspace events
GET    /api/events/:id                   // Get event details
POST   /api/events                       // Create event
PUT    /api/events/:id                   // Update event
DELETE /api/events/:id                   // Delete event

// Event Assignments
GET    /api/events/:id/crew              // Get crew assignments
POST   /api/events/:id/crew              // Assign crew member
DELETE /api/event-crew-assignments/:id   // Remove crew assignment
GET    /api/events/:id/resources         // Get resource assignments
POST   /api/events/:id/resources         // Assign resource
DELETE /api/event-resource-assignments/:id // Remove resource assignment
```

### Crew Management
```typescript
GET    /api/workspaces/:id/crew-members  // Get workspace crew
GET    /api/crew-members/:id             // Get crew member details
POST   /api/crew-members                 // Create crew member
PUT    /api/crew-members/:id             // Update crew member
DELETE /api/crew-members/:id             // Delete crew member

// User Association (New Feature)
GET    /api/crew-members/:id/with-user           // Get crew member with user info
POST   /api/crew-members/:id/link-user           // Link crew member to user
POST   /api/crew-members/:id/unlink-user         // Unlink crew member from user
GET    /api/workspaces/:id/unlinked-crew-members // Search unlinked profiles by email
```

### Job & Resource Management
```typescript
// Jobs
GET    /api/workspaces/:id/jobs          // Get workspace jobs
GET    /api/jobs/:id                     // Get job details
POST   /api/jobs                         // Create job
PUT    /api/jobs/:id                     // Update job
DELETE /api/jobs/:id                     // Delete job

// Resources
GET    /api/workspaces/:id/resources     // Get workspace resources
GET    /api/resources/:id                // Get resource details
POST   /api/resources                    // Create resource
PUT    /api/resources/:id                // Update resource
DELETE /api/resources/:id                // Delete resource
```

### Notifications
```typescript
GET    /api/users/:id/notifications      // Get user notifications
POST   /api/notifications                // Create notification
PUT    /api/notifications/:id/read       // Mark as read
DELETE /api/notifications/:id            // Delete notification
```

---

## User Interface Components

### Page Structure
```typescript
// Authentication Pages
client/src/pages/auth/
├── login.tsx           // Login form with Replit OAuth
├── register.tsx        // User registration
└── invitation.tsx      // Accept workspace invitation

// Workspace Management
client/src/pages/workspaces/
├── index.tsx           // Workspace selection/creation
├── settings.tsx        // Workspace configuration
├── members.tsx         // Member management
└── invitations.tsx     // Invitation management

// Production Management
client/src/pages/productions/
├── index.tsx           // Production list
├── create.tsx          // Create production
├── [id].tsx           // Production details
└── templates/
    ├── index.tsx       // Template list
    ├── create.tsx      // Create template
    └── [id].tsx       // Template details

// Scheduling
client/src/pages/schedule/
├── calendar.tsx        // Main calendar view
├── events/
│   ├── create.tsx      // Create event
│   └── [id].tsx       // Event details
└── assignments.tsx     // Assignment management

// Crew Management
client/src/pages/crew-members/
├── index.tsx           // Crew member list
├── create.tsx          // Add crew member
├── [id].tsx           // Crew member profile
├── link-profile.tsx    // User-crew linking interface
└── my-schedule.tsx     // Personal schedule view

// Resource Management
client/src/pages/resources/
├── index.tsx           // Resource list
├── create.tsx          // Add resource
└── [id].tsx           // Resource details

// Jobs
client/src/pages/jobs/
├── index.tsx           // Job list
├── create.tsx          // Create job
└── [id].tsx           // Job details
```

### Key UI Components
```typescript
// Navigation
client/src/components/layout/
├── Navbar.tsx          // Main navigation
├── Sidebar.tsx         // Workspace navigation
├── WorkspaceSwitcher.tsx // Workspace selection
└── UserMenu.tsx        // User account menu

// Forms
client/src/components/forms/
├── WorkspaceForm.tsx   // Workspace creation/editing
├── ProductionForm.tsx  // Production management
├── TemplateForm.tsx    // Template configuration
├── EventForm.tsx       // Event scheduling
├── CrewMemberForm.tsx  // Crew member profiles
├── ResourceForm.tsx    // Resource management
└── JobForm.tsx         // Job definitions

// Calendar Integration
client/src/components/calendar/
├── CalendarView.tsx    // FullCalendar wrapper
├── EventModal.tsx      // Event details modal
├── QuickCreate.tsx     // Quick event creation
└── AssignmentPanel.tsx // Assignment interface

// Data Tables
client/src/components/tables/
├── CrewMemberTable.tsx // Crew management
├── ResourceTable.tsx   // Resource management
├── ProductionTable.tsx // Production overview
└── AssignmentTable.tsx // Assignment tracking

// Reusable UI
client/src/components/ui/ // shadcn/ui components
├── button.tsx
├── form.tsx
├── table.tsx
├── dialog.tsx
├── calendar.tsx
└── ... (standard shadcn components)
```

### Theme & Styling
```css
/* index.css - Custom CSS Variables */
:root {
  /* Brand Colors */
  --primary: 220 90% 56%;        /* Professional blue */
  --primary-foreground: 210 20% 98%;

  /* Semantic Colors */
  --background: 0 0% 100%;       /* Clean white */
  --foreground: 222.2 84% 4.9%;  /* Dark text */
  --muted: 210 40% 96%;          /* Subtle backgrounds */
  --border: 214.3 31.8% 91.4%;   /* Light borders */

  /* Status Colors */
  --success: 142 76% 36%;        /* Green for confirmed */
  --warning: 38 92% 50%;         /* Orange for pending */
  --destructive: 0 84% 60%;      /* Red for errors */
}

.dark {
  --background: 222.2 84% 4.9%;  /* Dark background */
  --foreground: 210 40% 98%;     /* Light text */
  --muted: 217.2 32.6% 17.5%;    /* Dark muted */
  --border: 217.2 32.6% 17.5%;   /* Dark borders */
}
```

---

## Workflow Documentation

### User Onboarding Workflow
1. **Account Registration**
   - User creates account via Replit OAuth
   - Profile setup with name and preferences
   - Account exists independently of workspaces

2. **Workspace Discovery**
   - User creates new workspace (becomes owner)
   - OR accepts invitation to existing workspace
   - Role assignment based on invitation

3. **Team Building**
   - Owners/admins invite team members via email
   - Time-limited invitation tokens sent
   - New members join with appropriate permissions

4. **Profile Linking** (Optional)
   - Crew members search for existing profiles by email
   - Link user account to crew member profile
   - Gain access to personalized schedules

### Production Planning Workflow
1. **Production Setup**
   - Create high-level production concepts
   - Define show categories and branding
   - Set production-wide settings

2. **Template Creation**
   - Build scheduling blueprints for recurring shows
   - Define job requirements and quantities
   - Specify resource needs and preferences
   - Set recurring patterns (daily, weekly, custom)

3. **Resource Preparation**
   - Create crew member profiles
   - Define job roles and pay rates
   - Register equipment and facilities
   - Set availability constraints

### Scheduling Workflow
1. **Automated Generation**
   - Templates generate recurring events automatically
   - System respects availability constraints
   - Conflict detection prevents double-booking

2. **Manual Refinement**
   - Production managers review generated schedules
   - Make adjustments for special circumstances
   - Add one-off events as needed

3. **Assignment Process**
   - Assign specific crew members to events
   - Allocate required resources
   - Send confirmation requests

4. **Confirmation & Updates**
   - Crew members receive assignment notifications
   - Confirmation workflow ensures commitment
   - Real-time updates for schedule changes

### Crew Member Workflow
1. **Profile Discovery**
   - Crew member registers user account
   - Searches for existing profile by email
   - Links account to gain schedule access

2. **Schedule Management**
   - Views personalized schedule calendar
   - Receives assignment notifications
   - Confirms availability and acceptance

3. **Real-time Updates**
   - Gets notified of schedule changes
   - Updates personal availability
   - Communicates with production team

### Resource Management Workflow
1. **Inventory Setup**
   - Register all equipment and facilities
   - Define quantities and specifications
   - Set hourly costs and availability

2. **Allocation Process**
   - Templates specify resource requirements
   - System matches needs to availability
   - Prevents conflicts and over-allocation

3. **Utilization Tracking**
   - Track resource usage across events
   - Calculate costs and efficiency
   - Identify optimization opportunities

---

## Implementation Guide

### Prerequisites
```bash
# Required Software
- Node.js 18+ 
- PostgreSQL 14+ (or Neon serverless)
- Git

# Development Tools (Optional)
- VS Code with TypeScript extensions
- PostgreSQL client (pgAdmin, DBeaver)
- API testing tool (Postman, Insomnia)
```

### Initial Setup
```bash
# 1. Project Initialization
npm create vite@latest crewer --template react-ts
cd crewer

# 2. Install Core Dependencies
npm install express typescript tsx
npm install @types/express @types/node
npm install drizzle-orm @neondatabase/serverless
npm install drizzle-zod zod
npm install express-session connect-pg-simple
npm install @tanstack/react-query wouter
npm install react-hook-form @hookform/resolvers

# 3. Install UI Dependencies  
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-toast @radix-ui/react-tabs
npm install tailwindcss @tailwindcss/typography
npm install lucide-react framer-motion next-themes

# 4. Install Calendar Dependencies
npm install @fullcalendar/react @fullcalendar/core
npm install @fullcalendar/daygrid @fullcalendar/timegrid
npm install @fullcalendar/interaction date-fns rrule

# 5. Development Dependencies
npm install -D drizzle-kit @vitejs/plugin-react
npm install -D autoprefixer postcss tailwindcss
npm install -D jest @types/jest supertest ts-jest
```

### Project Structure Setup
```bash
# Create directory structure
mkdir -p client/src/{components,pages,hooks,lib}
mkdir -p client/src/components/{ui,forms,layout,tables,calendar}
mkdir -p client/src/pages/{auth,workspaces,productions,schedule,crew-members,resources,jobs}
mkdir -p server/{routes,middleware,utils}
mkdir -p shared
mkdir -p __tests__

# Create core files
touch shared/schema.ts
touch server/{index.ts,db.ts,storage.ts,routes.ts}
touch client/src/{App.tsx,main.tsx,index.css}
touch {drizzle.config.ts,vite.config.ts,tailwind.config.ts}
```

### Database Configuration
```typescript
// drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;

// server/db.ts
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
```

### Core Schema Definition
```typescript
// shared/schema.ts - Start with essential tables
import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

// Start with users and workspaces, then add other tables...
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  // ... other fields
});

// Add relations and types...
export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(workspaceMemberships),
}));

// Generate Zod schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
```

### Server Setup
```typescript
// server/index.ts
import express from "express";
import { registerRoutes } from "./routes";

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static("dist"));

registerRoutes(app).listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// server/storage.ts - Implement storage interface
export interface IStorage {
  // Define all CRUD operations
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  // ... other operations
}

export class DatabaseStorage implements IStorage {
  // Implement all methods using Drizzle ORM
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  // ... other implementations
}

export const storage = new DatabaseStorage();
```

### Client Setup
```typescript
// client/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// client/src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { ThemeProvider } from "@/components/theme-provider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="crewer-theme">
        <Router>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/workspaces" component={Workspaces} />
            <Route path="/schedule" component={Schedule} />
            {/* Add more routes */}
          </Switch>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

### Development Scripts
```json
// package.json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "tsc server/index.ts --outDir dist-server",
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio",
    "test": "jest",
    "type-check": "tsc --noEmit"
  }
}
```

### Environment Variables
```bash
# .env
DATABASE_URL="postgresql://user:pass@host:port/db"
SESSION_SECRET="your-secret-key"
REPL_ID="your-replit-app-id"  # For OAuth
ISSUER_URL="https://replit.com/oidc"
REPLIT_DOMAINS="your-domain.replit.app"
```

### Build & Deployment
```bash
# Development
npm run dev                    # Start development server
npm run db:push               # Push schema changes
npm run db:studio             # Open database studio

# Production
npm run build                 # Build for production
npm run db:generate           # Generate migrations
npm start                     # Start production server
```

### Testing Strategy
```typescript
// __tests__/api.test.ts
import request from "supertest";
import { app } from "../server/index";

describe("API Endpoints", () => {
  test("GET /api/workspaces", async () => {
    const response = await request(app)
      .get("/api/workspaces")
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
  });
});

// Run tests
npm test
```

---

## Advanced Features & Optimizations

### Performance Optimizations
1. **Database Indexing**: Strategic indexes on frequently queried columns
2. **Query Optimization**: Efficient Drizzle ORM queries with proper joins
3. **Caching Strategy**: React Query for client-side caching
4. **Lazy Loading**: Code splitting and route-based loading

### Scalability Considerations
1. **Database Connection Pooling**: Managed connection pools
2. **Session Storage**: PostgreSQL-backed session storage
3. **Multi-tenancy**: Proper workspace isolation
4. **API Rate Limiting**: Prevent abuse and ensure fair usage

### Security Features
1. **CSRF Protection**: Built into session management
2. **SQL Injection Prevention**: Parameterized queries via ORM
3. **XSS Protection**: React's built-in XSS prevention
4. **Authentication**: Secure OpenID Connect flow

### Monitoring & Analytics
1. **Error Tracking**: Comprehensive error logging
2. **Performance Monitoring**: Query performance tracking
3. **User Analytics**: Usage patterns and optimization opportunities
4. **Resource Utilization**: Database and server monitoring

---

## Conclusion

This comprehensive documentation provides everything needed to recreate Crewer from scratch. The system combines modern web technologies with production-proven patterns to deliver a scalable, user-friendly TV production management platform.

Key success factors:
- **Clear separation of concerns** between frontend, backend, and shared code
- **Type safety** throughout the entire stack
- **Flexible architecture** that can adapt to different production workflows  
- **User-centric design** that prioritizes real-world usability
- **Scalable foundation** ready for enterprise deployment

The 3-tier scheduling architecture, combined with the user-crew member association system, creates a powerful platform that transforms manual production scheduling into an efficient, automated process while maintaining the flexibility needed for creative workflows.