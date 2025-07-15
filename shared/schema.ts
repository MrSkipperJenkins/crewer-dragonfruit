import { pgTable, text, timestamp, integer, boolean, uuid, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Core workspace and user tables
export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // info, warning, error, success
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Production management tables
export const productions = pgTable("productions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#3b82f6"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const showTemplates = pgTable("show_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  productionId: uuid("production_id").notNull().references(() => productions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  duration: integer("duration").notNull().default(60), // minutes
  recurringPattern: text("recurring_pattern").default(""), // RRULE string
  notes: text("notes"),
  color: text("color").default("#3b82f6"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  productionId: uuid("production_id").references(() => productions.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").references(() => showTemplates.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, in_progress, completed, cancelled
  notes: text("notes"),
  color: text("color").default("#3b82f6"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Job and resource management
export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  department: text("department"),
  payRate: integer("pay_rate"),
  requirements: text("requirements"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const resources = pgTable("resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // equipment, vehicle, location, etc.
  description: text("description"),
  quantity: integer("quantity").notNull().default(1),
  costPerHour: integer("cost_per_hour"),
  availability: text("availability"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const crewMembers = pgTable("crew_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  primaryJobId: uuid("primary_job_id").references(() => jobs.id, { onDelete: "set null" }),
  skills: text("skills").array(),
  hourlyRate: integer("hourly_rate"),
  availability: jsonb("availability").default({}),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Template requirements (blueprint level)
export const templateRequiredJobs = pgTable("template_required_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").notNull().references(() => showTemplates.id, { onDelete: "cascade" }),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const templateResources = pgTable("template_resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").notNull().references(() => showTemplates.id, { onDelete: "cascade" }),
  resourceId: uuid("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Event assignments (concrete level)
export const eventCrewAssignments = pgTable("event_crew_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  crewMemberId: uuid("crew_member_id").notNull().references(() => crewMembers.id, { onDelete: "cascade" }),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  confirmedAt: timestamp("confirmed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventResourceAssignments = pgTable("event_resource_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  resourceId: uuid("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  confirmedAt: timestamp("confirmed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const workspaceRelations = relations(workspaces, ({ many }) => ({
  productions: many(productions),
  showTemplates: many(showTemplates),
  events: many(events),
  jobs: many(jobs),
  resources: many(resources),
  crewMembers: many(crewMembers),
  notifications: many(notifications),
}));

export const productionRelations = relations(productions, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [productions.workspaceId],
    references: [workspaces.id],
  }),
  showTemplates: many(showTemplates),
  events: many(events),
}));

export const showTemplateRelations = relations(showTemplates, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [showTemplates.workspaceId],
    references: [workspaces.id],
  }),
  production: one(productions, {
    fields: [showTemplates.productionId],
    references: [productions.id],
  }),
  events: many(events),
  requiredJobs: many(templateRequiredJobs),
  resources: many(templateResources),
}));

export const eventRelations = relations(events, ({ one, many }) => ({
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

export const jobRelations = relations(jobs, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [jobs.workspaceId],
    references: [workspaces.id],
  }),
  crewMembers: many(crewMembers),
  templateRequiredJobs: many(templateRequiredJobs),
  eventCrewAssignments: many(eventCrewAssignments),
}));

export const resourceRelations = relations(resources, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [resources.workspaceId],
    references: [workspaces.id],
  }),
  templateResources: many(templateResources),
  eventResourceAssignments: many(eventResourceAssignments),
}));

export const crewMemberRelations = relations(crewMembers, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [crewMembers.workspaceId],
    references: [workspaces.id],
  }),
  primaryJob: one(jobs, {
    fields: [crewMembers.primaryJobId],
    references: [jobs.id],
  }),
  eventCrewAssignments: many(eventCrewAssignments),
}));

export const templateRequiredJobRelations = relations(templateRequiredJobs, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [templateRequiredJobs.workspaceId],
    references: [workspaces.id],
  }),
  template: one(showTemplates, {
    fields: [templateRequiredJobs.templateId],
    references: [showTemplates.id],
  }),
  job: one(jobs, {
    fields: [templateRequiredJobs.jobId],
    references: [jobs.id],
  }),
}));

export const templateResourceRelations = relations(templateResources, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [templateResources.workspaceId],
    references: [workspaces.id],
  }),
  template: one(showTemplates, {
    fields: [templateResources.templateId],
    references: [showTemplates.id],
  }),
  resource: one(resources, {
    fields: [templateResources.resourceId],
    references: [resources.id],
  }),
}));

export const eventCrewAssignmentRelations = relations(eventCrewAssignments, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [eventCrewAssignments.workspaceId],
    references: [workspaces.id],
  }),
  event: one(events, {
    fields: [eventCrewAssignments.eventId],
    references: [events.id],
  }),
  crewMember: one(crewMembers, {
    fields: [eventCrewAssignments.crewMemberId],
    references: [crewMembers.id],
  }),
  job: one(jobs, {
    fields: [eventCrewAssignments.jobId],
    references: [jobs.id],
  }),
}));

export const eventResourceAssignmentRelations = relations(eventResourceAssignments, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [eventResourceAssignments.workspaceId],
    references: [workspaces.id],
  }),
  event: one(events, {
    fields: [eventResourceAssignments.eventId],
    references: [events.id],
  }),
  resource: one(resources, {
    fields: [eventResourceAssignments.resourceId],
    references: [resources.id],
  }),
}));

export const userRelations = relations(users, ({ many }) => ({
  notifications: many(notifications),
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [notifications.workspaceId],
    references: [workspaces.id],
  }),
}));

// Zod schemas for validation
export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertProductionSchema = createInsertSchema(productions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShowTemplateSchema = createInsertSchema(showTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCrewMemberSchema = createInsertSchema(crewMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTemplateRequiredJobSchema = createInsertSchema(templateRequiredJobs).omit({
  id: true,
  createdAt: true,
});

export const insertTemplateResourceSchema = createInsertSchema(templateResources).omit({
  id: true,
  createdAt: true,
});

export const insertEventCrewAssignmentSchema = createInsertSchema(eventCrewAssignments).omit({
  id: true,
  createdAt: true,
});

export const insertEventResourceAssignmentSchema = createInsertSchema(eventResourceAssignments).omit({
  id: true,
  createdAt: true,
});

// TypeScript types
export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Production = typeof productions.$inferSelect;
export type InsertProduction = z.infer<typeof insertProductionSchema>;

export type ShowTemplate = typeof showTemplates.$inferSelect;
export type InsertShowTemplate = z.infer<typeof insertShowTemplateSchema>;

export type Event = typeof events.$inferSelect;
export type InsertScheduledEvent = z.infer<typeof insertEventSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type CrewMember = typeof crewMembers.$inferSelect;
export type InsertCrewMember = z.infer<typeof insertCrewMemberSchema>;

export type TemplateRequiredJob = typeof templateRequiredJobs.$inferSelect;
export type InsertTemplateRequiredJob = z.infer<typeof insertTemplateRequiredJobSchema>;

export type TemplateResource = typeof templateResources.$inferSelect;
export type InsertTemplateResource = z.infer<typeof insertTemplateResourceSchema>;

export type EventCrewAssignment = typeof eventCrewAssignments.$inferSelect;
export type InsertEventCrewAssignment = z.infer<typeof insertEventCrewAssignmentSchema>;

export type EventResourceAssignment = typeof eventResourceAssignments.$inferSelect;
export type InsertEventResourceAssignment = z.infer<typeof insertEventResourceAssignmentSchema>;