import {
  workspaces,
  users,
  crewMembers,
  jobs,
  resources,
  productions,
  showTemplates,
  events,
  templateRequiredJobs,
  templateResources,
  eventCrewAssignments,
  eventResourceAssignments,
  notifications,
  type Workspace,
  type InsertWorkspace,
  type User,
  type InsertUser,
  type CrewMember,
  type InsertCrewMember,
  type Job,
  type InsertJob,
  type Resource,
  type InsertResource,
  type Production,
  type InsertProduction,
  type ShowTemplate,
  type InsertShowTemplate,
  type Event,
  type InsertScheduledEvent,
  type TemplateRequiredJob,
  type InsertTemplateRequiredJob,
  type TemplateResource,
  type InsertTemplateResource,
  type EventCrewAssignment,
  type InsertEventCrewAssignment,
  type EventResourceAssignment,
  type InsertEventResourceAssignment,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { migration } from "./migration";
import { db } from "./db";
import { eq, and, gte, lte, like, isNotNull, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Workspace CRUD
  getWorkspaces(): Promise<Workspace[]>;
  getWorkspace(id: string): Promise<Workspace | undefined>;
  getWorkspaceBySlug(slug: string): Promise<Workspace | undefined>;
  isWorkspaceSlugAvailable(slug: string): Promise<boolean>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  getMostRecentWorkspace(): Promise<Workspace | undefined>;
  updateWorkspaceLastAccessed(id: string): Promise<void>;
  updateWorkspace(
    id: string,
    workspace: Partial<InsertWorkspace>,
  ): Promise<Workspace | undefined>;
  deleteWorkspace(id: string): Promise<boolean>;

  // User CRUD
  getUsers(workspaceId: string): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Crew Member CRUD
  getCrewMembers(workspaceId: string): Promise<CrewMember[]>;
  getCrewMember(id: string): Promise<CrewMember | undefined>;
  createCrewMember(crewMember: InsertCrewMember): Promise<CrewMember>;
  updateCrewMember(
    id: string,
    crewMember: Partial<InsertCrewMember>,
  ): Promise<CrewMember | undefined>;
  deleteCrewMember(id: string): Promise<boolean>;

  // Job CRUD
  getJobs(workspaceId: string): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, job: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: string): Promise<boolean>;

  // Resource CRUD
  getResources(workspaceId: string): Promise<Resource[]>;
  getResource(id: string): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(
    id: string,
    resource: Partial<InsertResource>,
  ): Promise<Resource | undefined>;
  deleteResource(id: string): Promise<boolean>;

  // Production CRUD
  getProductions(workspaceId: string): Promise<Production[]>;
  getProduction(id: string): Promise<Production | undefined>;
  createProduction(production: InsertProduction): Promise<Production>;
  updateProduction(
    id: string,
    production: Partial<InsertProduction>,
  ): Promise<Production | undefined>;
  deleteProduction(id: string): Promise<boolean>;

  // Show Template CRUD
  getShowTemplates(workspaceId: string): Promise<ShowTemplate[]>;
  getShowTemplate(id: string): Promise<ShowTemplate | undefined>;
  createShowTemplate(template: InsertShowTemplate): Promise<ShowTemplate>;
  updateShowTemplate(
    id: string,
    template: Partial<InsertShowTemplate>,
  ): Promise<ShowTemplate | undefined>;
  deleteShowTemplate(id: string): Promise<boolean>;

  // Event CRUD
  getEvents(workspaceId: string): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertScheduledEvent): Promise<Event>;
  updateEvent(
    id: string,
    event: Partial<InsertScheduledEvent>,
  ): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;

  // Template Requirements CRUD
  getTemplateRequiredJobs(templateId: string): Promise<TemplateRequiredJob[]>;
  createTemplateRequiredJob(
    requiredJob: InsertTemplateRequiredJob,
  ): Promise<TemplateRequiredJob>;
  deleteTemplateRequiredJob(id: string): Promise<boolean>;

  getTemplateResources(templateId: string): Promise<TemplateResource[]>;
  createTemplateResource(
    resource: InsertTemplateResource,
  ): Promise<TemplateResource>;
  deleteTemplateResource(id: string): Promise<boolean>;

  // Event Assignments CRUD
  getEventCrewAssignments(eventId: string): Promise<EventCrewAssignment[]>;
  createEventCrewAssignment(
    assignment: InsertEventCrewAssignment,
  ): Promise<EventCrewAssignment>;
  deleteEventCrewAssignment(id: string): Promise<boolean>;

  getEventResourceAssignments(
    eventId: string,
  ): Promise<EventResourceAssignment[]>;
  createEventResourceAssignment(
    assignment: InsertEventResourceAssignment,
  ): Promise<EventResourceAssignment>;
  deleteEventResourceAssignment(id: string): Promise<boolean>;



  // Notification CRUD
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  deleteNotification(id: string): Promise<boolean>;
}

export class Storage implements IStorage {
  // Workspace operations
  async getWorkspaces(): Promise<Workspace[]> {
    return await db.select().from(workspaces).orderBy(desc(workspaces.createdAt));
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const result = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id))
      .limit(1);
    return result[0];
  }

  async getWorkspaceBySlug(slug: string): Promise<Workspace | undefined> {
    const result = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.slug, slug))
      .limit(1);
    return result[0];
  }

  async isWorkspaceSlugAvailable(slug: string): Promise<boolean> {
    const result = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.slug, slug))
      .limit(1);
    return result.length === 0;
  }

  async createWorkspace(workspace: InsertWorkspace): Promise<Workspace> {
    const [result] = await db.insert(workspaces).values(workspace).returning();
    return result;
  }

  async getMostRecentWorkspace(): Promise<Workspace | undefined> {
    const result = await db
      .select()
      .from(workspaces)
      .orderBy(desc(workspaces.updatedAt))
      .limit(1);
    return result[0];
  }

  async updateWorkspaceLastAccessed(id: string): Promise<void> {
    await db
      .update(workspaces)
      .set({ updatedAt: new Date() })
      .where(eq(workspaces.id, id));
  }

  async updateWorkspace(
    id: string,
    workspace: Partial<InsertWorkspace>,
  ): Promise<Workspace | undefined> {
    const [result] = await db
      .update(workspaces)
      .set(workspace)
      .where(eq(workspaces.id, id))
      .returning();
    return result;
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    const result = await db.delete(workspaces).where(eq(workspaces.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // User operations
  async getUsers(workspaceId: string): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, username))
      .limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const [result] = await db.insert(users).values(user).returning();
    return result;
  }

  async updateUser(
    id: string,
    user: Partial<InsertUser>,
  ): Promise<User | undefined> {
    const [result] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return result;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Crew Member operations
  async getCrewMembers(workspaceId: string): Promise<CrewMember[]> {
    return await db
      .select()
      .from(crewMembers)
      .where(eq(crewMembers.workspaceId, workspaceId));
  }

  async getCrewMember(id: string): Promise<CrewMember | undefined> {
    const result = await db
      .select()
      .from(crewMembers)
      .where(eq(crewMembers.id, id))
      .limit(1);
    return result[0];
  }

  async createCrewMember(crewMember: InsertCrewMember): Promise<CrewMember> {
    const [result] = await db
      .insert(crewMembers)
      .values(crewMember)
      .returning();
    return result;
  }

  async updateCrewMember(
    id: string,
    crewMember: Partial<InsertCrewMember>,
  ): Promise<CrewMember | undefined> {
    const [result] = await db
      .update(crewMembers)
      .set(crewMember)
      .where(eq(crewMembers.id, id))
      .returning();
    return result;
  }

  async deleteCrewMember(id: string): Promise<boolean> {
    const result = await db.delete(crewMembers).where(eq(crewMembers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Job operations
  async getJobs(workspaceId: string): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.workspaceId, workspaceId));
  }

  async getJob(id: string): Promise<Job | undefined> {
    const result = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, id))
      .limit(1);
    return result[0];
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [result] = await db.insert(jobs).values(job).returning();
    return result;
  }

  async updateJob(id: string, job: Partial<InsertJob>): Promise<Job | undefined> {
    const [result] = await db
      .update(jobs)
      .set(job)
      .where(eq(jobs.id, id))
      .returning();
    return result;
  }

  async deleteJob(id: string): Promise<boolean> {
    const result = await db.delete(jobs).where(eq(jobs.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Resource operations
  async getResources(workspaceId: string): Promise<Resource[]> {
    return await db
      .select()
      .from(resources)
      .where(eq(resources.workspaceId, workspaceId));
  }

  async getResource(id: string): Promise<Resource | undefined> {
    const result = await db
      .select()
      .from(resources)
      .where(eq(resources.id, id))
      .limit(1);
    return result[0];
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [result] = await db.insert(resources).values(resource).returning();
    return result;
  }

  async updateResource(
    id: string,
    resource: Partial<InsertResource>,
  ): Promise<Resource | undefined> {
    const [result] = await db
      .update(resources)
      .set(resource)
      .where(eq(resources.id, id))
      .returning();
    return result;
  }

  async deleteResource(id: string): Promise<boolean> {
    const result = await db.delete(resources).where(eq(resources.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Production operations
  async getProductions(workspaceId: string): Promise<Production[]> {
    return await db
      .select()
      .from(productions)
      .where(eq(productions.workspaceId, workspaceId))
      .orderBy(desc(productions.createdAt));
  }

  async getProduction(id: string): Promise<Production | undefined> {
    const result = await db
      .select()
      .from(productions)
      .where(eq(productions.id, id))
      .limit(1);
    return result[0];
  }

  async createProduction(production: InsertProduction): Promise<Production> {
    const [result] = await db
      .insert(productions)
      .values(production)
      .returning();
    return result;
  }

  async updateProduction(
    id: string,
    production: Partial<InsertProduction>,
  ): Promise<Production | undefined> {
    const [result] = await db
      .update(productions)
      .set(production)
      .where(eq(productions.id, id))
      .returning();
    return result;
  }

  async deleteProduction(id: string): Promise<boolean> {
    const result = await db.delete(productions).where(eq(productions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Show Template operations
  async getShowTemplates(workspaceId: string): Promise<ShowTemplate[]> {
    return await db
      .select()
      .from(showTemplates)
      .where(eq(showTemplates.workspaceId, workspaceId))
      .orderBy(desc(showTemplates.createdAt));
  }

  async getShowTemplatesByProduction(productionId: string): Promise<ShowTemplate[]> {
    return await db
      .select()
      .from(showTemplates)
      .where(eq(showTemplates.productionId, productionId))
      .orderBy(desc(showTemplates.createdAt));
  }

  async getShowTemplate(id: string): Promise<ShowTemplate | undefined> {
    const result = await db
      .select()
      .from(showTemplates)
      .where(eq(showTemplates.id, id))
      .limit(1);
    return result[0];
  }

  async createShowTemplate(template: InsertShowTemplate): Promise<ShowTemplate> {
    const [result] = await db
      .insert(showTemplates)
      .values(template)
      .returning();
    return result;
  }

  async updateShowTemplate(
    id: string,
    template: Partial<InsertShowTemplate>,
  ): Promise<ShowTemplate | undefined> {
    const [result] = await db
      .update(showTemplates)
      .set(template)
      .where(eq(showTemplates.id, id))
      .returning();
    return result;
  }

  async deleteShowTemplate(id: string): Promise<boolean> {
    const result = await db.delete(showTemplates).where(eq(showTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Event operations
  async getEvents(workspaceId: string): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.workspaceId, workspaceId))
      .orderBy(events.startTime);
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const result = await db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1);
    return result[0];
  }

  async createEvent(event: InsertScheduledEvent): Promise<Event> {
    const [result] = await db
      .insert(events)
      .values(event)
      .returning();
    return result;
  }

  async updateEvent(
    id: string,
    event: Partial<InsertScheduledEvent>,
  ): Promise<Event | undefined> {
    const [result] = await db
      .update(events)
      .set(event)
      .where(eq(events.id, id))
      .returning();
    return result;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Template Required Jobs
  async getTemplateRequiredJobs(templateId: string): Promise<TemplateRequiredJob[]> {
    return await db
      .select()
      .from(templateRequiredJobs)
      .where(eq(templateRequiredJobs.templateId, templateId));
  }

  async createTemplateRequiredJob(
    requiredJob: InsertTemplateRequiredJob,
  ): Promise<TemplateRequiredJob> {
    const [result] = await db
      .insert(templateRequiredJobs)
      .values(requiredJob)
      .returning();
    return result;
  }

  async deleteTemplateRequiredJob(id: string): Promise<boolean> {
    const result = await db
      .delete(templateRequiredJobs)
      .where(eq(templateRequiredJobs.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Template Resources
  async getTemplateResources(templateId: string): Promise<TemplateResource[]> {
    return await db
      .select()
      .from(templateResources)
      .where(eq(templateResources.templateId, templateId));
  }

  async createTemplateResource(
    resource: InsertTemplateResource,
  ): Promise<TemplateResource> {
    const [result] = await db
      .insert(templateResources)
      .values(resource)
      .returning();
    return result;
  }

  async deleteTemplateResource(id: string): Promise<boolean> {
    const result = await db
      .delete(templateResources)
      .where(eq(templateResources.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Event Crew Assignments
  async getEventCrewAssignments(eventId: string): Promise<EventCrewAssignment[]> {
    return await db
      .select()
      .from(eventCrewAssignments)
      .where(eq(eventCrewAssignments.eventId, eventId));
  }

  async createEventCrewAssignment(
    assignment: InsertEventCrewAssignment,
  ): Promise<EventCrewAssignment> {
    const [result] = await db
      .insert(eventCrewAssignments)
      .values(assignment)
      .returning();
    return result;
  }

  async deleteEventCrewAssignment(id: string): Promise<boolean> {
    const result = await db
      .delete(eventCrewAssignments)
      .where(eq(eventCrewAssignments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Event Resource Assignments
  async getEventResourceAssignments(
    eventId: string,
  ): Promise<EventResourceAssignment[]> {
    return await db
      .select()
      .from(eventResourceAssignments)
      .where(eq(eventResourceAssignments.eventId, eventId));
  }

  async createEventResourceAssignment(
    assignment: InsertEventResourceAssignment,
  ): Promise<EventResourceAssignment> {
    const [result] = await db
      .insert(eventResourceAssignments)
      .values(assignment)
      .returning();
    return result;
  }

  async deleteEventResourceAssignment(id: string): Promise<boolean> {
    const result = await db
      .delete(eventResourceAssignments)
      .where(eq(eventResourceAssignments.id, id));
    return (result.rowCount ?? 0) > 0;
  }



  // Notification operations
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [result] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return result;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  }

  async deleteNotification(id: string): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new Storage();

// Clear all demo data
export async function clearDemoData(): Promise<void> {
  console.log("🧹 Clearing existing demo data...");
  
  // Clear in dependency order (children first)
  await db.delete(eventResourceAssignments);
  await db.delete(eventCrewAssignments);
  await db.delete(templateResources);
  await db.delete(templateRequiredJobs);
  await db.delete(events);
  await db.delete(showTemplates);
  await db.delete(productions);
  await db.delete(notifications);
  // await db.delete(shows); // removed - no shows table exists
  await db.delete(resources);
  await db.delete(jobs);
  await db.delete(crewMembers);
  await db.delete(users);
  await db.delete(workspaces);

  console.log("✅ Demo data cleared successfully!");
}

// Seed database with demo data
export async function seedDemoData(): Promise<void> {
  await clearDemoData();

  // Create workspaces
  const [workspace1] = await db
    .insert(workspaces)
    .values([
      {
        name: "BBC Studios North",
        slug: "bbc-studios-north",
      },
    ])
    .returning();

  // Create users
  const [user1] = await db
    .insert(users)
    .values([
      {
        email: "admin@bbc.com",
        name: "Production Manager",
        avatar: null,
      },
    ])
    .returning();

  // Create jobs
  const [job1, job2, job3] = await db
    .insert(jobs)
    .values([
      {
        workspaceId: workspace1.id,
        title: "Camera Operator",
        description: "Operates broadcast cameras",
        department: "Camera",
      },
      {
        workspaceId: workspace1.id,
        title: "Audio Engineer",
        description: "Manages audio systems",
        department: "Audio",
      },
      {
        workspaceId: workspace1.id,
        title: "Director",
        description: "Directs the show",
        department: "Direction",
      },
    ])
    .returning();

  // Create resources
  const [resource1, resource2] = await db
    .insert(resources)
    .values([
      {
        workspaceId: workspace1.id,
        name: "Studio A",
        type: "location",
        description: "Main production studio",
      },
      {
        workspaceId: workspace1.id,
        name: "Camera 1",
        type: "equipment",
        description: "Primary broadcast camera",
      },
    ])
    .returning();

  // Create crew members
  const [crew1, crew2] = await db
    .insert(crewMembers)
    .values([
      {
        workspaceId: workspace1.id,
        firstName: "John",
        lastName: "Smith",
        email: "john@bbc.com",
        phone: "+44 123 456 7890",
        primaryJobId: job1.id,
      },
      {
        workspaceId: workspace1.id,
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah@bbc.com",
        phone: "+44 987 654 3210",
        primaryJobId: job2.id,
      },
    ])
    .returning();

  // Create production
  const [production1] = await db
    .insert(productions)
    .values([
      {
        workspaceId: workspace1.id,
        name: "Morning News Live",
        description: "Daily morning news broadcast",
        color: "#2563eb",
      },
    ])
    .returning();

  // Create show template
  const [template1] = await db
    .insert(showTemplates)
    .values([
      {
        workspaceId: workspace1.id,
        productionId: production1.id,
        name: "Weekday Morning News",
        description: "Monday to Friday morning news show",
        duration: 60,
        recurringPattern: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
      },
    ])
    .returning();

  // Create template requirements
  await db.insert(templateRequiredJobs).values([
    {
      workspaceId: workspace1.id,
      templateId: template1.id,
      jobId: job1.id,
      quantity: 2,
      notes: "Two camera operators needed",
    },
    {
      workspaceId: workspace1.id,
      templateId: template1.id,
      jobId: job2.id,
      quantity: 1,
      notes: "One audio engineer",
    },
  ]);

  await db.insert(templateResources).values([
    {
      workspaceId: workspace1.id,
      templateId: template1.id,
      resourceId: resource1.id,
      quantity: 1,
      notes: "Main studio required",
    },
  ]);

  // Create some scheduled events
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [event1] = await db
    .insert(events)
    .values([
      {
        workspaceId: workspace1.id,
        productionId: production1.id,
        templateId: template1.id,
        title: "Morning News - Today",
        description: "Today's morning news broadcast",
        startTime: new Date(today.setHours(8, 0, 0, 0)),
        endTime: new Date(today.setHours(9, 0, 0, 0)),
        status: "scheduled",
      },
    ])
    .returning();

  // Create event crew assignments
  await db.insert(eventCrewAssignments).values([
    {
      workspaceId: workspace1.id,
      eventId: event1.id,
      crewMemberId: crew1.id,
      jobId: job1.id,
    },
    {
      workspaceId: workspace1.id,
      eventId: event1.id,
      crewMemberId: crew2.id,
      jobId: job2.id,
    },
  ]);

  // Create notifications
  await db.insert(notifications).values([
    {
      userId: user1.id,
      workspaceId: workspace1.id,
      title: "New Show Scheduled",
      message: "Morning News - Today has been scheduled for 8:00 AM",
      type: "info",
    },
  ]);

  console.log("✅ Demo data seeded successfully!");
}

export async function createEnhancedDemoData(): Promise<void> {
  console.log("🔄 Creating enhanced demo data...");
  
  try {
    await seedDemoData();
    console.log("✅ Enhanced demo data created successfully!");
    console.log("📊 Dashboard now includes:");
    console.log("   • 3 job types with crew assignments");
    console.log("   • 2 resource types (studio and equipment)");
    console.log("   • Production with template and scheduled events");
    console.log("   • Template requirements and event assignments");
  } catch (error) {
    console.error("❌ Failed to create enhanced demo data:", error);
  }
}