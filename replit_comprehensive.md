# Crewer - TV Production Management Platform

## Project Overview

Crewer is a comprehensive SaaS platform designed specifically for television production companies to manage crews, shows, and resources. It streamlines the complex workflows of TV production through an innovative 3-tier scheduling architecture that separates editorial concepts from scheduling blueprints and concrete calendar instances.

### Core Value Proposition

- **Automated Scheduling**: Transform weeks of manual scheduling into minutes of automated workflow
- **Resource Optimization**: Prevent conflicts, optimize crew utilization, and manage equipment efficiently  
- **Production Intelligence**: Analytics and insights to improve production efficiency and cost management
- **Enterprise Scalability**: Multi-tenant architecture supporting multiple production companies and workspaces

### Target Users

- **Production Managers**: Primary users managing day-to-day scheduling and crew assignments
- **Show Producers**: Creating and overseeing production concepts and requirements
- **Resource Coordinators**: Managing studios, equipment, and location bookings
- **Crew Members**: Viewing schedules, availability, and assignment details
- **Executives**: Analytics and high-level production oversight

## Complete Feature Set

### Core Modules

#### 1. Workspace Management
- **Multi-tenant Architecture**: Complete isolation between production companies
- **Workspace Creation**: Custom naming, slug generation, and settings configuration
- **User Management**: Role-based access (coming soon - currently simplified)
- **Settings**: Workspace-level configuration and preferences

#### 2. Production Management (3-Tier Architecture)

**Tier 1: Productions**
- Create high-level show concepts ("Morning News", "Sports Weekly")
- No scheduling information - pure editorial/creative containers
- Color coding and description management
- Container for multiple show templates

**Tier 2: Show Templates**
- Define HOW productions should be scheduled
- Recurring pattern configuration using RRule specification
- Duration, job requirements, and resource needs
- Template inheritance for consistent scheduling

**Tier 3: Scheduled Events** 
- Concrete calendar instances with specific dates/times
- Actual crew and resource assignments
- Status tracking (scheduled, in_progress, completed, cancelled)
- Generated from templates OR created as one-off events

#### 3. Crew Management
- **Crew Member Database**: Full contact information, skills, and availability tracking
- **Job Role Definition**: Customizable job titles with descriptions and pay rates
- **Assignment Management**: Link crew members to specific events and roles
- **Availability Tracking**: Schedule conflicts and availability windows
- **Skills Tracking**: Searchable skills database for optimal crew matching

#### 4. Resource Management
- **Equipment Inventory**: Cameras, lighting, audio equipment tracking
- **Studio Management**: Studio booking and availability
- **Location Tracking**: External location management and scheduling
- **Cost Management**: Hourly rates and budget tracking per resource
- **Conflict Detection**: Prevent double-booking of resources

#### 5. Scheduling & Calendar System
- **FullCalendar Integration**: Professional calendar interface
- **Multiple Views**: Daily, weekly, monthly, and list views
- **Drag-and-Drop**: Intuitive schedule management
- **Real-time Updates**: Live collaboration and instant updates
- **Conflict Detection**: Automatic prevention of scheduling conflicts

#### 6. Analytics & Reporting
- **Dashboard Metrics**: Real-time workspace overview
- **Crew Utilization**: Track crew member workload and efficiency
- **Resource Analytics**: Equipment usage and cost analysis
- **Production Reports**: Show completion rates and timeline analysis
- **Financial Tracking**: Budget vs actual cost reporting

#### 7. Notifications System
- **Real-time Alerts**: Schedule changes, conflicts, and updates
- **Email Integration**: Automated crew and stakeholder notifications
- **Customizable Alerts**: Configurable notification preferences
- **Activity Feed**: Audit trail of all workspace activities

### User Interface Components

#### Navigation Structure
```
- Dashboard (Overview metrics and recent activity)
- Productions (3-tier management interface)
  - Productions List
  - Show Templates  
  - Scheduled Events
- Crew Members (Personnel management)
- Jobs (Role definitions)
- Resources (Equipment/studio management)
- Shows (Legacy interface for events)
  - List View
  - Calendar View
  - Templates
- Crew Schedule (Advanced calendar view)
- Reports (Analytics and insights)
- Settings (Workspace configuration)
- Notifications (Alert management)
```

#### Key UI Patterns
- **Two-column Layout**: List selection + detail view pattern
- **Modal Forms**: Comprehensive creation/editing interfaces
- **Data Tables**: Sortable, filterable, searchable lists
- **Calendar Views**: Multiple calendar interfaces for different needs
- **Real-time Updates**: Live data refresh and optimistic updates

## Technical Architecture

### Stack Overview
Crewer uses a modern full-stack architecture optimized for developer productivity and enterprise scalability.

**Frontend Technologies:**
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Full type safety throughout the application
- **Vite**: Lightning-fast build tool and development server
- **Wouter**: Lightweight routing (React Router alternative)
- **TanStack Query v5**: Powerful server state management and caching
- **React Hook Form**: Performant form handling with validation
- **Zod**: Runtime type validation and schema definition
- **Shadcn/ui**: Accessible component library built on Radix UI
- **Tailwind CSS**: Utility-first styling framework
- **FullCalendar**: Professional calendar components
- **Framer Motion**: Smooth animations and transitions

**Backend Technologies:**
- **Express.js**: Fast, minimalist web framework
- **TypeScript**: End-to-end type safety
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL**: Robust relational database
- **Neon Database**: Serverless PostgreSQL hosting
- **Express Session**: Session management
- **Passport.js**: Authentication framework (prepared for future use)

**Development Tools:**
- **Drizzle Kit**: Database migrations and schema management
- **Jest**: Testing framework
- **ESBuild**: Fast production bundling
- **PostCSS & Autoprefixer**: CSS processing
- **TSX**: TypeScript execution for development

### Architecture Patterns

#### Monolithic Structure
The application follows a monolithic architecture with clear separation of concerns:

```
├── client/          # React frontend application
├── server/          # Express.js backend API
├── shared/          # Shared types and schemas
└── __tests__/       # Test suites
```

#### Data Flow Architecture
1. **Client-Side State**: TanStack Query manages server state with optimistic updates
2. **API Layer**: RESTful Express.js endpoints with Zod validation
3. **Business Logic**: Centralized in storage layer with TypeScript interfaces
4. **Database Layer**: Drizzle ORM with PostgreSQL for data persistence

#### Multi-Tenancy Design
- **Workspace Isolation**: All data scoped by workspace ID
- **URL Structure**: `/workspaces/{slug}/` routing pattern
- **Database Design**: Foreign key constraints ensure data isolation
- **Shared Resources**: Users can belong to multiple workspaces

### 3-Tier Scheduling Architecture Detailed

#### Tier 1: Productions (High-Level Content Containers)
**Purpose**: Editorial and creative organization without scheduling constraints
**Examples**: "Morning News", "Evening Sports", "Weather Update"
**Properties**: Name, description, color coding, workspace association
**Usage**: Grouping related show templates, brand/content organization

#### Tier 2: Show Templates (Scheduling Blueprints)
**Purpose**: Define HOW content should be scheduled with specific requirements
**Examples**: "Morning News Template: Mon-Fri 6:00-7:00 AM", "Weather Update: Daily 5:55-6:00 AM"
**Properties**: Duration, recurring patterns (RRule), job requirements, resource needs
**Usage**: Automated schedule generation, consistent requirement application

#### Tier 3: Scheduled Events (Calendar Instances)
**Purpose**: Concrete calendar entries with actual assignments
**Examples**: "Morning News - January 15, 2025 6:00-7:00 AM" with specific crew assigned
**Properties**: Exact start/end times, crew assignments, resource bookings, status
**Usage**: Day-to-day operations, actual production tracking

#### Workflow Examples

**Creating a New Recurring Show:**
1. Create Production: "Morning News" (editorial container)
2. Create Template: Define Mon-Fri 6:00-7:00 AM pattern with required roles (anchor, camera operator, director)
3. Generate Events: System creates concrete calendar instances for next 3 months
4. Assign Crew: Production manager assigns specific people to each event
5. Track Execution: Update event status as shows are produced

**Database Operations:**
```sql
-- Create production (Tier 1)
INSERT INTO productions (name, description, workspace_id) 
VALUES ('Morning News', 'Daily morning broadcast', 'workspace-123');

-- Create template (Tier 2) 
INSERT INTO show_templates (name, production_id, duration, recurring_pattern)
VALUES ('Morning News Template', 'prod-456', 60, 'FREQ=DAILY;BYHOUR=6;BYMINUTE=0');

-- Generate events (Tier 3)
INSERT INTO events (title, template_id, start_time, end_time, status)
VALUES ('Morning News - Jan 15', 'template-789', '2025-01-15 06:00:00', '2025-01-15 07:00:00', 'scheduled');
```

#### Architectural Benefits
1. **Separation of Concerns**: Editorial decisions separate from operational scheduling
2. **Powerful Automation**: Templates enable bulk schedule generation and requirement propagation
3. **Flexible Scheduling**: Support both recurring series and one-off specials, easy schedule modifications without losing template logic
4. **Resource Planning**: Template-level requirements enable capacity planning, event-level assignments enable conflict detection
5. **Workflow Efficiency**: Users define requirements once and apply to many episodes, automated schedule generation reduces manual work, clear separation enables specialized UI workflows

### Complete Database Schema

#### Core Tables Structure

**Workspaces & Users**
```sql
workspaces: id, name, slug, description, settings, created_at, updated_at
users: id, email, name, avatar, preferences, created_at, updated_at  
notifications: id, user_id, workspace_id, title, message, type, read, created_at
```

**3-Tier Production System**
```sql
-- Tier 1: Editorial Concepts
productions: id, workspace_id, name, description, color, created_at, updated_at

-- Tier 2: Scheduling Blueprints  
show_templates: id, workspace_id, production_id, name, description, duration, 
                recurring_pattern, notes, color, created_at, updated_at

-- Tier 3: Calendar Instances
events: id, workspace_id, production_id, template_id, title, description,
        start_time, end_time, status, notes, color, created_at, updated_at
```

**Crew & Resource Management**
```sql
jobs: id, workspace_id, title, description, department, pay_rate, 
      requirements, created_at, updated_at
      
crew_members: id, workspace_id, first_name, last_name, email, phone,
              primary_job_id, skills[], hourly_rate, availability{},
              notes, created_at, updated_at
              
resources: id, workspace_id, name, type, description, quantity,
           cost_per_hour, availability, created_at, updated_at
```

**Requirements & Assignments**
```sql
-- Template Level (Blueprint Requirements)
template_required_jobs: id, workspace_id, template_id, job_id, quantity, notes, created_at
template_resources: id, workspace_id, template_id, resource_id, quantity, notes, created_at

-- Event Level (Concrete Assignments)
event_crew_assignments: id, workspace_id, event_id, crew_member_id, job_id, 
                        confirmed_at, notes, created_at
event_resource_assignments: id, workspace_id, event_id, resource_id, quantity,
                            confirmed_at, notes, created_at
```

#### Database Relationships
```sql
-- Core hierarchy
workspaces 1:many productions 1:many show_templates 1:many events

-- Template requirements (blueprint level)
show_templates 1:many template_required_jobs many:1 jobs
show_templates 1:many template_resources many:1 resources

-- Event assignments (concrete level)  
events 1:many event_crew_assignments many:1 crew_members
events 1:many event_crew_assignments many:1 jobs
events 1:many event_resource_assignments many:1 resources

-- Crew management
workspaces 1:many crew_members many:1 jobs (primary_job_id)
workspaces 1:many jobs
workspaces 1:many resources
```

### Complete API Reference

#### Workspace Operations
```typescript
GET /api/workspaces                     // List all workspaces
GET /api/workspaces/recent              // Get most recently accessed
GET /api/workspaces/slug-check          // Check slug availability
GET /api/workspaces/:id                 // Get specific workspace
POST /api/workspaces                    // Create new workspace
PUT /api/workspaces/:id                 // Update workspace
DELETE /api/workspaces/:id              // Delete workspace
POST /api/workspaces/switch             // Switch active workspace
```

#### Production Management (3-Tier System)
```typescript
// Productions (Tier 1)
GET /api/workspaces/:id/productions     // List productions
POST /api/workspaces/:id/productions    // Create production
PUT /api/productions/:id                // Update production
DELETE /api/productions/:id             // Delete production

// Show Templates (Tier 2)  
GET /api/workspaces/:id/show-templates  // List templates
GET /api/productions/:id/templates      // Templates for production
POST /api/productions/:id/templates     // Create template
PUT /api/show-templates/:id             // Update template
DELETE /api/show-templates/:id          // Delete template

// Scheduled Events (Tier 3)
GET /api/workspaces/:id/events          // List all events
GET /api/templates/:id/events           // Events from template
POST /api/workspaces/:id/events         // Create one-off event
POST /api/templates/:id/generate        // Generate events from template
PUT /api/events/:id                     // Update event
DELETE /api/events/:id                  // Delete event
```

#### Crew & Resource Management
```typescript
// Crew Members
GET /api/workspaces/:id/crew-members    // List crew members
POST /api/crew-members                  // Create crew member
PUT /api/crew-members/:id               // Update crew member
DELETE /api/crew-members/:id            // Delete crew member

// Jobs
GET /api/workspaces/:id/jobs            // List job roles
POST /api/jobs                          // Create job role
PUT /api/jobs/:id                       // Update job role  
DELETE /api/jobs/:id                    // Delete job role

// Resources
GET /api/workspaces/:id/resources       // List resources
POST /api/resources                     // Create resource
PUT /api/resources/:id                  // Update resource
DELETE /api/resources/:id               // Delete resource
```

#### Assignment Management
```typescript
// Template Requirements
GET /api/templates/:id/required-jobs    // Template job requirements
POST /api/templates/:id/required-jobs   // Add job requirement
DELETE /api/template-required-jobs/:id  // Remove job requirement

GET /api/templates/:id/resources        // Template resource needs
POST /api/templates/:id/resources       // Add resource need
DELETE /api/template-resources/:id      // Remove resource need

// Event Assignments
GET /api/events/:id/crew-assignments    // Event crew assignments
POST /api/events/:id/crew-assignments   // Assign crew to event
DELETE /api/event-crew-assignments/:id  // Remove crew assignment

GET /api/events/:id/resource-assignments // Event resource bookings
POST /api/events/:id/resource-assignments // Book resource for event
DELETE /api/event-resource-assignments/:id // Remove resource booking
```

#### Legacy Support (Backward Compatibility)
```typescript
// Legacy shows API (mapped to events)
GET /api/workspaces/:id/shows           // List shows (legacy events)
GET /api/shows/:id                      // Get show details
PUT /api/shows/:id                      // Update show
DELETE /api/shows/:id                   // Delete show
```

### Development & Deployment

#### Local Development Setup
```bash
# Install dependencies
npm install

# Start development server (frontend + backend)
npm run dev

# Database operations
npm run db:push          # Push schema changes to database
npm run check            # TypeScript type checking

# Testing
npm test                 # Run test suite
```

#### Environment Configuration
```bash
# Required Environment Variables
DATABASE_URL=postgresql://...     # PostgreSQL connection string
NODE_ENV=development|production   # Environment flag

# Replit Auto-Provided (when deployed on Replit)
PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
```

#### Build & Deployment
```bash
# Production build
npm run build           # Builds both client and server

# Production start
npm run start           # Runs production server on port 5000
```

#### Replit Configuration
```yaml
# .replit configuration
modules: [nodejs-20, web, postgresql-16]
hidden: [.config, dist, node_modules]
run: npm run dev
deploymentTarget: cloudrun
```

## Development Patterns & Best Practices

### Frontend Patterns
```typescript
// TanStack Query with workspace scoping
const { data: shows = [] } = useQuery({
  queryKey: [`/api/workspaces/${currentWorkspace?.id}/shows`],
  enabled: !!currentWorkspace?.id,
});

// Form handling with Zod validation
const form = useForm<FormValues>({
  resolver: zodResolver(insertCrewMemberSchema),
  defaultValues: { firstName: "", lastName: "" }
});

// Optimistic updates with cache invalidation
const mutation = useMutation({
  mutationFn: (data) => apiRequest("POST", "/api/crew-members", data),
  onSuccess: () => {
    queryClient.invalidateQueries({ 
      queryKey: [`/api/workspaces/${workspaceId}/crew-members`] 
    });
  }
});
```

### Backend Patterns
```typescript
// Route validation with Zod
app.post("/api/crew-members", async (req, res) => {
  const validation = insertCrewMemberSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.errors });
  }
  const crewMember = await storage.createCrewMember(validation.data);
  res.status(201).json(crewMember);
});

// Storage interface with TypeScript
interface IStorage {
  getCrewMembers(workspaceId: string): Promise<CrewMember[]>;
  createCrewMember(data: InsertCrewMember): Promise<CrewMember>;
  // ... other methods
}
```

### Database Patterns
```typescript
// Drizzle ORM queries with type safety
const crewMembers = await db
  .select()
  .from(crewMembers)
  .where(eq(crewMembers.workspaceId, workspaceId));

// Schema definitions with Zod integration
export const insertCrewMemberSchema = createInsertSchema(crewMembers)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type InsertCrewMember = z.infer<typeof insertCrewMemberSchema>;
export type CrewMember = typeof crewMembers.$inferSelect;
```

## Dependencies & External Services

### Core Production Dependencies

**Database & Backend**
- `@neondatabase/serverless`: Serverless PostgreSQL database
- `drizzle-orm`: Type-safe ORM with excellent TypeScript integration
- `drizzle-zod`: Automatic Zod schema generation from Drizzle schemas
- `express`: Fast, unopinionated web framework
- `express-session`: Session management middleware
- `passport`: Authentication middleware (prepared for future use)
- `zod`: Runtime type validation and schema definition

**Frontend Core**
- `react` & `react-dom`: React 18 with modern features
- `@tanstack/react-query`: Powerful data fetching and state management
- `wouter`: Lightweight routing alternative to React Router
- `react-hook-form`: Performant forms with minimal re-renders
- `@hookform/resolvers`: Integration with Zod validation

**UI & Styling**
- `@radix-ui/*`: Accessible, unstyled UI primitives (20+ components)
- `tailwindcss`: Utility-first CSS framework
- `tailwindcss-animate`: Animation utilities for Tailwind
- `lucide-react`: Beautiful, customizable SVG icons
- `framer-motion`: Smooth animations and transitions
- `next-themes`: Dark mode support and theme switching

**Calendar & Date Handling**
- `@fullcalendar/*`: Professional calendar components
  - `@fullcalendar/react`: React integration
  - `@fullcalendar/daygrid`: Month view
  - `@fullcalendar/timegrid`: Week/day views
  - `@fullcalendar/interaction`: Drag & drop functionality
  - `@fullcalendar/resource-timegrid`: Resource scheduling
- `date-fns`: Lightweight date utility library
- `react-day-picker`: Date picker component
- `rrule`: Recurring event pattern generation

**Development Tools**
- `typescript`: Static type checking
- `vite`: Fast build tool and dev server
- `tsx`: TypeScript execution for development
- `esbuild`: Fast bundling for production
- `drizzle-kit`: Database migration management
- `jest` & `ts-jest`: Testing framework with TypeScript support

### External Services

**Required Services**
- **Neon Database**: Serverless PostgreSQL hosting
  - Automatic backups and scaling
  - Connection pooling and edge locations
  - Development and production environments

**Optional Integrations (Prepared)**
- **Authentication Providers**: OAuth integration ready via Passport.js
- **Email Service**: SMTP configuration for notifications
- **File Storage**: Asset management for production files
- **Analytics**: User behavior and application performance tracking

### Browser Requirements

**Supported Browsers**
- Chrome 88+ (Chromium-based browsers)
- Firefox 85+
- Safari 14+
- Edge 88+

**Key Web APIs Used**
- ES2020+ JavaScript features
- CSS Grid & Flexbox
- WebSocket (prepared for real-time features)
- Local Storage for client-side preferences
- File API for potential file uploads

## Implementation Roadmap

### Phase 1: Foundation (Completed)
- [x] Basic workspace and user management
- [x] 3-tier scheduling architecture implementation
- [x] Core CRUD operations for all entities
- [x] Basic UI with Shadcn/ui components
- [x] Database schema and migrations
- [x] RESTful API with TypeScript validation

### Phase 2: Enhanced UX (Completed)
- [x] FullCalendar integration for scheduling
- [x] Advanced crew member management
- [x] Resource booking system
- [x] Real-time updates with TanStack Query
- [x] Form validation with React Hook Form + Zod
- [x] Professional dashboard with metrics

### Phase 3: Production Features (In Progress)
- [x] Template requirements management
- [x] Event crew assignments
- [x] Conflict detection system
- [x] Notification system foundation
- [ ] Email notifications and alerts
- [ ] Advanced analytics and reporting
- [ ] Bulk operations and CSV import/export

### Phase 4: Enterprise Features (Planned)
- [ ] Role-based access control (RBAC)
- [ ] Advanced authentication (OAuth, SSO)
- [ ] API rate limiting and security
- [ ] Audit logging and compliance
- [ ] Mobile responsive optimization
- [ ] Offline capabilities and PWA features

### Phase 5: AI & Automation (Future)
- [ ] AI-powered crew recommendations
- [ ] Automated conflict resolution
- [ ] Predictive scheduling analytics
- [ ] Natural language schedule queries
- [ ] Machine learning optimization

## Getting Started Guide

### For New Developers

1. **Environment Setup**
   ```bash
   # Clone and install
   git clone <repository>
   cd crewer
   npm install
   
   # Set up database
   npm run db:push
   
   # Start development
   npm run dev
   ```

2. **Understanding the Codebase**
   - Start with `shared/schema.ts` to understand data models
   - Review `server/storage.ts` for business logic interface
   - Explore `client/src/pages/` for UI implementation
   - Check `server/routes.ts` for API endpoints

3. **Making Changes**
   - Schema changes: Update `shared/schema.ts` then `npm run db:push`
   - New features: Follow existing patterns in similar components
   - API changes: Update storage interface, then routes, then frontend

### For Production Deployment

1. **Replit Deployment**
   - Configure `.replit` file for environment
   - Set up PostgreSQL module
   - Configure secrets for production database
   - Deploy with automatic scaling

2. **Custom Deployment**
   - Build with `npm run build`
   - Set environment variables
   - Configure reverse proxy (nginx recommended)
   - Set up PostgreSQL database
   - Monitor with standard Node.js tooling

## User Preferences & Guidelines

- **Communication Style**: Simple, everyday language suitable for non-technical production staff
- **Technical Approach**: Focus on TV production industry workflows and terminology
- **UI/UX**: Professional, clean interface optimized for broadcast professionals
- **Performance**: Prioritize responsiveness and real-time collaboration
- **Accessibility**: Ensure compliance with WCAG guidelines for inclusive design

## Recent Changes & Version History

### August 13, 2025 - Comprehensive Documentation & Bug Fixes
1. **Enhanced Documentation**: Complete rewrite of replit.md with full feature documentation
   - Added complete API reference with all endpoints
   - Documented entire database schema and relationships
   - Added implementation roadmap and getting started guide
   - Included development patterns and best practices

2. **Fixed Crew Schedule Error**: Resolved JavaScript error in crew schedule component
   - Updated component to handle firstName/lastName fields correctly
   - Fixed crew member name display throughout application

3. **Database Schema Stabilization**: Completed missing database columns
   - Added pay_rate, requirements, updated_at to jobs table
   - Verified all schema definitions match database structure

### Previous Major Updates
- **July 15, 2025**: Application stabilization and route cleanup
- **July 2, 2025**: Legacy schema removal and architecture streamlining  
- **June 24, 2025**: Initial 3-tier architecture implementation