# Crewer - TV Production Management SaaS Platform

## Project Overview

Crewer is a comprehensive Software-as-a-Service (SaaS) platform designed specifically for television production workflows. It manages crews, shows, and resources through an innovative 3-tier scheduling architecture that separates editorial concepts from scheduling blueprints and concrete calendar instances. The platform transforms manual scheduling into efficient, automated processes while providing production intelligence via analytics and enterprise scalability through multi-tenant architecture.

## Target Users
- **Production Managers**: Oversee entire production workflows and resource allocation
- **Show Producers**: Manage specific show content and scheduling requirements
- **Resource Coordinators**: Handle equipment, locations, and material logistics
- **Crew Members**: Access schedules, assignments, and production information
- **Executives**: Monitor production metrics, costs, and performance analytics

## Core Value Proposition
- **Automated Scheduling**: Transform manual scheduling into intelligent, automated processes
- **Resource Optimization**: Prevent conflicts and maximize utilization of crew and equipment
- **Production Intelligence**: Analytics and insights for data-driven decision making
- **Enterprise Scalability**: Multi-tenant architecture supporting multiple production companies
- **Real-time Collaboration**: Live updates and notifications across production teams

## Architecture Overview

### Technology Stack

**Frontend (React 18 + TypeScript)**
- **React 18**: Concurrent features and modern hooks
- **TypeScript**: End-to-end type safety
- **Vite**: Fast development server and build tool
- **Wouter**: Lightweight client-side routing
- **TanStack Query v5**: Server state management and caching
- **React Hook Form**: Form handling with validation
- **Zod**: Runtime type validation and schema generation
- **Shadcn/ui**: Accessible component library built on Radix UI
- **Tailwind CSS**: Utility-first styling framework
- **FullCalendar**: Professional calendar components with multiple views
- **Framer Motion**: Smooth animations and transitions
- **Lucide React**: Modern icon library

**Backend (Express.js + TypeScript)**
- **Express.js**: Fast, minimalist web framework
- **TypeScript**: Type-safe server development
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **Express Session**: Session management and authentication
- **Zod**: Server-side validation matching frontend schemas

**Database (PostgreSQL + Drizzle)**
- **PostgreSQL**: Robust relational database for production data
- **Drizzle ORM**: Type-safe ORM with automatic TypeScript generation
- **Neon Database**: Serverless PostgreSQL hosting for production

**Development Tools**
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Fast TypeScript compilation
- **PostCSS**: CSS processing with Tailwind
- **Jest**: Testing framework for unit tests

### Multi-Tenant Architecture

**Workspace Isolation**
- All production data is scoped by `workspace_id`
- Users can belong to multiple workspaces with different roles
- Complete data separation between production companies

**User Authentication System**
- **Independent User Accounts**: Users register with email/name independently of workspaces
- **Workspace Membership**: Many-to-many relationship with roles (owner, admin, member, viewer)
- **Invitation System**: Email-based invitations with secure tokens and expiration
- **Role-Based Access Control**: Granular permissions based on workspace membership

### 3-Tier Scheduling Architecture

**Tier 1: Productions**
- High-level show concepts and editorial containers
- No scheduling information at this level
- Serve as creative and organizational groupings
- Examples: "Morning News Show", "Evening Drama Series"

**Tier 2: Show Templates**  
- Define HOW productions should be scheduled
- Include recurring patterns (daily, weekly, custom RRULE)
- Specify duration, job requirements, and resource needs
- Act as blueprints for automated schedule generation
- Examples: "Daily News Template (60min)", "Weekly Drama Episode Template"

**Tier 3: Scheduled Events**
- Concrete calendar instances with specific dates and times
- Generated from templates or created as one-off events
- Include actual crew assignments and resource allocations
- Track status (scheduled, in_progress, completed, cancelled)
- Support real-time updates and notifications

## Database Schema

### Core Authentication Tables

**users**
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  avatar text,
  preferences jsonb DEFAULT '{}',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
```

**workspaces**
```sql
CREATE TABLE workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  settings jsonb DEFAULT '{}',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
```

**workspace_memberships**
```sql
CREATE TABLE workspace_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
  status text NOT NULL DEFAULT 'active', -- active, inactive, pending
  invited_by uuid REFERENCES users(id) ON DELETE SET NULL,
  joined_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
```

**workspace_invitations**
```sql
CREATE TABLE workspace_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  invited_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending', -- pending, accepted, declined, expired
  token text NOT NULL UNIQUE,
  expires_at timestamp NOT NULL,
  accepted_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
```

### Production Management Tables

**productions** (Tier 1)
```sql
CREATE TABLE productions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3b82f6',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
```

**show_templates** (Tier 2)
```sql
CREATE TABLE show_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  production_id uuid NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  duration integer NOT NULL DEFAULT 60, -- minutes
  recurring_pattern text DEFAULT '', -- RRULE string
  notes text,
  color text DEFAULT '#3b82f6',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
```

**events** (Tier 3)
```sql
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  production_id uuid REFERENCES productions(id) ON DELETE CASCADE,
  template_id uuid REFERENCES show_templates(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  start_time timestamp NOT NULL,
  end_time timestamp NOT NULL,
  status text NOT NULL DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  notes text,
  color text DEFAULT '#3b82f6',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
```

### Crew and Resource Tables

**jobs**
```sql
CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  department text,
  hourly_rate numeric(10,2),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
```

**crew_members**
```sql
CREATE TABLE crew_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  primary_job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  skills jsonb,
  hourly_rate numeric(10,2),
  availability jsonb DEFAULT '{}',
  notes text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
```

**resources**
```sql
CREATE TABLE resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  description text,
  quantity integer NOT NULL DEFAULT 1,
  hourly_rate numeric(10,2),
  location text,
  notes text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
```

### Template Requirement Tables

**template_required_jobs**
```sql
CREATE TABLE template_required_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES show_templates(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamp NOT NULL DEFAULT now()
);
```

**template_resources**
```sql
CREATE TABLE template_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES show_templates(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamp NOT NULL DEFAULT now()
);
```

### Event Assignment Tables

**event_crew_assignments**
```sql
CREATE TABLE event_crew_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  crew_member_id uuid NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  confirmed_at timestamp,
  notes text,
  created_at timestamp NOT NULL DEFAULT now()
);
```

**event_resource_assignments**
```sql
CREATE TABLE event_resource_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  confirmed_at timestamp,
  notes text,
  created_at timestamp NOT NULL DEFAULT now()
);
```

**notifications**
```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info', -- info, warning, error, success
  read boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now()
);
```

### Essential Database Indexes

```sql
-- Performance indexes for common queries
CREATE INDEX idx_workspace_memberships_user_id ON workspace_memberships(user_id);
CREATE INDEX idx_workspace_memberships_workspace_id ON workspace_memberships(workspace_id);
CREATE INDEX idx_workspace_memberships_status ON workspace_memberships(status);
CREATE INDEX idx_workspace_invitations_token ON workspace_invitations(token);
CREATE INDEX idx_workspace_invitations_email ON workspace_invitations(email);
CREATE INDEX idx_workspace_invitations_status ON workspace_invitations(status);
CREATE INDEX idx_events_workspace_id ON events(workspace_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_crew_members_workspace_id ON crew_members(workspace_id);
CREATE INDEX idx_resources_workspace_id ON resources(workspace_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
```

## API Architecture

### Authentication Endpoints

**POST /api/auth/register**
```json
{
  "name": "Full Name",
  "email": "user@example.com"
}
```

**POST /api/auth/login**
```json
{
  "email": "user@example.com"
}
```

### User-Workspace Management

**GET /api/users/:userId/workspaces**
- Returns all workspaces user belongs to with membership details

**POST /api/workspaces**
```json
{
  "name": "Production Company Name",
  "slug": "unique-slug",
  "description": "Optional description",
  "userId": "creator-user-id"
}
```

**GET /api/workspaces/:workspaceId/members**
- Returns all members of a workspace with their roles

**POST /api/workspaces/:workspaceId/memberships**
```json
{
  "userId": "user-id",
  "role": "member",
  "status": "active"
}
```

### Invitation System

**POST /api/workspaces/:workspaceId/invitations**
```json
{
  "email": "invitee@example.com",
  "role": "member",
  "invitedBy": "inviter-user-id"
}
```

**POST /api/invitations/:token/accept**
```json
{
  "userId": "accepting-user-id"
}
```

**POST /api/invitations/:token/decline**

### Core Resource Management

**GET /api/workspaces/:workspaceId/productions**
**POST /api/workspaces/:workspaceId/productions**
**PUT /api/productions/:id**
**DELETE /api/productions/:id**

**GET /api/workspaces/:workspaceId/show-templates**
**POST /api/workspaces/:workspaceId/show-templates**
**PUT /api/show-templates/:id**
**DELETE /api/show-templates/:id**

**GET /api/workspaces/:workspaceId/events**
**POST /api/workspaces/:workspaceId/events**
**PUT /api/events/:id**
**DELETE /api/events/:id**

**GET /api/workspaces/:workspaceId/crew-members**
**POST /api/workspaces/:workspaceId/crew-members**
**PUT /api/crew-members/:id**
**DELETE /api/crew-members/:id**

**GET /api/workspaces/:workspaceId/jobs**
**POST /api/workspaces/:workspaceId/jobs**
**PUT /api/jobs/:id**
**DELETE /api/jobs/:id**

**GET /api/workspaces/:workspaceId/resources**
**POST /api/workspaces/:workspaceId/resources**
**PUT /api/resources/:id**
**DELETE /api/resources/:id**

## Frontend Architecture

### Page Structure

**Authentication Flow**
- `/register` - User registration page
- `/login` - User login page
- `/workspaces` - Workspace selection/creation page

**Workspace-Scoped Pages**
- `/` - Dashboard with overview metrics
- `/productions` - Manage production concepts (Tier 1)
- `/shows/templates` - Manage show templates (Tier 2)
- `/shows/calendar` - Calendar view of scheduled events (Tier 3)
- `/shows/list` - List view of scheduled events
- `/shows/builder` - Template builder tool
- `/crew-members` - Crew management
- `/crew-schedule` - Crew scheduling view
- `/jobs` - Job role definitions
- `/resources` - Equipment and location management
- `/reports` - Analytics and reporting
- `/settings` - Workspace settings
- `/notifications` - User notifications

### Key Components

**Layout Components**
- `WorkspaceLayout` - Main application shell with navigation
- `Sidebar` - Collapsible navigation menu
- `Header` - Top bar with user menu and workspace switcher

**Form Components**
- `WorkspaceWizard` - Guided workspace setup
- `ShowTemplateModal` - Template creation/editing
- `CrewMemberForm` - Crew member management
- `ResourceForm` - Resource management

**Calendar Components**
- `FullCalendar` integration with multiple views
- `EventModal` - Event creation/editing
- `SchedulingConflictDetection` - Resource conflict alerts

**Data Display Components**
- `DataTable` - Sortable/filterable tables
- `MetricsCards` - Dashboard statistics
- `NotificationCenter` - Real-time notifications

### State Management

**TanStack Query Configuration**
```typescript
// Centralized API request handling
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// API request utility
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}
```

**Query Patterns**
```typescript
// Workspace-scoped data fetching
const { data: productions } = useQuery({
  queryKey: [`/api/workspaces/${workspaceId}/productions`],
  enabled: !!workspaceId,
});

// Optimistic updates with mutations
const createProductionMutation = useMutation({
  mutationFn: async (production: InsertProduction) => {
    const response = await apiRequest("POST", `/api/workspaces/${workspaceId}/productions`, production);
    return await response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/productions`] });
  },
});
```

### Type Safety

**Shared Schema Definition**
```typescript
// shared/schema.ts - Single source of truth for types
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const productions = pgTable("productions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  name: text("name").notNull(),
  // ... other fields
});

// Auto-generated Zod schemas
export const insertProductionSchema = createInsertSchema(productions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// TypeScript types
export type Production = typeof productions.$inferSelect;
export type InsertProduction = z.infer<typeof insertProductionSchema>;
```

**Form Validation**
```typescript
// React Hook Form with Zod validation
const form = useForm<InsertProduction>({
  resolver: zodResolver(insertProductionSchema),
  defaultValues: {
    name: "",
    description: "",
    workspaceId: currentWorkspace.id,
  },
});
```

## Key Features Implementation

### 1. 3-Tier Scheduling System

**Template-Based Event Generation**
```typescript
// Generate recurring events from templates
const generateEventsFromTemplate = async (template: ShowTemplate, startDate: Date, endDate: Date) => {
  const rule = new RRule({
    ...parseRRULE(template.recurringPattern),
    dtstart: startDate,
    until: endDate,
  });
  
  const dates = rule.all();
  const events = dates.map(date => ({
    workspaceId: template.workspaceId,
    productionId: template.productionId,
    templateId: template.id,
    title: template.name,
    startTime: date,
    endTime: new Date(date.getTime() + template.duration * 60000),
    status: 'scheduled',
  }));
  
  return await storage.createMultipleEvents(events);
};
```

### 2. Resource Conflict Detection

**Automatic Conflict Checking**
```typescript
// Check for scheduling conflicts
const checkResourceConflicts = async (eventData: InsertEvent) => {
  const overlappingEvents = await storage.getEventsInTimeRange(
    eventData.workspaceId,
    eventData.startTime,
    eventData.endTime
  );
  
  // Check crew conflicts
  const crewConflicts = await checkCrewAvailability(eventData, overlappingEvents);
  
  // Check resource conflicts  
  const resourceConflicts = await checkResourceAvailability(eventData, overlappingEvents);
  
  return { crewConflicts, resourceConflicts };
};
```

### 3. Real-Time Notifications

**WebSocket Integration** (Future Enhancement)
```typescript
// Real-time updates for schedule changes
const notifyScheduleChange = async (eventId: string, changeType: string) => {
  const event = await storage.getEvent(eventId);
  const workspaceMembers = await storage.getWorkspaceMembers(event.workspaceId);
  
  for (const member of workspaceMembers) {
    await storage.createNotification({
      userId: member.id,
      workspaceId: event.workspaceId,
      title: 'Schedule Updated',
      message: `${event.title} has been ${changeType}`,
      type: 'info',
    });
  }
};
```

### 4. Advanced Calendar Features

**Multiple Calendar Views**
- Month view for overview planning
- Week view for detailed scheduling
- Day view for hour-by-hour management
- List view for sequential event planning
- Resource timeline view for conflict visualization

**FullCalendar Integration**
```typescript
const calendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin, resourceTimelinePlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
  },
  events: async (info) => {
    const events = await fetchEvents(currentWorkspace.id, info.start, info.end);
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.startTime,
      end: event.endTime,
      backgroundColor: event.color,
      extendedProps: event,
    }));
  },
  eventClick: (info) => {
    openEventModal(info.event.extendedProps);
  },
  selectable: true,
  select: (info) => {
    createNewEvent(info.start, info.end);
  },
};
```

## Development Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Neon recommended for production)
- npm or yarn package manager

### Environment Variables
```env
DATABASE_URL=postgresql://user:password@localhost:5432/crewer
PGHOST=localhost
PGPORT=5432
PGDATABASE=crewer
PGUSER=your_user
PGPASSWORD=your_password
SESSION_SECRET=your-session-secret
NODE_ENV=development
```

### Installation Steps

1. **Initialize Project**
```bash
npm create vite@latest crewer --template react-ts
cd crewer
npm install
```

2. **Install Dependencies**
```bash
# Core dependencies
npm install express drizzle-orm @neondatabase/serverless
npm install @tanstack/react-query wouter react-hook-form
npm install @hookform/resolvers zod drizzle-zod
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install tailwindcss @tailwindcss/typography postcss autoprefixer
npm install lucide-react framer-motion next-themes
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid
npm install date-fns rrule

# Development dependencies  
npm install -D @types/express @types/node tsx drizzle-kit
npm install -D @vitejs/plugin-react typescript
npm install -D @types/jest jest ts-jest
```

3. **Database Setup**
```bash
# Push schema to database
npm run db:push

# Generate migrations (if needed)
npm run db:generate
```

4. **Development Server**
```bash
npm run dev
```

### Project Structure
```
crewer/
├── client/src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Shadcn/ui components
│   │   ├── layout/        # Layout components
│   │   ├── forms/         # Form components
│   │   └── workspace/     # Workspace-specific components
│   ├── pages/             # Route components
│   │   ├── auth/          # Authentication pages
│   │   ├── workspaces/    # Workspace management
│   │   ├── shows/         # Show management
│   │   ├── crew-members/  # Crew management
│   │   └── resources/     # Resource management
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   └── types/             # TypeScript type definitions
├── server/
│   ├── db.ts              # Database connection
│   ├── storage.ts         # Data access layer
│   ├── routes.ts          # API routes
│   └── index.ts           # Server entry point
├── shared/
│   └── schema.ts          # Shared database schema and types
├── __tests__/             # Test files
└── package.json
```

## Deployment Considerations

### Production Database
- Use Neon or similar serverless PostgreSQL provider
- Enable connection pooling for high availability
- Set up automated backups
- Configure read replicas for analytics queries

### Environment Configuration
- Separate staging and production environments  
- Use environment-specific database URLs
- Configure session management for production scale
- Set up proper CORS and security headers

### Performance Optimization
- Implement database query optimization
- Add Redis for session storage and caching
- Configure CDN for static assets
- Set up monitoring and alerting

### Security Measures
- Implement proper authentication middleware
- Add rate limiting to prevent abuse
- Validate all inputs on server side
- Use HTTPS in production
- Regular security audits

## Testing Strategy

### Unit Tests
```typescript
// Example crew member validation test
describe('CrewMember Validation', () => {
  it('should validate crew member data', () => {
    const validData = {
      workspaceId: 'uuid',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    };
    
    const result = insertCrewMemberSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});
```

### Integration Tests
```typescript
// Example API endpoint test
describe('Workspace API', () => {
  it('should create workspace with owner membership', async () => {
    const user = await storage.createUser({
      name: 'Test User',
      email: 'test@example.com',
    });
    
    const workspace = await request(app)
      .post('/api/workspaces')
      .send({
        name: 'Test Workspace',
        slug: 'test-workspace',
        userId: user.id,
      })
      .expect(201);
      
    const membership = await storage.getWorkspaceMembership(user.id, workspace.body.id);
    expect(membership.role).toBe('owner');
  });
});
```

## Future Enhancements

### Phase 2: Advanced Features
- **Real-time Collaboration**: WebSocket integration for live updates
- **Advanced Analytics**: Production metrics and performance insights  
- **Mobile App**: React Native companion app for crew members
- **Email Notifications**: SMTP integration for invitation and reminder emails
- **File Management**: Document and asset storage with workspace isolation
- **Budget Tracking**: Cost management and budget allocation features

### Phase 3: Enterprise Features  
- **Single Sign-On**: SAML/OAuth integration for enterprise customers
- **Advanced Permissions**: Fine-grained role-based access control
- **API Rate Limiting**: Usage controls and throttling
- **Audit Logging**: Comprehensive activity tracking
- **Data Export**: CSV/PDF reporting and data portability
- **Third-party Integrations**: Calendar sync, accounting software connections

### Phase 4: AI/ML Features
- **Intelligent Scheduling**: AI-powered conflict resolution and optimization
- **Predictive Analytics**: Forecast crew availability and resource needs  
- **Automated Crew Matching**: ML-based crew recommendations for roles
- **Cost Optimization**: AI-driven budget and resource optimization suggestions

## Success Metrics

### Technical Metrics
- **Performance**: < 200ms API response times
- **Uptime**: 99.9% availability SLA
- **Database**: Query optimization with < 50ms average query time
- **Frontend**: < 3s initial page load time

### Business Metrics  
- **User Engagement**: Daily active users per workspace
- **Feature Adoption**: Usage of 3-tier scheduling system
- **Customer Satisfaction**: Net Promoter Score (NPS)
- **Revenue Metrics**: Monthly recurring revenue (MRR) growth

This comprehensive blueprint provides everything needed to recreate the Crewer TV production management platform from scratch, including detailed technical specifications, implementation guidance, and future enhancement roadmap.