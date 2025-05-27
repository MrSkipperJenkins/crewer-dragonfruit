import { pgTable, text, serial, uuid, timestamp, boolean, unique, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Workspace - A tenant in the system
export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({
  id: true,
  createdAt: true,
});

// User - A user in the system
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Crew Member - A person who can be assigned to a show
export const crewMembers = pgTable("crew_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  title: text("title").notNull(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCrewMemberSchema = createInsertSchema(crewMembers).omit({
  id: true,
  createdAt: true,
});

// Job - A role that can be assigned to a show
export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
});

// Crew Member Job - Links crew members to jobs they can perform
export const crewMemberJobs = pgTable("crew_member_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  crewMemberId: uuid("crew_member_id").references(() => crewMembers.id).notNull(),
  jobId: uuid("job_id").references(() => jobs.id).notNull(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    uniq: unique().on(table.crewMemberId, table.jobId),
  };
});

export const insertCrewMemberJobSchema = createInsertSchema(crewMemberJobs).omit({
  id: true,
  createdAt: true,
});

// Resource - Studios, control rooms, equipment
export const resources = pgTable("resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // studio, control_room, equipment
  description: text("description"),
  workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
});

// Show Category
export const showCategories = pgTable("show_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(), // Color code for the category
  workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertShowCategorySchema = createInsertSchema(showCategories).omit({
  id: true,
  createdAt: true,
});

// Show - A scheduled event
export const shows = pgTable("shows", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  recurringPattern: text("recurring_pattern"), // Optional pattern for recurring shows
  notes: text("notes"),
  status: text("status").notNull().default("draft"), // draft, scheduled, in_progress, completed, cancelled
  workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertShowSchema = createInsertSchema(shows).omit({
  id: true,
  createdAt: true,
});

// Show Category Assignment - Links shows to categories (tags)
export const showCategoryAssignments = pgTable("show_category_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  showId: uuid("show_id").references(() => shows.id).notNull(),
  categoryId: uuid("category_id").references(() => showCategories.id).notNull(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    uniq: unique().on(table.showId, table.categoryId),
  };
});

export const insertShowCategoryAssignmentSchema = createInsertSchema(showCategoryAssignments).omit({
  id: true,
  createdAt: true,
});

// Required Job - Jobs required for a show
export const requiredJobs = pgTable("required_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  showId: uuid("show_id").references(() => shows.id).notNull(),
  jobId: uuid("job_id").references(() => jobs.id).notNull(),
  quantity: serial("quantity").notNull().default(1),
  notes: text("notes"),
  workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRequiredJobSchema = createInsertSchema(requiredJobs).omit({
  id: true,
  createdAt: true,
});

// Show Resource - Links shows to resources
export const showResources = pgTable("show_resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  showId: uuid("show_id").references(() => shows.id).notNull(),
  resourceId: uuid("resource_id").references(() => resources.id).notNull(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    uniq: unique().on(table.showId, table.resourceId),
  };
});

export const insertShowResourceSchema = createInsertSchema(showResources).omit({
  id: true,
  createdAt: true,
});

// Crew Assignment - Links crew members to shows for specific jobs
export const crewAssignments = pgTable("crew_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  showId: uuid("show_id").references(() => shows.id).notNull(),
  crewMemberId: uuid("crew_member_id").references(() => crewMembers.id).notNull(),
  jobId: uuid("job_id").references(() => jobs.id).notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, declined
  workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCrewAssignmentSchema = createInsertSchema(crewAssignments).omit({
  id: true,
  createdAt: true,
});

// Crew Schedule - Regular availability
export const crewSchedules = pgTable("crew_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  crewMemberId: uuid("crew_member_id").references(() => crewMembers.id).notNull(),
  dayOfWeek: text("day_of_week").notNull(), // Monday, Tuesday, etc.
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCrewScheduleSchema = createInsertSchema(crewSchedules).omit({
  id: true,
  createdAt: true,
});

// Crew Time Off - Vacation, sick days, etc.
export const crewTimeOff = pgTable("crew_time_off", {
  id: uuid("id").defaultRandom().primaryKey(),
  crewMemberId: uuid("crew_member_id").references(() => crewMembers.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  reason: text("reason"),
  workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCrewTimeOffSchema = createInsertSchema(crewTimeOff).omit({
  id: true,
  createdAt: true,
});

// Notifications
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // info, warning, error, success
  read: boolean("read").notNull().default(false),
  relatedEntityType: text("related_entity_type"), // show, crew_member, resource
  relatedEntityId: uuid("related_entity_id"),
  workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  read: true,
});

// Type exports
export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type CrewMember = typeof crewMembers.$inferSelect;
export type InsertCrewMember = z.infer<typeof insertCrewMemberSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type CrewMemberJob = typeof crewMemberJobs.$inferSelect;
export type InsertCrewMemberJob = z.infer<typeof insertCrewMemberJobSchema>;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type ShowCategory = typeof showCategories.$inferSelect;
export type InsertShowCategory = z.infer<typeof insertShowCategorySchema>;

export type Show = typeof shows.$inferSelect;
export type InsertShow = z.infer<typeof insertShowSchema>;

export type ShowCategoryAssignment = typeof showCategoryAssignments.$inferSelect;
export type InsertShowCategoryAssignment = z.infer<typeof insertShowCategoryAssignmentSchema>;

export type RequiredJob = typeof requiredJobs.$inferSelect;
export type InsertRequiredJob = z.infer<typeof insertRequiredJobSchema>;

export type ShowResource = typeof showResources.$inferSelect;
export type InsertShowResource = z.infer<typeof insertShowResourceSchema>;

export type CrewAssignment = typeof crewAssignments.$inferSelect;
export type InsertCrewAssignment = z.infer<typeof insertCrewAssignmentSchema>;

export type CrewSchedule = typeof crewSchedules.$inferSelect;
export type InsertCrewSchedule = z.infer<typeof insertCrewScheduleSchema>;

export type CrewTimeOff = typeof crewTimeOff.$inferSelect;
export type InsertCrewTimeOff = z.infer<typeof insertCrewTimeOffSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
