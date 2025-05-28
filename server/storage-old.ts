import { randomUUID } from "crypto";
import type { 
  Workspace, 
  InsertWorkspace,
  User,
  InsertUser,
  CrewMember,
  InsertCrewMember,
  Job,
  InsertJob,
  CrewMemberJob,
  InsertCrewMemberJob,
  Resource,
  InsertResource,
  ShowCategory,
  InsertShowCategory,
  Show,
  InsertShow,
  ShowCategoryAssignment,
  InsertShowCategoryAssignment,
  RequiredJob,
  InsertRequiredJob,
  ShowResource,
  InsertShowResource,
  CrewAssignment,
  InsertCrewAssignment,
  CrewSchedule,
  InsertCrewSchedule,
  CrewTimeOff,
  InsertCrewTimeOff,
  Notification,
  InsertNotification
} from "@shared/schema";
import {
  workspaces,
  users,
  crewMembers,
  jobs,
  crewMemberJobs,
  resources,
  showCategories,
  shows,
  showCategoryAssignments,
  requiredJobs,
  showResources,
  crewAssignments,
  crewSchedules,
  crewTimeOff,
  notifications,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, like } from "drizzle-orm";

export interface IStorage {
  // Workspace CRUD
  getWorkspaces(): Promise<Workspace[]>;
  getWorkspace(id: string): Promise<Workspace | undefined>;
  getWorkspaceBySlug(slug: string): Promise<Workspace | undefined>;
  isWorkspaceSlugAvailable(slug: string): Promise<boolean>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  updateWorkspace(id: string, workspace: Partial<InsertWorkspace>): Promise<Workspace | undefined>;
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
  updateCrewMember(id: string, crewMember: Partial<InsertCrewMember>): Promise<CrewMember | undefined>;
  deleteCrewMember(id: string): Promise<boolean>;

  // Job CRUD
  getJobs(workspaceId: string): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, job: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: string): Promise<boolean>;

  // Crew Member Job CRUD
  getCrewMemberJobs(workspaceId: string): Promise<CrewMemberJob[]>;
  getCrewMemberJobsByCrewMember(crewMemberId: string): Promise<CrewMemberJob[]>;
  createCrewMemberJob(crewMemberJob: InsertCrewMemberJob): Promise<CrewMemberJob>;
  deleteCrewMemberJob(id: string): Promise<boolean>;

  // Resource CRUD
  getResources(workspaceId: string): Promise<Resource[]>;
  getResource(id: string): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: string, resource: Partial<InsertResource>): Promise<Resource | undefined>;
  deleteResource(id: string): Promise<boolean>;

  // Show Category CRUD
  getShowCategories(workspaceId: string): Promise<ShowCategory[]>;
  getShowCategory(id: string): Promise<ShowCategory | undefined>;
  createShowCategory(showCategory: InsertShowCategory): Promise<ShowCategory>;
  updateShowCategory(id: string, showCategory: Partial<InsertShowCategory>): Promise<ShowCategory | undefined>;
  deleteShowCategory(id: string): Promise<boolean>;

  // Show CRUD
  getShows(workspaceId: string): Promise<Show[]>;
  getShowsInRange(workspaceId: string, startDate: Date, endDate: Date): Promise<Show[]>;
  getShow(id: string): Promise<Show | undefined>;
  createShow(show: InsertShow): Promise<Show>;
  updateShow(id: string, show: Partial<InsertShow>): Promise<Show | undefined>;
  deleteShow(id: string): Promise<boolean>;

  // Show Category Assignment CRUD
  getShowCategoryAssignments(workspaceId: string): Promise<ShowCategoryAssignment[]>;
  getShowCategoryAssignmentsByShow(showId: string): Promise<ShowCategoryAssignment[]>;
  createShowCategoryAssignment(assignment: InsertShowCategoryAssignment): Promise<ShowCategoryAssignment>;
  deleteShowCategoryAssignment(id: string): Promise<boolean>;

  // Required Job CRUD
  getRequiredJobs(workspaceId: string): Promise<RequiredJob[]>;
  getRequiredJobsByShow(showId: string): Promise<RequiredJob[]>;
  createRequiredJob(requiredJob: InsertRequiredJob): Promise<RequiredJob>;
  updateRequiredJob(id: string, requiredJob: Partial<InsertRequiredJob>): Promise<RequiredJob | undefined>;
  deleteRequiredJob(id: string): Promise<boolean>;

  // Show Resource CRUD
  getShowResources(workspaceId: string): Promise<ShowResource[]>;
  getShowResourcesByShow(showId: string): Promise<ShowResource[]>;
  createShowResource(showResource: InsertShowResource): Promise<ShowResource>;
  deleteShowResource(id: string): Promise<boolean>;

  // Crew Assignment CRUD
  getCrewAssignments(workspaceId: string): Promise<CrewAssignment[]>;
  getCrewAssignmentsByShow(showId: string): Promise<CrewAssignment[]>;
  getCrewAssignmentsByCrewMember(crewMemberId: string): Promise<CrewAssignment[]>;
  createCrewAssignment(crewAssignment: InsertCrewAssignment): Promise<CrewAssignment>;
  updateCrewAssignment(id: string, crewAssignment: Partial<InsertCrewAssignment>): Promise<CrewAssignment | undefined>;
  deleteCrewAssignment(id: string): Promise<boolean>;

  // Crew Schedule CRUD
  getCrewSchedules(workspaceId: string): Promise<CrewSchedule[]>;
  getCrewSchedulesByCrewMember(crewMemberId: string): Promise<CrewSchedule[]>;
  createCrewSchedule(crewSchedule: InsertCrewSchedule): Promise<CrewSchedule>;
  updateCrewSchedule(id: string, crewSchedule: Partial<InsertCrewSchedule>): Promise<CrewSchedule | undefined>;
  deleteCrewSchedule(id: string): Promise<boolean>;

  // Crew Time Off CRUD
  getCrewTimeOffs(workspaceId: string): Promise<CrewTimeOff[]>;
  getCrewTimeOffsByCrewMember(crewMemberId: string): Promise<CrewTimeOff[]>;
  createCrewTimeOff(crewTimeOff: InsertCrewTimeOff): Promise<CrewTimeOff>;
  updateCrewTimeOff(id: string, crewTimeOff: Partial<InsertCrewTimeOff>): Promise<CrewTimeOff | undefined>;
  deleteCrewTimeOff(id: string): Promise<boolean>;

  // Notification CRUD
  getNotifications(workspaceId: string): Promise<Notification[]>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  deleteNotification(id: string): Promise<boolean>;

  // Conflict Detection
  detectCrewConflicts(showId: string, crewMemberId: string): Promise<boolean>;
  detectResourceConflicts(showId: string, resourceId: string): Promise<boolean>;
}

// Add method to seed database with demo data
export async function seedDemoData(): Promise<void> {
  // Check if data already exists
  const existingWorkspaces = await db.select().from(workspaces);
  if (existingWorkspaces.length > 0) {
    console.log("Demo data already exists, skipping seed...");
    return;
  }

  const setTime = (date: Date, hours: number, minutes: number = 0) => {
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

  // Create workspaces
  const [workspace1, workspace2] = await db.insert(workspaces).values([
    {
      name: "BBC Studios North",
      slug: "bbc-studios-north",
      region: "Manchester",
    },
    {
      name: "ITV London", 
      slug: "itv-london",
      region: "London",
    }
  ]).returning();

  // Create users
  const [user1, user2] = await db.insert(users).values([
    {
      username: "admin",
      password: "hashed_password_123",
      name: "Sarah Mitchell",
      email: "sarah.mitchell@bbcstudios.com",
      role: "admin",
      workspaceId: workspace1.id,
    },
    {
      username: "producer",
      password: "hashed_password_456",
      name: "David Thompson",
      email: "david.thompson@itv.com",
      role: "producer",
      workspaceId: workspace2.id,
    }
  ]).returning();

  // Create crew members
  const [crewMember1, crewMember2, crewMember3, crewMember4, crewMember5] = await db.insert(crewMembers).values([
    {
      name: "Alex Rodriguez",
      email: "alex.rodriguez@bbcstudios.com",
      phone: "+44 7700 900123",
      title: "Camera Operator",
      workspaceId: workspace1.id,
    },
    {
      name: "Emma Johnson",
      email: "emma.johnson@bbcstudios.com",
      phone: "+44 7700 900456",
      title: "Sound Engineer",
      workspaceId: workspace1.id,
    },
    {
      name: "James Wilson",
      email: "james.wilson@bbcstudios.com",
      phone: "+44 7700 900789",
      title: "Lighting Technician",
      workspaceId: workspace1.id,
    },
    {
      name: "Sophie Turner",
      email: "sophie.turner@bbcstudios.com",
      phone: "+44 7700 900012",
      title: "Director",
      workspaceId: workspace1.id,
    },
    {
      name: "Michael Chen",
      email: "michael.chen@bbcstudios.com",
      phone: "+44 7700 900345",
      title: "Production Assistant",
      workspaceId: workspace1.id,
    }
  ]).returning();

  // Create jobs
  const [job1, job2, job3, job4, job5] = await db.insert(jobs).values([
    {
      title: "Camera Operator",
      description: "Operate professional broadcast cameras for live and recorded productions",
      workspaceId: workspace1.id,
    },
    {
      title: "Sound Engineer",
      description: "Manage audio equipment and ensure high-quality sound recording",
      workspaceId: workspace1.id,
    },
    {
      title: "Lighting Technician",
      description: "Set up and operate lighting equipment for optimal visual quality",
      workspaceId: workspace1.id,
    },
    {
      title: "Director",
      description: "Lead creative direction and coordinate production activities",
      workspaceId: workspace1.id,
    },
    {
      title: "Production Assistant",
      description: "Support production team with various tasks and coordination",
      workspaceId: workspace1.id,
    }
  ]).returning();

  // Create crew member job assignments
  await db.insert(crewMemberJobs).values([
    { crewMemberId: crewMember1.id, jobId: job1.id, workspaceId: workspace1.id },
    { crewMemberId: crewMember2.id, jobId: job2.id, workspaceId: workspace1.id },
    { crewMemberId: crewMember3.id, jobId: job3.id, workspaceId: workspace1.id },
    { crewMemberId: crewMember4.id, jobId: job4.id, workspaceId: workspace1.id },
    { crewMemberId: crewMember5.id, jobId: job5.id, workspaceId: workspace1.id },
  ]);

  // Create resources
  const [resource1, resource2, resource3, resource4] = await db.insert(resources).values([
    {
      name: "Studio A",
      type: "studio",
      description: "Main production studio with green screen capability",
      workspaceId: workspace1.id,
    },
    {
      name: "Control Room 1",
      type: "control_room", 
      description: "Primary control room with 4K broadcasting equipment",
      workspaceId: workspace1.id,
    },
    {
      name: "Camera Kit #1",
      type: "equipment",
      description: "Professional broadcast camera with tripod and accessories",
      workspaceId: workspace1.id,
    },
    {
      name: "Sound Mixing Board",
      type: "equipment",
      description: "16-channel digital mixing console",
      workspaceId: workspace1.id,
    }
  ]).returning();

  // Create show categories
  const [category1, category2, category3] = await db.insert(showCategories).values([
    { name: "News", color: "#ff6b6b", workspaceId: workspace1.id },
    { name: "Drama", color: "#4ecdc4", workspaceId: workspace1.id },
    { name: "Documentary", color: "#45b7d1", workspaceId: workspace1.id },
  ]).returning();

  // Create shows
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const [show1, show2, show3, show4] = await db.insert(shows).values([
    {
      title: "Evening News",
      description: "Daily evening news broadcast covering local and national stories",
      startTime: setTime(today, 18, 0),
      endTime: setTime(today, 19, 0),
      recurringPattern: "daily",
      notes: "Live broadcast - critical crew requirements",
      status: "scheduled",
      color: "#ff6b6b",
      workspaceId: workspace1.id,
    },
    {
      title: "Morning Drama Recording",
      description: "Recording session for upcoming drama series",
      startTime: setTime(tomorrow, 9, 0),
      endTime: setTime(tomorrow, 17, 0),
      recurringPattern: null,
      notes: "Full day production - all departments required",
      status: "draft",
      color: "#4ecdc4",
      workspaceId: workspace1.id,
    },
    {
      title: "Weekend Documentary",
      description: "Nature documentary filming session",
      startTime: setTime(nextWeek, 10, 0),
      endTime: setTime(nextWeek, 16, 0),
      recurringPattern: null,
      notes: "Outdoor location shoot",
      status: "scheduled",
      color: "#45b7d1",
      workspaceId: workspace1.id,
    },
    {
      title: "Late Night Talk Show",
      description: "Weekly late night entertainment show",
      startTime: setTime(today, 22, 0),
      endTime: setTime(today, 23, 30),
      recurringPattern: "weekly",
      notes: "Live audience - security required",
      status: "scheduled",
      color: "#f39c12",
      workspaceId: workspace1.id,
    }
  ]).returning();

  // Create show category assignments
  await db.insert(showCategoryAssignments).values([
    { showId: show1.id, categoryId: category1.id, workspaceId: workspace1.id },
    { showId: show2.id, categoryId: category2.id, workspaceId: workspace1.id },
    { showId: show3.id, categoryId: category3.id, workspaceId: workspace1.id },
    { showId: show4.id, categoryId: category2.id, workspaceId: workspace1.id },
  ]);

  // Create required jobs for shows
  await db.insert(requiredJobs).values([
    { showId: show1.id, jobId: job1.id, quantity: 2, notes: "Need experienced operators for live broadcast", workspaceId: workspace1.id },
    { showId: show1.id, jobId: job2.id, quantity: 1, workspaceId: workspace1.id },
    { showId: show1.id, jobId: job4.id, quantity: 1, workspaceId: workspace1.id },
    { showId: show2.id, jobId: job1.id, quantity: 3, notes: "Multi-camera setup required", workspaceId: workspace1.id },
    { showId: show2.id, jobId: job2.id, quantity: 1, workspaceId: workspace1.id },
    { showId: show2.id, jobId: job3.id, quantity: 2, workspaceId: workspace1.id },
    { showId: show2.id, jobId: job4.id, quantity: 1, workspaceId: workspace1.id },
    { showId: show3.id, jobId: job1.id, quantity: 2, workspaceId: workspace1.id },
    { showId: show3.id, jobId: job2.id, quantity: 1, workspaceId: workspace1.id },
    { showId: show4.id, jobId: job1.id, quantity: 3, workspaceId: workspace1.id },
    { showId: show4.id, jobId: job2.id, quantity: 1, workspaceId: workspace1.id },
    { showId: show4.id, jobId: job3.id, quantity: 2, workspaceId: workspace1.id },
  ]);

  // Create show resource assignments
  await db.insert(showResources).values([
    { showId: show1.id, resourceId: resource1.id, workspaceId: workspace1.id },
    { showId: show1.id, resourceId: resource2.id, workspaceId: workspace1.id },
    { showId: show2.id, resourceId: resource1.id, workspaceId: workspace1.id },
    { showId: show2.id, resourceId: resource3.id, workspaceId: workspace1.id },
    { showId: show3.id, resourceId: resource3.id, workspaceId: workspace1.id },
    { showId: show3.id, resourceId: resource4.id, workspaceId: workspace1.id },
    { showId: show4.id, resourceId: resource1.id, workspaceId: workspace1.id },
    { showId: show4.id, resourceId: resource2.id, workspaceId: workspace1.id },
  ]);

  // Create crew assignments
  await db.insert(crewAssignments).values([
    { showId: show1.id, crewMemberId: crewMember1.id, jobId: job1.id, status: "confirmed", workspaceId: workspace1.id },
    { showId: show1.id, crewMemberId: crewMember2.id, jobId: job2.id, status: "confirmed", workspaceId: workspace1.id },
    { showId: show1.id, crewMemberId: crewMember4.id, jobId: job4.id, status: "confirmed", workspaceId: workspace1.id },
    { showId: show2.id, crewMemberId: crewMember1.id, jobId: job1.id, status: "pending", workspaceId: workspace1.id },
    { showId: show2.id, crewMemberId: crewMember3.id, jobId: job3.id, status: "confirmed", workspaceId: workspace1.id },
    { showId: show3.id, crewMemberId: crewMember2.id, jobId: job2.id, status: "pending", workspaceId: workspace1.id },
    { showId: show4.id, crewMemberId: crewMember1.id, jobId: job1.id, status: "declined", workspaceId: workspace1.id },
    { showId: show4.id, crewMemberId: crewMember3.id, jobId: job3.id, status: "confirmed", workspaceId: workspace1.id },
  ]);

  // Create crew schedules
  await db.insert(crewSchedules).values([
    { crewMemberId: crewMember1.id, dayOfWeek: "Monday", startTime: setTime(today, 8, 0), endTime: setTime(today, 18, 0), workspaceId: workspace1.id },
    { crewMemberId: crewMember1.id, dayOfWeek: "Tuesday", startTime: setTime(today, 8, 0), endTime: setTime(today, 18, 0), workspaceId: workspace1.id },
    { crewMemberId: crewMember1.id, dayOfWeek: "Wednesday", startTime: setTime(today, 8, 0), endTime: setTime(today, 18, 0), workspaceId: workspace1.id },
    { crewMemberId: crewMember2.id, dayOfWeek: "Monday", startTime: setTime(today, 9, 0), endTime: setTime(today, 17, 0), workspaceId: workspace1.id },
    { crewMemberId: crewMember2.id, dayOfWeek: "Wednesday", startTime: setTime(today, 9, 0), endTime: setTime(today, 17, 0), workspaceId: workspace1.id },
    { crewMemberId: crewMember2.id, dayOfWeek: "Friday", startTime: setTime(today, 9, 0), endTime: setTime(today, 17, 0), workspaceId: workspace1.id },
  ]);

  // Create time off records
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + 14);

  await db.insert(crewTimeOff).values([
    {
      crewMemberId: crewMember2.id,
      startTime: setTime(futureDate, 0, 0),
      endTime: setTime(futureDate, 23, 59),
      reason: "Personal vacation",
      workspaceId: workspace1.id,
    },
    {
      crewMemberId: crewMember3.id,
      startTime: setTime(nextWeek, 0, 0),
      endTime: setTime(nextWeek, 23, 59),
      reason: "Sick leave",
      workspaceId: workspace1.id,
    }
  ]);

  // Create notifications
  await db.insert(notifications).values([
    {
      userId: user1.id,
      title: "New Show Scheduled",
      message: "Evening News has been scheduled for today at 6:00 PM",
      type: "info",
      relatedEntityType: "show",
      relatedEntityId: show1.id,
      workspaceId: workspace1.id,
    },
    {
      userId: user1.id,
      title: "Crew Assignment Pending",
      message: "Alex Rodriguez needs confirmation for Morning Drama Recording",
      type: "warning",
      relatedEntityType: "crew_assignment",
      relatedEntityId: show2.id,
      workspaceId: workspace1.id,
    },
    {
      userId: user1.id,
      title: "Resource Conflict",
      message: "Studio A is double-booked for next week",
      type: "error",
      relatedEntityType: "resource",
      relatedEntityId: resource1.id,
      workspaceId: workspace1.id,
    }
  ]);

  console.log("✅ Demo data seeded successfully!");
}

// Initialize database with demo data on startup
seedDemoData().catch(console.error);

export class DatabaseStorage implements IStorage {

  constructor() {
    this.workspaces = new Map();
    this.users = new Map();
    this.crewMembers = new Map();
    this.jobs = new Map();
    this.crewMemberJobs = new Map();
    this.resources = new Map();
    this.showCategories = new Map();
    this.shows = new Map();
    this.showCategoryAssignments = new Map();
    this.requiredJobs = new Map();
    this.showResources = new Map();
    this.crewAssignments = new Map();
    this.crewSchedules = new Map();
    this.crewTimeOffs = new Map();
    this.notifications = new Map();

    this.initializeDemoData();
  }

  private initializeDemoData() {
    const setTime = (date: Date, hours: number, minutes: number = 0) => {
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      return newDate;
    };

    // Create multiple workspaces
    const workspaces = [
      {
        id: "cc7df93a-dfc3-4dda-9832-a7f5f20a3b1e",
        name: "ABC Productions",
        slug: "abc-productions"
      },
      {
        id: "dd8ef0ab-efc4-5eeb-a943-b6f6f30b4c2f", 
        name: "TW Channel",
        slug: "tw-channel"
      },
      {
        id: "ee9f01bc-f0d5-6ffc-ba54-c7f7f40c5d30",
        name: "CNN Studios", 
        slug: "cnn-studios"
      },
      {
        id: "ff0a12cd-01e6-7ffd-cb65-d8f8f51d6e41",
        name: "Holy House Network",
        slug: "holy-house-network"
      }
    ];

    // Initialize workspaces
    workspaces.forEach(ws => {
      this.workspaces.set(ws.id, {
        ...ws,
        region: "US",
        createdAt: new Date(),
      });
    });

    // Create users for each workspace
    const users = [
      {
        id: "38ccfc25-287d-4ac1-b832-5a5f3a1b1575",
        username: "admin",
        name: "Sarah Johnson",
        email: "sarah@abcproductions.com",
        role: "Production Manager",
        workspaceId: workspaces[0].id
      },
      {
        id: "50d2426c-f8c1-4eea-b7b6-2b625a51284a",
        username: "jeff_m",
        name: "Jeff Masterson", 
        email: "jeff@twchannel.com",
        role: "Camera Operator",
        workspaceId: workspaces[1].id
      },
      {
        id: "61e3537d-09d2-5ffb-c8c7-3c736b62395b",
        username: "maria_s",
        name: "Maria Santos",
        email: "maria@cnn.com", 
        role: "News Director",
        workspaceId: workspaces[2].id
      },
      {
        id: "72f4648e-1ae3-60fc-d9d8-4d847c73406c",
        username: "david_l",
        name: "David Lee",
        email: "david@holyhouse.tv",
        role: "Technical Director", 
        workspaceId: workspaces[3].id
      }
    ];

    users.forEach(user => {
      this.users.set(user.id, {
        ...user,
        password: "password",
        createdAt: new Date(),
      });
    });

    // Create jobs for each workspace
    const jobsByWorkspace = {
      [workspaces[0].id]: [
        { title: "Director", description: "Oversees creative direction of productions" },
        { title: "Camera Operator", description: "Operates broadcast cameras" },
        { title: "Audio Engineer", description: "Manages sound equipment and mixing" },
        { title: "Production Assistant", description: "Supports production team with various tasks" },
        { title: "Lighting Technician", description: "Sets up and operates lighting equipment" }
      ],
      [workspaces[1].id]: [
        { title: "News Anchor", description: "Presents news on television" },
        { title: "Field Reporter", description: "Reports from remote locations" },
        { title: "Video Editor", description: "Edits video content for broadcast" },
        { title: "Teleprompter Operator", description: "Operates teleprompter systems" }
      ],
      [workspaces[2].id]: [
        { title: "Breaking News Producer", description: "Produces live breaking news coverage" },
        { title: "Graphics Operator", description: "Creates and operates on-screen graphics" },
        { title: "Master Control Operator", description: "Manages broadcast playout systems" },
        { title: "Weather Producer", description: "Produces weather segments" }
      ],
      [workspaces[3].id]: [
        { title: "Worship Leader", description: "Leads congregation in worship" },
        { title: "Video Director", description: "Directs live worship broadcasts" },
        { title: "Sound Engineer", description: "Manages live sound for services" },
        { title: "Streaming Technician", description: "Manages online streaming platforms" }
      ]
    };

    Object.entries(jobsByWorkspace).forEach(([workspaceId, jobs]) => {
      jobs.forEach(job => {
        const id = randomUUID();
        this.jobs.set(id, {
          id,
          title: job.title,
          description: job.description,
          workspaceId,
          createdAt: new Date(),
        });
      });
    });

    // Create crew members for each workspace
    const crewMembersByWorkspace = {
      [workspaces[0].id]: [
        { name: "Alex Rodriguez", email: "alex@abcproductions.com", title: "Senior Camera Operator" },
        { name: "Emily Chen", email: "emily@abcproductions.com", title: "Audio Engineer" },
        { name: "Marcus Thompson", email: "marcus@abcproductions.com", title: "Lighting Designer" },
        { name: "Sofia Martinez", email: "sofia@abcproductions.com", title: "Production Assistant" }
      ],
      [workspaces[1].id]: [
        { name: "Jennifer Walsh", email: "jennifer@twchannel.com", title: "News Anchor" },
        { name: "Robert Kim", email: "robert@twchannel.com", title: "Field Reporter" },
        { name: "Lisa Anderson", email: "lisa@twchannel.com", title: "Video Editor" }
      ],
      [workspaces[2].id]: [
        { name: "Michael Davis", email: "michael@cnn.com", title: "Breaking News Producer" },
        { name: "Amanda Foster", email: "amanda@cnn.com", title: "Graphics Specialist" },
        { name: "Brian Wilson", email: "brian@cnn.com", title: "Master Control" },
        { name: "Rachel Green", email: "rachel@cnn.com", title: "Weather Producer" }
      ],
      [workspaces[3].id]: [
        { name: "Pastor John Smith", email: "john@holyhouse.tv", title: "Lead Pastor" },
        { name: "Mark Johnson", email: "mark@holyhouse.tv", title: "Worship Director" },
        { name: "Sarah Williams", email: "sarah.w@holyhouse.tv", title: "Media Coordinator" }
      ]
    };

    Object.entries(crewMembersByWorkspace).forEach(([workspaceId, members]) => {
      members.forEach(member => {
        const id = randomUUID();
        this.crewMembers.set(id, {
          id,
          name: member.name,
          email: member.email,
          workspaceId,
          title: member.title,
          phone: null,
          createdAt: new Date(),
        });
      });
    });

    // Create resources for each workspace
    const resourcesByWorkspace = {
      [workspaces[0].id]: [
        { name: "Studio A", type: "Location", description: "Main production studio with green screen" },
        { name: "Camera 1 - Sony FX9", type: "Equipment", description: "Professional cinema camera" },
        { name: "Lighting Kit", type: "Equipment", description: "Professional LED lighting setup" },
        { name: "Audio Mixing Board", type: "Equipment", description: "32-channel digital mixer" }
      ],
      [workspaces[1].id]: [
        { name: "News Studio", type: "Location", description: "Live news broadcast studio" },
        { name: "Mobile Unit 1", type: "Vehicle", description: "Remote broadcast truck" },
        { name: "Teleprompter System", type: "Equipment", description: "Professional teleprompter setup" }
      ],
      [workspaces[2].id]: [
        { name: "Breaking News Desk", type: "Location", description: "24/7 news coverage area" },
        { name: "Weather Center", type: "Location", description: "Weather forecasting studio" },
        { name: "Satellite Uplink", type: "Equipment", description: "Live satellite transmission equipment" }
      ],
      [workspaces[3].id]: [
        { name: "Main Sanctuary", type: "Location", description: "Primary worship space for 500 people" },
        { name: "Fellowship Hall", type: "Location", description: "Multi-purpose event space" },
        { name: "Worship Cameras", type: "Equipment", description: "PTZ camera system for live streaming" }
      ]
    };

    Object.entries(resourcesByWorkspace).forEach(([workspaceId, resources]) => {
      resources.forEach(resource => {
        const id = randomUUID();
        this.resources.set(id, {
          id,
          name: resource.name,
          type: resource.type,
          workspaceId,
          description: resource.description,
          createdAt: new Date(),
        });
      });
    });

    // Create show categories for each workspace
    const categoriesByWorkspace = {
      [workspaces[0].id]: [
        { name: "Drama Series", description: "Scripted television dramas" },
        { name: "Documentary", description: "Non-fiction documentary films" },
        { name: "Commercial", description: "Advertising and promotional content" }
      ],
      [workspaces[1].id]: [
        { name: "Morning News", description: "Early morning news programming" },
        { name: "Evening News", description: "Prime time news broadcasts" },
        { name: "Special Reports", description: "In-depth investigative pieces" }
      ],
      [workspaces[2].id]: [
        { name: "Breaking News", description: "Live breaking news coverage" },
        { name: "Weather", description: "Weather forecasts and updates" },
        { name: "Political Coverage", description: "Government and political news" }
      ],
      [workspaces[3].id]: [
        { name: "Sunday Service", description: "Weekly worship services" },
        { name: "Special Events", description: "Holiday and special occasion services" },
        { name: "Bible Study", description: "Educational programming" }
      ]
    };

    Object.entries(categoriesByWorkspace).forEach(([workspaceId, categories]) => {
      categories.forEach(category => {
        const id = randomUUID();
        this.showCategories.set(id, {
          id,
          name: category.name,
          description: category.description,
          workspaceId,
          createdAt: new Date(),
        });
      });
    });

    // Create shows for each workspace
    const today = new Date();
    const showsByWorkspace = {
      [workspaces[0].id]: [
        {
          title: "City Lights Drama - Episode 5",
          description: "Filming the dramatic confrontation scene",
          startTime: setTime(new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), 9),
          endTime: setTime(new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), 17),
          status: "scheduled"
        },
        {
          title: "Nature Documentary Shoot",
          description: "Wildlife filming in local park",
          startTime: setTime(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), 6),
          endTime: setTime(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), 14),
          status: "scheduled"
        }
      ],
      [workspaces[1].id]: [
        {
          title: "Morning News - Live Broadcast", 
          description: "Daily morning news program",
          startTime: setTime(today, 6),
          endTime: setTime(today, 9),
          status: "live"
        },
        {
          title: "Evening News - Live Broadcast",
          description: "Prime time evening news",
          startTime: setTime(today, 18),
          endTime: setTime(today, 19),
          status: "scheduled"
        }
      ],
      [workspaces[2].id]: [
        {
          title: "Breaking: Election Coverage",
          description: "Live election results coverage",
          startTime: setTime(today, 20),
          endTime: setTime(new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), 2),
          status: "live"
        },
        {
          title: "Weather Update Special",
          description: "Severe weather tracking",
          startTime: setTime(new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), 12),
          endTime: setTime(new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), 13),
          status: "scheduled"
        }
      ],
      [workspaces[3].id]: [
        {
          title: "Sunday Morning Worship",
          description: "Weekly worship service with live streaming",
          startTime: setTime(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), 10),
          endTime: setTime(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), 12),
          status: "scheduled"
        },
        {
          title: "Christmas Special Service",
          description: "Holiday celebration service",
          startTime: setTime(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), 19),
          endTime: setTime(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), 21),
          status: "scheduled"
        }
      ]
    };

    Object.entries(showsByWorkspace).forEach(([workspaceId, shows]) => {
      shows.forEach(show => {
        const id = randomUUID();
        this.shows.set(id, {
          id,
          title: show.title,
          description: show.description,
          workspaceId,
          startTime: show.startTime,
          endTime: show.endTime,
          status: show.status,
          color: "#3B82F6",
          recurringPattern: null,
          notes: null,
          createdAt: new Date(),
        });
      });
    });

    // Create notifications for users
    const notifications = [
      {
        userId: "38ccfc25-287d-4ac1-b832-5a5f3a1b1575",
        workspaceId: workspaces[0].id,
        title: "Show scheduled",
        message: "City Lights Drama - Episode 5 has been scheduled for tomorrow",
        type: "show_scheduled"
      },
      {
        userId: "50d2426c-f8c1-4eea-b7b6-2b625a51284a", 
        workspaceId: workspaces[1].id,
        title: "Equipment maintenance",
        message: "Camera 2 scheduled for maintenance this weekend",
        type: "maintenance"
      }
    ];

    notifications.forEach(notification => {
      const id = randomUUID();
      this.notifications.set(id, {
        id,
        userId: notification.userId,
        workspaceId: notification.workspaceId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: false,
        relatedEntityType: null,
        relatedEntityId: null,
        createdAt: new Date(),
      });
    });
  }

  async getWorkspaces(): Promise<Workspace[]> {
    return Array.from(this.workspaces.values());
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    return this.workspaces.get(id);
  }

  async createWorkspace(workspace: InsertWorkspace): Promise<Workspace> {
    const id = randomUUID();
    const newWorkspace: Workspace = {
      id,
      ...workspace,
      createdAt: new Date(),
    };
    this.workspaces.set(id, newWorkspace);
    return newWorkspace;
  }

  async updateWorkspace(id: string, workspace: Partial<InsertWorkspace>): Promise<Workspace | undefined> {
    const existing = this.workspaces.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...workspace };
    this.workspaces.set(id, updated);
    return updated;
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    return this.workspaces.delete(id);
  }

  async getWorkspaceBySlug(slug: string): Promise<Workspace | undefined> {
    return Array.from(this.workspaces.values()).find(w => w.slug === slug);
  }

  async isWorkspaceSlugAvailable(slug: string): Promise<boolean> {
    return !Array.from(this.workspaces.values()).some(w => w.slug === slug);
  }

  async getUsers(workspaceId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.workspaceId === workspaceId);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = randomUUID();
    const newUser: User = {
      id,
      ...user,
      createdAt: new Date(),
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...user };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getCrewMembers(workspaceId: string): Promise<CrewMember[]> {
    return Array.from(this.crewMembers.values()).filter(c => c.workspaceId === workspaceId);
  }

  async getCrewMember(id: string): Promise<CrewMember | undefined> {
    return this.crewMembers.get(id);
  }

  async createCrewMember(crewMember: InsertCrewMember): Promise<CrewMember> {
    const id = randomUUID();
    const newCrewMember: CrewMember = {
      id,
      ...crewMember,
      createdAt: new Date(),
    };
    this.crewMembers.set(id, newCrewMember);
    return newCrewMember;
  }

  async updateCrewMember(id: string, crewMember: Partial<InsertCrewMember>): Promise<CrewMember | undefined> {
    const existing = this.crewMembers.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...crewMember };
    this.crewMembers.set(id, updated);
    return updated;
  }

  async deleteCrewMember(id: string): Promise<boolean> {
    return this.crewMembers.delete(id);
  }

  async getJobs(workspaceId: string): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(j => j.workspaceId === workspaceId);
  }

  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async createJob(job: InsertJob): Promise<Job> {
    const id = randomUUID();
    const newJob: Job = {
      id,
      ...job,
      createdAt: new Date(),
    };
    this.jobs.set(id, newJob);
    return newJob;
  }

  async updateJob(id: string, job: Partial<InsertJob>): Promise<Job | undefined> {
    const existing = this.jobs.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...job };
    this.jobs.set(id, updated);
    return updated;
  }

  async deleteJob(id: string): Promise<boolean> {
    return this.jobs.delete(id);
  }

  async getCrewMemberJobs(workspaceId: string): Promise<CrewMemberJob[]> {
    return Array.from(this.crewMemberJobs.values()).filter(cmj => {
      const crewMember = this.crewMembers.get(cmj.crewMemberId);
      return crewMember?.workspaceId === workspaceId;
    });
  }

  async getCrewMemberJobsByCrewMember(crewMemberId: string): Promise<CrewMemberJob[]> {
    return Array.from(this.crewMemberJobs.values()).filter(cmj => cmj.crewMemberId === crewMemberId);
  }

  async createCrewMemberJob(crewMemberJob: InsertCrewMemberJob): Promise<CrewMemberJob> {
    const id = randomUUID();
    const newCrewMemberJob: CrewMemberJob = {
      id,
      ...crewMemberJob,
      createdAt: new Date(),
    };
    this.crewMemberJobs.set(id, newCrewMemberJob);
    return newCrewMemberJob;
  }

  async deleteCrewMemberJob(id: string): Promise<boolean> {
    return this.crewMemberJobs.delete(id);
  }

  async getResources(workspaceId: string): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter(r => r.workspaceId === workspaceId);
  }

  async getResource(id: string): Promise<Resource | undefined> {
    return this.resources.get(id);
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const id = randomUUID();
    const newResource: Resource = {
      id,
      ...resource,
      createdAt: new Date(),
    };
    this.resources.set(id, newResource);
    return newResource;
  }

  async updateResource(id: string, resource: Partial<InsertResource>): Promise<Resource | undefined> {
    const existing = this.resources.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...resource };
    this.resources.set(id, updated);
    return updated;
  }

  async deleteResource(id: string): Promise<boolean> {
    return this.resources.delete(id);
  }

  async getShowCategories(workspaceId: string): Promise<ShowCategory[]> {
    return Array.from(this.showCategories.values()).filter(sc => sc.workspaceId === workspaceId);
  }

  async getShowCategory(id: string): Promise<ShowCategory | undefined> {
    return this.showCategories.get(id);
  }

  async createShowCategory(showCategory: InsertShowCategory): Promise<ShowCategory> {
    const id = randomUUID();
    const newShowCategory: ShowCategory = {
      id,
      ...showCategory,
      createdAt: new Date(),
    };
    this.showCategories.set(id, newShowCategory);
    return newShowCategory;
  }

  async updateShowCategory(id: string, showCategory: Partial<InsertShowCategory>): Promise<ShowCategory | undefined> {
    const existing = this.showCategories.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...showCategory };
    this.showCategories.set(id, updated);
    return updated;
  }

  async deleteShowCategory(id: string): Promise<boolean> {
    return this.showCategories.delete(id);
  }

  async getShows(workspaceId: string): Promise<Show[]> {
    return Array.from(this.shows.values()).filter(s => s.workspaceId === workspaceId);
  }

  async getShowsInRange(workspaceId: string, startDate: Date, endDate: Date): Promise<Show[]> {
    return Array.from(this.shows.values()).filter(s => 
      s.workspaceId === workspaceId &&
      s.startTime >= startDate && 
      s.endTime <= endDate
    );
  }

  async getShow(id: string): Promise<Show | undefined> {
    return this.shows.get(id);
  }

  async createShow(show: InsertShow): Promise<Show> {
    const id = randomUUID();
    const newShow: Show = {
      id,
      ...show,
      createdAt: new Date(),
    };
    this.shows.set(id, newShow);
    return newShow;
  }

  async updateShow(id: string, show: Partial<InsertShow>): Promise<Show | undefined> {
    const existing = this.shows.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...show };
    this.shows.set(id, updated);
    return updated;
  }

  async deleteShow(id: string): Promise<boolean> {
    return this.shows.delete(id);
  }

  async getShowCategoryAssignments(workspaceId: string): Promise<ShowCategoryAssignment[]> {
    return Array.from(this.showCategoryAssignments.values()).filter(sca => {
      const show = this.shows.get(sca.showId);
      return show?.workspaceId === workspaceId;
    });
  }

  async getShowCategoryAssignmentsByShow(showId: string): Promise<ShowCategoryAssignment[]> {
    return Array.from(this.showCategoryAssignments.values()).filter(sca => sca.showId === showId);
  }

  async createShowCategoryAssignment(assignment: InsertShowCategoryAssignment): Promise<ShowCategoryAssignment> {
    const id = randomUUID();
    const newAssignment: ShowCategoryAssignment = {
      id,
      ...assignment,
      createdAt: new Date(),
    };
    this.showCategoryAssignments.set(id, newAssignment);
    return newAssignment;
  }

  async deleteShowCategoryAssignment(id: string): Promise<boolean> {
    return this.showCategoryAssignments.delete(id);
  }

  async getRequiredJobs(workspaceId: string): Promise<RequiredJob[]> {
    return Array.from(this.requiredJobs.values()).filter(rj => {
      const show = this.shows.get(rj.showId);
      return show?.workspaceId === workspaceId;
    });
  }

  async getRequiredJobsByShow(showId: string): Promise<RequiredJob[]> {
    return Array.from(this.requiredJobs.values()).filter(rj => rj.showId === showId);
  }

  async createRequiredJob(requiredJob: InsertRequiredJob): Promise<RequiredJob> {
    const id = randomUUID();
    const newRequiredJob: RequiredJob = {
      id,
      ...requiredJob,
      createdAt: new Date(),
    };
    this.requiredJobs.set(id, newRequiredJob);
    return newRequiredJob;
  }

  async updateRequiredJob(id: string, requiredJob: Partial<InsertRequiredJob>): Promise<RequiredJob | undefined> {
    const existing = this.requiredJobs.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...requiredJob };
    this.requiredJobs.set(id, updated);
    return updated;
  }

  async deleteRequiredJob(id: string): Promise<boolean> {
    return this.requiredJobs.delete(id);
  }

  async getShowResources(workspaceId: string): Promise<ShowResource[]> {
    return Array.from(this.showResources.values()).filter(sr => {
      const show = this.shows.get(sr.showId);
      return show?.workspaceId === workspaceId;
    });
  }

  async getShowResourcesByShow(showId: string): Promise<ShowResource[]> {
    return Array.from(this.showResources.values()).filter(sr => sr.showId === showId);
  }

  async createShowResource(showResource: InsertShowResource): Promise<ShowResource> {
    const id = randomUUID();
    const newShowResource: ShowResource = {
      id,
      ...showResource,
      createdAt: new Date(),
    };
    this.showResources.set(id, newShowResource);
    return newShowResource;
  }

  async deleteShowResource(id: string): Promise<boolean> {
    return this.showResources.delete(id);
  }

  async getCrewAssignments(workspaceId: string): Promise<CrewAssignment[]> {
    return Array.from(this.crewAssignments.values()).filter(ca => {
      const show = this.shows.get(ca.showId);
      return show?.workspaceId === workspaceId;
    });
  }

  async getCrewAssignmentsByShow(showId: string): Promise<CrewAssignment[]> {
    return Array.from(this.crewAssignments.values()).filter(ca => ca.showId === showId);
  }

  async getCrewAssignmentsByCrewMember(crewMemberId: string): Promise<CrewAssignment[]> {
    return Array.from(this.crewAssignments.values()).filter(ca => ca.crewMemberId === crewMemberId);
  }

  async createCrewAssignment(crewAssignment: InsertCrewAssignment): Promise<CrewAssignment> {
    const id = randomUUID();
    const newCrewAssignment: CrewAssignment = {
      id,
      ...crewAssignment,
      createdAt: new Date(),
    };
    this.crewAssignments.set(id, newCrewAssignment);
    return newCrewAssignment;
  }

  async updateCrewAssignment(id: string, crewAssignment: Partial<InsertCrewAssignment>): Promise<CrewAssignment | undefined> {
    const existing = this.crewAssignments.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...crewAssignment };
    this.crewAssignments.set(id, updated);
    return updated;
  }

  async deleteCrewAssignment(id: string): Promise<boolean> {
    return this.crewAssignments.delete(id);
  }

  async getCrewSchedules(workspaceId: string): Promise<CrewSchedule[]> {
    return Array.from(this.crewSchedules.values()).filter(cs => {
      const crewMember = this.crewMembers.get(cs.crewMemberId);
      return crewMember?.workspaceId === workspaceId;
    });
  }

  async getCrewSchedulesByCrewMember(crewMemberId: string): Promise<CrewSchedule[]> {
    return Array.from(this.crewSchedules.values()).filter(cs => cs.crewMemberId === crewMemberId);
  }

  async createCrewSchedule(crewSchedule: InsertCrewSchedule): Promise<CrewSchedule> {
    const id = randomUUID();
    const newCrewSchedule: CrewSchedule = {
      id,
      ...crewSchedule,
      createdAt: new Date(),
    };
    this.crewSchedules.set(id, newCrewSchedule);
    return newCrewSchedule;
  }

  async updateCrewSchedule(id: string, crewSchedule: Partial<InsertCrewSchedule>): Promise<CrewSchedule | undefined> {
    const existing = this.crewSchedules.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...crewSchedule };
    this.crewSchedules.set(id, updated);
    return updated;
  }

  async deleteCrewSchedule(id: string): Promise<boolean> {
    return this.crewSchedules.delete(id);
  }

  async getCrewTimeOffs(workspaceId: string): Promise<CrewTimeOff[]> {
    return Array.from(this.crewTimeOffs.values()).filter(cto => {
      const crewMember = this.crewMembers.get(cto.crewMemberId);
      return crewMember?.workspaceId === workspaceId;
    });
  }

  async getCrewTimeOffsByCrewMember(crewMemberId: string): Promise<CrewTimeOff[]> {
    return Array.from(this.crewTimeOffs.values()).filter(cto => cto.crewMemberId === crewMemberId);
  }

  async createCrewTimeOff(crewTimeOff: InsertCrewTimeOff): Promise<CrewTimeOff> {
    const id = randomUUID();
    const newCrewTimeOff: CrewTimeOff = {
      id,
      ...crewTimeOff,
      createdAt: new Date(),
    };
    this.crewTimeOffs.set(id, newCrewTimeOff);
    return newCrewTimeOff;
  }

  async updateCrewTimeOff(id: string, crewTimeOff: Partial<InsertCrewTimeOff>): Promise<CrewTimeOff | undefined> {
    const existing = this.crewTimeOffs.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...crewTimeOff };
    this.crewTimeOffs.set(id, updated);
    return updated;
  }

  async deleteCrewTimeOff(id: string): Promise<boolean> {
    return this.crewTimeOffs.delete(id);
  }

  async getNotifications(workspaceId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(n => n.workspaceId === workspaceId);
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(n => n.userId === userId);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const newNotification: Notification = {
      id,
      ...notification,
      createdAt: new Date(),
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const existing = this.notifications.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, read: true };
    this.notifications.set(id, updated);
    return updated;
  }

  async deleteNotification(id: string): Promise<boolean> {
    return this.notifications.delete(id);
  }

  async detectCrewConflicts(showId: string, crewMemberId: string): Promise<boolean> {
    const show = this.shows.get(showId);
    if (!show) return false;

    const existingAssignments = await this.getCrewAssignmentsByCrewMember(crewMemberId);
    
    return existingAssignments.some(assignment => {
      const assignmentShow = this.shows.get(assignment.showId);
      if (!assignmentShow || assignmentShow.id === showId) return false;
      
      return (
        (show.startTime >= assignmentShow.startTime && show.startTime < assignmentShow.endTime) ||
        (show.endTime > assignmentShow.startTime && show.endTime <= assignmentShow.endTime) ||
        (show.startTime <= assignmentShow.startTime && show.endTime >= assignmentShow.endTime)
      );
    });
  }

  async detectResourceConflicts(showId: string, resourceId: string): Promise<boolean> {
    const show = this.shows.get(showId);
    if (!show) return false;

    const existingBookings = await this.getShowResourcesByShow(resourceId);
    
    return existingBookings.some(booking => {
      const bookingShow = this.shows.get(booking.showId);
      if (!bookingShow || bookingShow.id === showId) return false;
      
      return (
        (show.startTime >= bookingShow.startTime && show.startTime < bookingShow.endTime) ||
        (show.endTime > bookingShow.startTime && show.endTime <= bookingShow.endTime) ||
        (show.startTime <= bookingShow.startTime && show.endTime >= bookingShow.endTime)
      );
    });
  }
}

export class DatabaseStorage implements IStorage {
  // Workspace CRUD
  async getWorkspaces(): Promise<Workspace[]> {
    return await db.select().from(workspaces);
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return workspace || undefined;
  }

  async getWorkspaceBySlug(slug: string): Promise<Workspace | undefined> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.slug, slug));
    return workspace || undefined;
  }

  async isWorkspaceSlugAvailable(slug: string): Promise<boolean> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.slug, slug));
    return !workspace;
  }

  async createWorkspace(workspace: InsertWorkspace): Promise<Workspace> {
    const [newWorkspace] = await db.insert(workspaces).values(workspace).returning();
    return newWorkspace;
  }

  async updateWorkspace(id: string, workspace: Partial<InsertWorkspace>): Promise<Workspace | undefined> {
    const [updatedWorkspace] = await db
      .update(workspaces)
      .set(workspace)
      .where(eq(workspaces.id, id))
      .returning();
    return updatedWorkspace || undefined;
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    const result = await db.delete(workspaces).where(eq(workspaces.id, id));
    return result.rowCount > 0;
  }

  // User CRUD
  async getUsers(workspaceId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.workspaceId, workspaceId));
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // Crew Member CRUD
  async getCrewMembers(workspaceId: string): Promise<CrewMember[]> {
    return await db.select().from(crewMembers).where(eq(crewMembers.workspaceId, workspaceId));
  }

  async getCrewMember(id: string): Promise<CrewMember | undefined> {
    const [crewMember] = await db.select().from(crewMembers).where(eq(crewMembers.id, id));
    return crewMember || undefined;
  }

  async createCrewMember(crewMember: InsertCrewMember): Promise<CrewMember> {
    const [newCrewMember] = await db.insert(crewMembers).values(crewMember).returning();
    return newCrewMember;
  }

  async updateCrewMember(id: string, crewMember: Partial<InsertCrewMember>): Promise<CrewMember | undefined> {
    const [updatedCrewMember] = await db
      .update(crewMembers)
      .set(crewMember)
      .where(eq(crewMembers.id, id))
      .returning();
    return updatedCrewMember || undefined;
  }

  async deleteCrewMember(id: string): Promise<boolean> {
    const result = await db.delete(crewMembers).where(eq(crewMembers.id, id));
    return result.rowCount > 0;
  }

  // Job CRUD
  async getJobs(workspaceId: string): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.workspaceId, workspaceId));
  }

  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }

  async updateJob(id: string, job: Partial<InsertJob>): Promise<Job | undefined> {
    const [updatedJob] = await db
      .update(jobs)
      .set(job)
      .where(eq(jobs.id, id))
      .returning();
    return updatedJob || undefined;
  }

  async deleteJob(id: string): Promise<boolean> {
    const result = await db.delete(jobs).where(eq(jobs.id, id));
    return result.rowCount > 0;
  }

  // Crew Member Job CRUD
  async getCrewMemberJobs(workspaceId: string): Promise<CrewMemberJob[]> {
    return await db.select().from(crewMemberJobs).where(eq(crewMemberJobs.workspaceId, workspaceId));
  }

  async getCrewMemberJobsByCrewMember(crewMemberId: string): Promise<CrewMemberJob[]> {
    return await db.select().from(crewMemberJobs).where(eq(crewMemberJobs.crewMemberId, crewMemberId));
  }

  async createCrewMemberJob(crewMemberJob: InsertCrewMemberJob): Promise<CrewMemberJob> {
    const [newCrewMemberJob] = await db.insert(crewMemberJobs).values(crewMemberJob).returning();
    return newCrewMemberJob;
  }

  async deleteCrewMemberJob(id: string): Promise<boolean> {
    const result = await db.delete(crewMemberJobs).where(eq(crewMemberJobs.id, id));
    return result.rowCount > 0;
  }

  // Resource CRUD
  async getResources(workspaceId: string): Promise<Resource[]> {
    return await db.select().from(resources).where(eq(resources.workspaceId, workspaceId));
  }

  async getResource(id: string): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource || undefined;
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db.insert(resources).values(resource).returning();
    return newResource;
  }

  async updateResource(id: string, resource: Partial<InsertResource>): Promise<Resource | undefined> {
    const [updatedResource] = await db
      .update(resources)
      .set(resource)
      .where(eq(resources.id, id))
      .returning();
    return updatedResource || undefined;
  }

  async deleteResource(id: string): Promise<boolean> {
    const result = await db.delete(resources).where(eq(resources.id, id));
    return result.rowCount > 0;
  }

  // Show Category CRUD
  async getShowCategories(workspaceId: string): Promise<ShowCategory[]> {
    return await db.select().from(showCategories).where(eq(showCategories.workspaceId, workspaceId));
  }

  async getShowCategory(id: string): Promise<ShowCategory | undefined> {
    const [showCategory] = await db.select().from(showCategories).where(eq(showCategories.id, id));
    return showCategory || undefined;
  }

  async createShowCategory(showCategory: InsertShowCategory): Promise<ShowCategory> {
    const [newShowCategory] = await db.insert(showCategories).values(showCategory).returning();
    return newShowCategory;
  }

  async updateShowCategory(id: string, showCategory: Partial<InsertShowCategory>): Promise<ShowCategory | undefined> {
    const [updatedShowCategory] = await db
      .update(showCategories)
      .set(showCategory)
      .where(eq(showCategories.id, id))
      .returning();
    return updatedShowCategory || undefined;
  }

  async deleteShowCategory(id: string): Promise<boolean> {
    const result = await db.delete(showCategories).where(eq(showCategories.id, id));
    return result.rowCount > 0;
  }

  // Show CRUD
  async getShows(workspaceId: string): Promise<Show[]> {
    return await db.select().from(shows).where(eq(shows.workspaceId, workspaceId));
  }

  async getShowsInRange(workspaceId: string, startDate: Date, endDate: Date): Promise<Show[]> {
    return await db
      .select()
      .from(shows)
      .where(
        and(
          eq(shows.workspaceId, workspaceId),
          gte(shows.startTime, startDate),
          lte(shows.endTime, endDate)
        )
      );
  }

  async getShow(id: string): Promise<Show | undefined> {
    const [show] = await db.select().from(shows).where(eq(shows.id, id));
    return show || undefined;
  }

  async createShow(show: InsertShow): Promise<Show> {
    const [newShow] = await db.insert(shows).values(show).returning();
    return newShow;
  }

  async updateShow(id: string, show: Partial<InsertShow>): Promise<Show | undefined> {
    const [updatedShow] = await db
      .update(shows)
      .set(show)
      .where(eq(shows.id, id))
      .returning();
    return updatedShow || undefined;
  }

  async deleteShow(id: string): Promise<boolean> {
    const result = await db.delete(shows).where(eq(shows.id, id));
    return result.rowCount > 0;
  }

  // Show Category Assignment CRUD
  async getShowCategoryAssignments(workspaceId: string): Promise<ShowCategoryAssignment[]> {
    return await db.select().from(showCategoryAssignments).where(eq(showCategoryAssignments.workspaceId, workspaceId));
  }

  async getShowCategoryAssignmentsByShow(showId: string): Promise<ShowCategoryAssignment[]> {
    return await db.select().from(showCategoryAssignments).where(eq(showCategoryAssignments.showId, showId));
  }

  async createShowCategoryAssignment(assignment: InsertShowCategoryAssignment): Promise<ShowCategoryAssignment> {
    const [newAssignment] = await db.insert(showCategoryAssignments).values(assignment).returning();
    return newAssignment;
  }

  async deleteShowCategoryAssignment(id: string): Promise<boolean> {
    const result = await db.delete(showCategoryAssignments).where(eq(showCategoryAssignments.id, id));
    return result.rowCount > 0;
  }

  // Required Job CRUD
  async getRequiredJobs(workspaceId: string): Promise<RequiredJob[]> {
    return await db.select().from(requiredJobs).where(eq(requiredJobs.workspaceId, workspaceId));
  }

  async getRequiredJobsByShow(showId: string): Promise<RequiredJob[]> {
    return await db.select().from(requiredJobs).where(eq(requiredJobs.showId, showId));
  }

  async createRequiredJob(requiredJob: InsertRequiredJob): Promise<RequiredJob> {
    const [newRequiredJob] = await db.insert(requiredJobs).values(requiredJob).returning();
    return newRequiredJob;
  }

  async updateRequiredJob(id: string, requiredJob: Partial<InsertRequiredJob>): Promise<RequiredJob | undefined> {
    const [updatedRequiredJob] = await db
      .update(requiredJobs)
      .set(requiredJob)
      .where(eq(requiredJobs.id, id))
      .returning();
    return updatedRequiredJob || undefined;
  }

  async deleteRequiredJob(id: string): Promise<boolean> {
    const result = await db.delete(requiredJobs).where(eq(requiredJobs.id, id));
    return result.rowCount > 0;
  }

  // Show Resource CRUD
  async getShowResources(workspaceId: string): Promise<ShowResource[]> {
    return await db.select().from(showResources).where(eq(showResources.workspaceId, workspaceId));
  }

  async getShowResourcesByShow(showId: string): Promise<ShowResource[]> {
    return await db.select().from(showResources).where(eq(showResources.showId, showId));
  }

  async createShowResource(showResource: InsertShowResource): Promise<ShowResource> {
    const [newShowResource] = await db.insert(showResources).values(showResource).returning();
    return newShowResource;
  }

  async deleteShowResource(id: string): Promise<boolean> {
    const result = await db.delete(showResources).where(eq(showResources.id, id));
    return result.rowCount > 0;
  }

  // Crew Assignment CRUD
  async getCrewAssignments(workspaceId: string): Promise<CrewAssignment[]> {
    return await db.select().from(crewAssignments).where(eq(crewAssignments.workspaceId, workspaceId));
  }

  async getCrewAssignmentsByShow(showId: string): Promise<CrewAssignment[]> {
    return await db.select().from(crewAssignments).where(eq(crewAssignments.showId, showId));
  }

  async getCrewAssignmentsByCrewMember(crewMemberId: string): Promise<CrewAssignment[]> {
    return await db.select().from(crewAssignments).where(eq(crewAssignments.crewMemberId, crewMemberId));
  }

  async createCrewAssignment(crewAssignment: InsertCrewAssignment): Promise<CrewAssignment> {
    const [newCrewAssignment] = await db.insert(crewAssignments).values(crewAssignment).returning();
    return newCrewAssignment;
  }

  async updateCrewAssignment(id: string, crewAssignment: Partial<InsertCrewAssignment>): Promise<CrewAssignment | undefined> {
    const [updatedCrewAssignment] = await db
      .update(crewAssignments)
      .set(crewAssignment)
      .where(eq(crewAssignments.id, id))
      .returning();
    return updatedCrewAssignment || undefined;
  }

  async deleteCrewAssignment(id: string): Promise<boolean> {
    const result = await db.delete(crewAssignments).where(eq(crewAssignments.id, id));
    return result.rowCount > 0;
  }

  // Crew Schedule CRUD
  async getCrewSchedules(workspaceId: string): Promise<CrewSchedule[]> {
    return await db.select().from(crewSchedules).where(eq(crewSchedules.workspaceId, workspaceId));
  }

  async getCrewSchedulesByCrewMember(crewMemberId: string): Promise<CrewSchedule[]> {
    return await db.select().from(crewSchedules).where(eq(crewSchedules.crewMemberId, crewMemberId));
  }

  async createCrewSchedule(crewSchedule: InsertCrewSchedule): Promise<CrewSchedule> {
    const [newCrewSchedule] = await db.insert(crewSchedules).values(crewSchedule).returning();
    return newCrewSchedule;
  }

  async updateCrewSchedule(id: string, crewSchedule: Partial<InsertCrewSchedule>): Promise<CrewSchedule | undefined> {
    const [updatedCrewSchedule] = await db
      .update(crewSchedules)
      .set(crewSchedule)
      .where(eq(crewSchedules.id, id))
      .returning();
    return updatedCrewSchedule || undefined;
  }

  async deleteCrewSchedule(id: string): Promise<boolean> {
    const result = await db.delete(crewSchedules).where(eq(crewSchedules.id, id));
    return result.rowCount > 0;
  }

  // Crew Time Off CRUD
  async getCrewTimeOffs(workspaceId: string): Promise<CrewTimeOff[]> {
    return await db.select().from(crewTimeOff).where(eq(crewTimeOff.workspaceId, workspaceId));
  }

  async getCrewTimeOffsByCrewMember(crewMemberId: string): Promise<CrewTimeOff[]> {
    return await db.select().from(crewTimeOff).where(eq(crewTimeOff.crewMemberId, crewMemberId));
  }

  async createCrewTimeOff(crewTimeOffData: InsertCrewTimeOff): Promise<CrewTimeOff> {
    const [newCrewTimeOff] = await db.insert(crewTimeOff).values(crewTimeOffData).returning();
    return newCrewTimeOff;
  }

  async updateCrewTimeOff(id: string, crewTimeOffData: Partial<InsertCrewTimeOff>): Promise<CrewTimeOff | undefined> {
    const [updatedCrewTimeOff] = await db
      .update(crewTimeOff)
      .set(crewTimeOffData)
      .where(eq(crewTimeOff.id, id))
      .returning();
    return updatedCrewTimeOff || undefined;
  }

  async deleteCrewTimeOff(id: string): Promise<boolean> {
    const result = await db.delete(crewTimeOff).where(eq(crewTimeOff.id, id));
    return result.rowCount > 0;
  }

  // Notification CRUD
  async getNotifications(workspaceId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.workspaceId, workspaceId));
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification || undefined;
  }

  async deleteNotification(id: string): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id));
    return result.rowCount > 0;
  }

  // Conflict Detection
  async detectCrewConflicts(showId: string, crewMemberId: string): Promise<boolean> {
    const show = await this.getShow(showId);
    if (!show) return false;

    const conflictingAssignments = await db
      .select()
      .from(crewAssignments)
      .innerJoin(shows, eq(crewAssignments.showId, shows.id))
      .where(
        and(
          eq(crewAssignments.crewMemberId, crewMemberId),
          gte(shows.endTime, show.startTime),
          lte(shows.startTime, show.endTime)
        )
      );

    return conflictingAssignments.length > 0;
  }

  async detectResourceConflicts(showId: string, resourceId: string): Promise<boolean> {
    const show = await this.getShow(showId);
    if (!show) return false;

    const conflictingResources = await db
      .select()
      .from(showResources)
      .innerJoin(shows, eq(showResources.showId, shows.id))
      .where(
        and(
          eq(showResources.resourceId, resourceId),
          gte(shows.endTime, show.startTime),
          lte(shows.startTime, show.endTime)
        )
      );

    return conflictingResources.length > 0;
  }
}

export const storage = new DatabaseStorage();