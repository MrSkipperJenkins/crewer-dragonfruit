# Crewer - Crew Management System

## Overview
Crewer is a multi-tenant SaaS platform designed for television production companies to manage crews, shows, and resources. It aims to streamline crew scheduling, show assignments, and resource utilization for TV productions. The core vision is to provide a robust system for organizing complex production workflows.

## User Preferences
- **Communication Style**: Simple, everyday language
- **Technical Approach**: Focus on TV production industry needs
- **UI/UX**: Professional, clean interface suitable for broadcast professionals

## System Architecture
Crewer uses a monolithic full-stack architecture.
- **Frontend**: React with TypeScript, Vite, Wouter for routing, TanStack Query for state management, React Hook Form with Zod for forms, Shadcn/ui for components, and FullCalendar for scheduling.
- **Backend**: Express.js with TypeScript, Drizzle ORM, and a RESTful API.
- **Database**: PostgreSQL with Drizzle ORM.
- **Styling**: Tailwind CSS.
- **Core Design Pattern**: A revolutionary 3-tier scheduling architecture that separates abstract production concepts from concrete scheduling instances, enabling powerful workflow automation and flexible resource planning.

### 3-TIER SCHEDULING ARCHITECTURE DETAILED

#### Tier 1: Productions (High-Level Content Containers)

**Purpose**: Productions represent the abstract concept of a show or series - the "what" without any "when".

**Database Table**: `productions`
```sql
- id: uuid (primary key)
- workspace_id: uuid (tenant isolation)
- name: text (e.g., "Morning News Live", "Weekly Sports Talk")
- description: text (show concept, format, target audience)
- created_at, updated_at: timestamps
```

**Key Characteristics**:
- No scheduling information (no dates, times, or crew assignments)
- Acts as a container for multiple show templates
- Represents the editorial/creative concept
- Can have multiple templates for different scheduling patterns

#### Tier 2: Show Templates (Scheduling Blueprints)

**Purpose**: Templates define HOW a production should be scheduled - the "when" pattern and resource requirements.

**Database Table**: `show_templates`
```sql
- id: uuid (primary key)
- workspace_id: uuid (tenant isolation)
- production_id: uuid (links to production)
- name: text (e.g., "Weekday Morning Show", "Weekend Edition")
- description: text (scheduling context)
- duration_minutes: integer (default show length)
- recurring_pattern: jsonb (rrule-based scheduling rules)
- is_recurring: boolean (template vs one-off flag)
- created_at, updated_at: timestamps
```

**Supporting Tables for Requirements**:
- `template_required_jobs`: Job roles needed (cameraman x2, director x1, etc.)
- `template_resources`: Equipment/location needs (studio A, camera kit x3, etc.)

**Key Characteristics**:
- Contains recurring patterns using RRule specification
- Defines resource and crew requirements at template level
- No specific dates - only patterns and requirements
- Can generate multiple scheduled events from single template

#### Tier 3: Scheduled Events (Concrete Calendar Instances)

**Purpose**: Events are the actual calendar items with specific dates, times, and assigned crew/resources.

**Database Table**: `events` (formerly scheduled_events)
```sql
- id: uuid (primary key)
- workspace_id: uuid (tenant isolation)
- template_id: uuid (optional - can be one-off event)
- production_id: uuid (links to production concept)
- title: text (specific episode/instance name)
- description: text (episode-specific notes)
- start_time: timestamp (exact start date/time)
- end_time: timestamp (exact end date/time)
- status: text (scheduled, in_progress, completed, cancelled)
- location: text (specific venue/studio)
- is_template_instance: boolean (generated vs manual)
- recurrence_id: text (links recurring instances)
- created_at, updated_at: timestamps
```

**Supporting Tables for Assignments**:
- `event_crew_assignments`: Actual crew member assignments to specific events
- `event_resource_assignments`: Actual resource bookings for specific events

**Key Characteristics**:
- Contains specific dates, times, and locations
- Has concrete crew and resource assignments
- Can be generated from templates OR created as one-off events
- Tracks episode-specific information and status

### Workflow Examples

#### Example 1: Weekly News Show Setup

**UX Perspective (What Users See)**:

1. **Create Production**: User creates "Channel 7 Morning News" production
   - Sets description: "Daily morning news program covering local and national stories"
   - No scheduling information entered yet

2. **Create Show Template**: User creates "Weekday Morning Edition" template
   - Links to "Channel 7 Morning News" production
   - Sets duration: 120 minutes
   - Sets recurring pattern: Monday-Friday at 6:00 AM
   - Defines requirements:
     - Jobs: News Anchor x2, Camera Operator x3, Audio Tech x1, Director x1
     - Resources: Studio A, Camera Kit x3, Teleprompter x2

3. **Generate Schedule**: User clicks "Generate Episodes" for next 3 months
   - System creates 65+ individual scheduled events (M-F for 3 months)
   - Each event has specific date/time (e.g., "March 15, 2025 6:00-8:00 AM")
   - Each event inherits job/resource requirements from template

4. **Staff Episodes**: User assigns actual crew to specific episodes
   - Assigns "Sarah Johnson" (crew member) to "News Anchor" role for March 15 episode
   - Books "Studio A" for March 15, 6:00-8:00 AM

**Under the Hood (Database Operations)**:

```sql
-- Step 1: Create Production
INSERT INTO productions (id, workspace_id, name, description)
VALUES ('prod-123', 'ws-456', 'Channel 7 Morning News', 'Daily morning news...');

-- Step 2: Create Template
INSERT INTO show_templates (id, workspace_id, production_id, name, duration_minutes, recurring_pattern)
VALUES ('tmpl-789', 'ws-456', 'prod-123', 'Weekday Morning Edition', 120, 
        '{"freq": "WEEKLY", "byday": ["MO","TU","WE","TH","FR"], "byhour": [6]}');

-- Step 2b: Define Template Requirements
INSERT INTO template_required_jobs (template_id, job_id, quantity)
VALUES ('tmpl-789', 'job-anchor', 2), ('tmpl-789', 'job-camera', 3);

-- Step 3: Generate Events (done by system)
INSERT INTO events (id, workspace_id, template_id, production_id, title, start_time, end_time)
VALUES ('evt-001', 'ws-456', 'tmpl-789', 'prod-123', 'Morning News - March 15', 
        '2025-03-15 06:00:00', '2025-03-15 08:00:00');

-- Step 4: Assign Crew (done by user)
INSERT INTO event_crew_assignments (event_id, crew_member_id, job_id)
VALUES ('evt-001', 'crew-sarah', 'job-anchor');
```

#### Example 2: Special One-Off Event

**UX Perspective**:
1. User creates "Election Night Special" production
2. User creates single event directly (no template needed)
3. User assigns crew and resources to specific event

**Under the Hood**:
```sql
-- Create production and event directly
INSERT INTO productions VALUES ('prod-election', 'ws-456', 'Election Night Special', ...);
INSERT INTO events (template_id, production_id, ...) 
VALUES (NULL, 'prod-election', ...); -- template_id is NULL for one-off events
```

### Architecture Benefits

1. **Separation of Concerns**: Editorial (productions) separate from scheduling (templates) separate from execution (events)
2. **Powerful Automation**: Generate hundreds of episodes from single template, bulk crew assignment based on template requirements
3. **Flexible Scheduling**: Support both recurring series and one-off specials, easy schedule modifications without losing template logic
4. **Resource Planning**: Template-level requirements enable capacity planning, event-level assignments enable conflict detection
5. **Workflow Efficiency**: Users define requirements once and apply to many episodes, automated schedule generation reduces manual work, clear separation enables specialized UI workflows

### Implementation Details

#### Database Relationships
```sql
-- Core hierarchy
productions 1:many show_templates 1:many events

-- Template requirements (blueprint level)
show_templates 1:many template_required_jobs many:1 jobs
show_templates 1:many template_resources many:1 resources

-- Event assignments (concrete level)  
events 1:many event_crew_assignments many:1 crew_members
events 1:many event_crew_assignments many:1 jobs
events 1:many event_resource_assignments many:1 resources
```

#### API Design Patterns
The 3-tier architecture is reflected in the API structure:
```typescript
// Production operations
GET /api/workspaces/{id}/productions
POST /api/workspaces/{id}/productions

// Template operations (scoped to production)
GET /api/productions/{id}/templates
POST /api/productions/{id}/templates

// Event operations (can be scoped to template or workspace)
GET /api/templates/{id}/events          // Events from template
GET /api/workspaces/{id}/events         // All events in workspace
POST /api/workspaces/{id}/events        // Create one-off event
POST /api/templates/{id}/generate       // Generate events from template
```
- **Multi-Tenancy**: Implemented via workspace-based tenant isolation with URL-based routing (`/workspaces/{slug}`) and data scoping.
- **Data Flow**: Authentication is workspace-based. All queries are scoped to the current workspace. Utilizes TanStack Query for real-time updates and cache invalidation.

## External Dependencies
- **Database**: Neon Database (PostgreSQL-compatible, serverless)
- **ORM**: drizzle-orm
- **Frontend State Management**: @tanstack/react-query
- **UI Components**: @radix-ui/*, shadcn/ui
- **Calendar**: @fullcalendar/*
- **Routing**: wouter
- **Styling**: tailwindcss
- **Form Validation**: @hookform/resolvers
- **Build Tool**: vite

## Recent Changes

### August 13, 2025 - Crew Members Schema Fix and Documentation Update

1. **Fixed Crew Members Database Error**: Resolved critical JavaScript error preventing crew schedule page from loading
   - **Root Cause**: Crew schedule component was calling `.split()` on `member.name` field, but crew members schema uses `firstName` and `lastName` fields
   - **Solution**: Updated crew schedule component to use `${member.firstName || ''} ${member.lastName || ''}` pattern
   - **Status**: Crew schedule page now loads without errors

2. **Enhanced Documentation**: Added comprehensive 3-tier architecture documentation to replit.md
   - **Added Detailed Schema Documentation**: Complete database table structures, relationships, and field descriptions
   - **Added Workflow Examples**: Real-world examples showing both UX perspective and database operations
   - **Added Implementation Details**: API patterns, database relationships, and architectural benefits
   - **Status**: Project now has complete technical documentation for onboarding and development

3. **Database Schema Completion**: Fixed missing columns in jobs table
   - **Added Missing Columns**: pay_rate, requirements, updated_at columns to jobs table
   - **Fixed API Compatibility**: Jobs API endpoints now function correctly with complete schema
   - **Status**: All database tables now match schema definitions

### Previous Notable Changes

1. **July 15, 2025**: Critical application stabilization, database schema fixes, backend route cleanup
2. **July 2, 2025**: Complete schema cleanup, removed legacy tables, streamlined 3-tier architecture
3. **June 24, 2025**: Major architecture overhaul with 3-tier scheduling system implementation