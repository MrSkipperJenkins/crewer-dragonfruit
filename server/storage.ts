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

// Add method to clear existing demo data
export async function clearDemoData(): Promise<void> {
  console.log("🧹 Clearing existing demo data...");
  
  // Delete in reverse order of dependencies
  await db.delete(notifications);
  await db.delete(crewTimeOff);
  await db.delete(crewSchedules);
  await db.delete(crewAssignments);
  await db.delete(showResources);
  await db.delete(requiredJobs);
  await db.delete(showCategoryAssignments);
  await db.delete(shows);
  await db.delete(showCategories);
  await db.delete(resources);
  await db.delete(crewMemberJobs);
  await db.delete(jobs);
  await db.delete(crewMembers);
  await db.delete(users);
  await db.delete(workspaces);
  
  console.log("✅ Demo data cleared successfully!");
}

// Add method to seed database with demo data
export async function seedDemoData(): Promise<void> {
  // Clear existing data first
  await clearDemoData();

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

  // Create users (10 per workspace)
  const workspace1Users = await db.insert(users).values([
    { username: "admin", password: "hashed_password_123", name: "Sarah Mitchell", email: "sarah.mitchell@bbcstudios.com", role: "admin", workspaceId: workspace1.id },
    { username: "producer1", password: "hashed_password_456", name: "James Carter", email: "james.carter@bbcstudios.com", role: "producer", workspaceId: workspace1.id },
    { username: "director1", password: "hashed_password_789", name: "Emily Watson", email: "emily.watson@bbcstudios.com", role: "director", workspaceId: workspace1.id },
    { username: "editor1", password: "hashed_password_012", name: "Michael Brown", email: "michael.brown@bbcstudios.com", role: "editor", workspaceId: workspace1.id },
    { username: "coordinator1", password: "hashed_password_345", name: "Lisa Chen", email: "lisa.chen@bbcstudios.com", role: "coordinator", workspaceId: workspace1.id },
    { username: "manager1", password: "hashed_password_678", name: "Robert Davis", email: "robert.davis@bbcstudios.com", role: "manager", workspaceId: workspace1.id },
    { username: "assistant1", password: "hashed_password_901", name: "Anna Wilson", email: "anna.wilson@bbcstudios.com", role: "assistant", workspaceId: workspace1.id },
    { username: "supervisor1", password: "hashed_password_234", name: "Chris Taylor", email: "chris.taylor@bbcstudios.com", role: "supervisor", workspaceId: workspace1.id },
    { username: "scheduler1", password: "hashed_password_567", name: "Maria Garcia", email: "maria.garcia@bbcstudios.com", role: "scheduler", workspaceId: workspace1.id },
    { username: "tech1", password: "hashed_password_890", name: "David Lee", email: "david.lee@bbcstudios.com", role: "technician", workspaceId: workspace1.id },
  ]).returning();

  const workspace2Users = await db.insert(users).values([
    { username: "producer", password: "hashed_password_456", name: "David Thompson", email: "david.thompson@itv.com", role: "producer", workspaceId: workspace2.id },
    { username: "admin2", password: "hashed_password_111", name: "Sophie Clarke", email: "sophie.clarke@itv.com", role: "admin", workspaceId: workspace2.id },
    { username: "director2", password: "hashed_password_222", name: "Oliver Smith", email: "oliver.smith@itv.com", role: "director", workspaceId: workspace2.id },
    { username: "editor2", password: "hashed_password_333", name: "Emma Jones", email: "emma.jones@itv.com", role: "editor", workspaceId: workspace2.id },
    { username: "coordinator2", password: "hashed_password_444", name: "Tom Anderson", email: "tom.anderson@itv.com", role: "coordinator", workspaceId: workspace2.id },
    { username: "manager2", password: "hashed_password_555", name: "Helen White", email: "helen.white@itv.com", role: "manager", workspaceId: workspace2.id },
    { username: "assistant2", password: "hashed_password_666", name: "Jack Turner", email: "jack.turner@itv.com", role: "assistant", workspaceId: workspace2.id },
    { username: "supervisor2", password: "hashed_password_777", name: "Lucy Martin", email: "lucy.martin@itv.com", role: "supervisor", workspaceId: workspace2.id },
    { username: "scheduler2", password: "hashed_password_888", name: "Peter Green", email: "peter.green@itv.com", role: "scheduler", workspaceId: workspace2.id },
    { username: "tech2", password: "hashed_password_999", name: "Rachel King", email: "rachel.king@itv.com", role: "technician", workspaceId: workspace2.id },
  ]).returning();

  const [user1] = workspace1Users;

  // Create crew members (20 per workspace)
  const workspace1CrewMembers = await db.insert(crewMembers).values([
    { name: "Alex Rodriguez", email: "alex.rodriguez@bbcstudios.com", phone: "+44 7700 900123", title: "Camera Operator", workspaceId: workspace1.id },
    { name: "Emma Johnson", email: "emma.johnson@bbcstudios.com", phone: "+44 7700 900456", title: "Sound Engineer", workspaceId: workspace1.id },
    { name: "James Wilson", email: "james.wilson@bbcstudios.com", phone: "+44 7700 900789", title: "Lighting Technician", workspaceId: workspace1.id },
    { name: "Sophie Turner", email: "sophie.turner@bbcstudios.com", phone: "+44 7700 900012", title: "Director", workspaceId: workspace1.id },
    { name: "Michael Chen", email: "michael.chen@bbcstudios.com", phone: "+44 7700 900345", title: "Production Assistant", workspaceId: workspace1.id },
    { name: "Sarah Williams", email: "sarah.williams@bbcstudios.com", phone: "+44 7700 900678", title: "Camera Operator", workspaceId: workspace1.id },
    { name: "Daniel Moore", email: "daniel.moore@bbcstudios.com", phone: "+44 7700 900901", title: "Video Editor", workspaceId: workspace1.id },
    { name: "Jessica Brown", email: "jessica.brown@bbcstudios.com", phone: "+44 7700 901234", title: "Makeup Artist", workspaceId: workspace1.id },
    { name: "Ryan Clark", email: "ryan.clark@bbcstudios.com", phone: "+44 7700 901567", title: "Gaffer", workspaceId: workspace1.id },
    { name: "Amanda Lewis", email: "amanda.lewis@bbcstudios.com", phone: "+44 7700 901890", title: "Script Supervisor", workspaceId: workspace1.id },
    { name: "Kevin Hall", email: "kevin.hall@bbcstudios.com", phone: "+44 7700 902123", title: "Boom Operator", workspaceId: workspace1.id },
    { name: "Rachel Green", email: "rachel.green@bbcstudios.com", phone: "+44 7700 902456", title: "Wardrobe Stylist", workspaceId: workspace1.id },
    { name: "Steven Adams", email: "steven.adams@bbcstudios.com", phone: "+44 7700 902789", title: "Set Decorator", workspaceId: workspace1.id },
    { name: "Laura Baker", email: "laura.baker@bbcstudios.com", phone: "+44 7700 903012", title: "Floor Manager", workspaceId: workspace1.id },
    { name: "Mark Thompson", email: "mark.thompson@bbcstudios.com", phone: "+44 7700 903345", title: "Camera Operator", workspaceId: workspace1.id },
    { name: "Nicole Parker", email: "nicole.parker@bbcstudios.com", phone: "+44 7700 903678", title: "Graphics Operator", workspaceId: workspace1.id },
    { name: "Andrew Hill", email: "andrew.hill@bbcstudios.com", phone: "+44 7700 903901", title: "Technical Director", workspaceId: workspace1.id },
    { name: "Michelle Young", email: "michelle.young@bbcstudios.com", phone: "+44 7700 904234", title: "Production Coordinator", workspaceId: workspace1.id },
    { name: "Brandon Scott", email: "brandon.scott@bbcstudios.com", phone: "+44 7700 904567", title: "Steadicam Operator", workspaceId: workspace1.id },
    { name: "Stephanie Wright", email: "stephanie.wright@bbcstudios.com", phone: "+44 7700 904890", title: "Location Manager", workspaceId: workspace1.id },
  ]).returning();

  const workspace2CrewMembers = await db.insert(crewMembers).values([
    { name: "Oliver Mason", email: "oliver.mason@itv.com", phone: "+44 7700 905123", title: "Camera Operator", workspaceId: workspace2.id },
    { name: "Charlotte Davis", email: "charlotte.davis@itv.com", phone: "+44 7700 905456", title: "Sound Engineer", workspaceId: workspace2.id },
    { name: "Benjamin Evans", email: "benjamin.evans@itv.com", phone: "+44 7700 905789", title: "Lighting Technician", workspaceId: workspace2.id },
    { name: "Amelia Roberts", email: "amelia.roberts@itv.com", phone: "+44 7700 906012", title: "Director", workspaceId: workspace2.id },
    { name: "Jacob Turner", email: "jacob.turner@itv.com", phone: "+44 7700 906345", title: "Production Assistant", workspaceId: workspace2.id },
    { name: "Isabella Cooper", email: "isabella.cooper@itv.com", phone: "+44 7700 906678", title: "Camera Operator", workspaceId: workspace2.id },
    { name: "Ethan Ward", email: "ethan.ward@itv.com", phone: "+44 7700 906901", title: "Video Editor", workspaceId: workspace2.id },
    { name: "Chloe Phillips", email: "chloe.phillips@itv.com", phone: "+44 7700 907234", title: "Makeup Artist", workspaceId: workspace2.id },
    { name: "Nathan Cox", email: "nathan.cox@itv.com", phone: "+44 7700 907567", title: "Gaffer", workspaceId: workspace2.id },
    { name: "Grace Ward", email: "grace.ward@itv.com", phone: "+44 7700 907890", title: "Script Supervisor", workspaceId: workspace2.id },
    { name: "Samuel Kelly", email: "samuel.kelly@itv.com", phone: "+44 7700 908123", title: "Boom Operator", workspaceId: workspace2.id },
    { name: "Zoe Bennett", email: "zoe.bennett@itv.com", phone: "+44 7700 908456", title: "Wardrobe Stylist", workspaceId: workspace2.id },
    { name: "Luke Murphy", email: "luke.murphy@itv.com", phone: "+44 7700 908789", title: "Set Decorator", workspaceId: workspace2.id },
    { name: "Lily Foster", email: "lily.foster@itv.com", phone: "+44 7700 909012", title: "Floor Manager", workspaceId: workspace2.id },
    { name: "Connor Bailey", email: "connor.bailey@itv.com", phone: "+44 7700 909345", title: "Camera Operator", workspaceId: workspace2.id },
    { name: "Mia Reed", email: "mia.reed@itv.com", phone: "+44 7700 909678", title: "Graphics Operator", workspaceId: workspace2.id },
    { name: "Tyler Hughes", email: "tyler.hughes@itv.com", phone: "+44 7700 909901", title: "Technical Director", workspaceId: workspace2.id },
    { name: "Sophia Morris", email: "sophia.morris@itv.com", phone: "+44 7700 910234", title: "Production Coordinator", workspaceId: workspace2.id },
    { name: "Mason Wood", email: "mason.wood@itv.com", phone: "+44 7700 910567", title: "Steadicam Operator", workspaceId: workspace2.id },
    { name: "Ava Price", email: "ava.price@itv.com", phone: "+44 7700 910890", title: "Location Manager", workspaceId: workspace2.id },
  ]).returning();

  const [crewMember1, crewMember2, crewMember3, crewMember4, crewMember5] = workspace1CrewMembers;

  // Create jobs (10 per workspace)
  const workspace1Jobs = await db.insert(jobs).values([
    { title: "Camera Operator", description: "Operate professional broadcast cameras for live and recorded productions", workspaceId: workspace1.id },
    { title: "Sound Engineer", description: "Manage audio equipment and ensure high-quality sound recording", workspaceId: workspace1.id },
    { title: "Lighting Technician", description: "Set up and operate lighting equipment for optimal visual quality", workspaceId: workspace1.id },
    { title: "Director", description: "Lead creative direction and coordinate production activities", workspaceId: workspace1.id },
    { title: "Production Assistant", description: "Support production team with various tasks and coordination", workspaceId: workspace1.id },
    { title: "Video Editor", description: "Edit and post-process video content for broadcast quality", workspaceId: workspace1.id },
    { title: "Makeup Artist", description: "Apply makeup and styling for on-screen talent", workspaceId: workspace1.id },
    { title: "Floor Manager", description: "Coordinate activities on set and manage crew during filming", workspaceId: workspace1.id },
    { title: "Graphics Operator", description: "Create and manage on-screen graphics and visual elements", workspaceId: workspace1.id },
    { title: "Technical Director", description: "Oversee technical aspects of production and equipment", workspaceId: workspace1.id },
  ]).returning();

  const workspace2Jobs = await db.insert(jobs).values([
    { title: "Camera Operator", description: "Operate professional broadcast cameras for live and recorded productions", workspaceId: workspace2.id },
    { title: "Sound Engineer", description: "Manage audio equipment and ensure high-quality sound recording", workspaceId: workspace2.id },
    { title: "Lighting Technician", description: "Set up and operate lighting equipment for optimal visual quality", workspaceId: workspace2.id },
    { title: "Director", description: "Lead creative direction and coordinate production activities", workspaceId: workspace2.id },
    { title: "Production Assistant", description: "Support production team with various tasks and coordination", workspaceId: workspace2.id },
    { title: "Video Editor", description: "Edit and post-process video content for broadcast quality", workspaceId: workspace2.id },
    { title: "Makeup Artist", description: "Apply makeup and styling for on-screen talent", workspaceId: workspace2.id },
    { title: "Floor Manager", description: "Coordinate activities on set and manage crew during filming", workspaceId: workspace2.id },
    { title: "Graphics Operator", description: "Create and manage on-screen graphics and visual elements", workspaceId: workspace2.id },
    { title: "Technical Director", description: "Oversee technical aspects of production and equipment", workspaceId: workspace2.id },
  ]).returning();

  const [job1, job2, job3, job4, job5] = workspace1Jobs;

  // Create crew member job assignments
  await db.insert(crewMemberJobs).values([
    { crewMemberId: crewMember1.id, jobId: job1.id, workspaceId: workspace1.id },
    { crewMemberId: crewMember2.id, jobId: job2.id, workspaceId: workspace1.id },
    { crewMemberId: crewMember3.id, jobId: job3.id, workspaceId: workspace1.id },
    { crewMemberId: crewMember4.id, jobId: job4.id, workspaceId: workspace1.id },
    { crewMemberId: crewMember5.id, jobId: job5.id, workspaceId: workspace1.id },
  ]);

  // Create resources (10 per workspace)
  const workspace1Resources = await db.insert(resources).values([
    { name: "Studio A", type: "studio", description: "Main production studio with green screen capability", workspaceId: workspace1.id },
    { name: "Control Room 1", type: "control_room", description: "Primary control room with 4K broadcasting equipment", workspaceId: workspace1.id },
    { name: "Camera Kit #1", type: "equipment", description: "Professional broadcast camera with tripod and accessories", workspaceId: workspace1.id },
    { name: "Sound Mixing Board", type: "equipment", description: "16-channel digital mixing console", workspaceId: workspace1.id },
    { name: "Studio B", type: "studio", description: "Secondary studio for smaller productions", workspaceId: workspace1.id },
    { name: "Control Room 2", type: "control_room", description: "Backup control room with HD equipment", workspaceId: workspace1.id },
    { name: "Camera Kit #2", type: "equipment", description: "Secondary camera setup with wireless capabilities", workspaceId: workspace1.id },
    { name: "Lighting Rig Alpha", type: "equipment", description: "Professional LED lighting setup for studio productions", workspaceId: workspace1.id },
    { name: "Edit Suite 1", type: "control_room", description: "Post-production editing suite with color grading", workspaceId: workspace1.id },
    { name: "Mobile Unit", type: "equipment", description: "Portable broadcast equipment for location shoots", workspaceId: workspace1.id },
  ]).returning();

  const workspace2Resources = await db.insert(resources).values([
    { name: "Studio Alpha", type: "studio", description: "Premier production studio with advanced facilities", workspaceId: workspace2.id },
    { name: "Master Control", type: "control_room", description: "Main control room with latest broadcast technology", workspaceId: workspace2.id },
    { name: "Camera System A", type: "equipment", description: "High-end camera system for premium content", workspaceId: workspace2.id },
    { name: "Audio Console Pro", type: "equipment", description: "Professional 32-channel audio mixing console", workspaceId: workspace2.id },
    { name: "Studio Beta", type: "studio", description: "Flexible studio space for various production types", workspaceId: workspace2.id },
    { name: "Control Room Beta", type: "control_room", description: "Secondary control room for simultaneous productions", workspaceId: workspace2.id },
    { name: "Camera System B", type: "equipment", description: "Versatile camera setup for documentary work", workspaceId: workspace2.id },
    { name: "Lighting System Pro", type: "equipment", description: "Advanced lighting system with smart controls", workspaceId: workspace2.id },
    { name: "Post-Production Suite", type: "control_room", description: "Complete post-production facility with latest software", workspaceId: workspace2.id },
    { name: "OB Van", type: "equipment", description: "Outside broadcast vehicle for remote productions", workspaceId: workspace2.id },
  ]).returning();

  const [resource1, resource2, resource3, resource4] = workspace1Resources;

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
    return (result.rowCount || 0) > 0;
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
    return (result.rowCount || 0) > 0;
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
    return (result.rowCount || 0) > 0;
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
    return (result.rowCount || 0) > 0;
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
    return (result.rowCount || 0) > 0;
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
    return (result.rowCount || 0) > 0;
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
    return (result.rowCount || 0) > 0;
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
    console.log("Database update - ID:", id);
    console.log("Database update - Data:", show);
    
    const [updatedShow] = await db
      .update(shows)
      .set(show)
      .where(eq(shows.id, id))
      .returning();
    
    console.log("Database update - Result:", updatedShow);
    return updatedShow || undefined;
  }

  async deleteShow(id: string): Promise<boolean> {
    const result = await db.delete(shows).where(eq(shows.id, id));
    return (result.rowCount || 0) > 0;
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
    return (result.rowCount || 0) > 0;
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
    return (result.rowCount || 0) > 0;
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
    return (result.rowCount || 0) > 0;
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
    return (result.rowCount || 0) > 0;
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
    return (result.rowCount || 0) > 0;
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
    return (result.rowCount || 0) > 0;
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
    return (result.rowCount || 0) > 0;
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

// Enhanced demo data creation
async function createEnhancedDemoData() {
  try {
    console.log("🔄 Creating enhanced demo data...");
    
    // Clear existing data in proper order to respect foreign key constraints
    await db.delete(notifications);
    await db.delete(crewTimeOff);
    await db.delete(crewSchedules);
    await db.delete(crewAssignments);
    await db.delete(showResources);
    await db.delete(requiredJobs);
    await db.delete(showCategoryAssignments);
    await db.delete(crewMemberJobs); // Delete this before crew members
    await db.delete(shows);
    await db.delete(crewMembers);
    await db.delete(resources);
    await db.delete(jobs);
    await db.delete(showCategories);
    await db.delete(users);
    await db.delete(workspaces);
    
    // Create base demo data
    await seedDemoData();
    
    // Get workspace and user data
    const [workspace] = await db.select().from(workspaces).limit(1);
    const [user] = await db.select().from(users).limit(1);
    
    if (!workspace || !user) {
      console.error("Failed to get workspace or user data");
      return;
    }
    
    // Create realistic notifications for dashboard
    const notificationData = [
      {
        userId: user.id,
        workspaceId: workspace.id,
        type: 'warning',
        title: 'Crew Assignment Conflict',
        message: 'John Smith is double-booked for Studio A tomorrow morning. Please reassign.',
        relatedEntityType: 'crew_assignment',
        relatedEntityId: null,
        read: false,
        readAt: null,
      },
      {
        userId: user.id,
        workspaceId: workspace.id,
        type: 'info',
        title: 'New Show Scheduled',
        message: 'Evening News Special has been added to the schedule for next week.',
        relatedEntityType: 'show',
        relatedEntityId: null,
        read: false,
        readAt: null,
      },
      {
        userId: user.id,
        workspaceId: workspace.id,
        type: 'error',
        title: 'Equipment Failure',
        message: 'Camera 3 in Studio B is malfunctioning and needs immediate repair.',
        relatedEntityType: 'resource',
        relatedEntityId: null,
        read: false,
        readAt: null,
      },
      {
        userId: user.id,
        workspaceId: workspace.id,
        type: 'success',
        title: 'Show Completed Successfully',
        message: 'Morning Talk Show wrapped on time with all deliverables complete.',
        relatedEntityType: 'show',
        relatedEntityId: null,
        read: true,
        readAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        userId: user.id,
        workspaceId: workspace.id,
        type: 'warning',
        title: 'Low Crew Availability',
        message: 'Only 2 camera operators available for next Friday. Consider hiring freelancers.',
        relatedEntityType: 'crew_member',
        relatedEntityId: null,
        read: false,
        readAt: null,
      },
      {
        userId: user.id,
        workspaceId: workspace.id,
        type: 'info',
        title: 'Resource Maintenance Scheduled',
        message: 'Studio A will be offline for maintenance this weekend.',
        relatedEntityType: 'resource',
        relatedEntityId: null,
        read: true,
        readAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        userId: user.id,
        workspaceId: workspace.id,
        type: 'warning',
        title: 'Budget Alert',
        message: 'Production costs for Drama Series are 15% over budget.',
        relatedEntityType: 'show',
        relatedEntityId: null,
        read: false,
        readAt: null,
      },
      {
        userId: user.id,
        workspaceId: workspace.id,
        type: 'success',
        title: 'Crew Training Completed',
        message: 'All sound engineers have completed safety certification.',
        relatedEntityType: 'crew_member',
        relatedEntityId: null,
        read: true,
        readAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      }
    ];
    
    for (const notification of notificationData) {
      await db.insert(notifications).values(notification);
    }
    
    // Update existing shows with varied statuses for realistic dashboard metrics
    const existingShows = await db.select().from(shows).where(eq(shows.workspaceId, workspace.id));
    
    // Set different statuses for shows to create realistic dashboard data
    if (existingShows.length > 0) {
      // Make some shows active/scheduled
      await db.update(shows)
        .set({ status: 'scheduled' })
        .where(eq(shows.id, existingShows[0].id));
        
      if (existingShows.length > 1) {
        await db.update(shows)
          .set({ status: 'in_progress' })
          .where(eq(shows.id, existingShows[1].id));
      }
      
      if (existingShows.length > 2) {
        await db.update(shows)
          .set({ status: 'completed' })
          .where(eq(shows.id, existingShows[2].id));
      }
    }
    
    // Create additional upcoming shows for dashboard metrics
    const upcomingShowsData = [
      {
        title: 'Evening News Special',
        description: 'Breaking news coverage and analysis',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // Tomorrow + 2 hours
        status: 'scheduled',
        color: '#ef4444',
        workspaceId: workspace.id,
      },
      {
        title: 'Weekend Sports Review',
        description: 'Highlights and analysis from weekend games',
        startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // + 1.5 hours
        status: 'scheduled',
        color: '#10b981',
        workspaceId: workspace.id,
      },
      {
        title: 'Live Concert Broadcast',
        description: 'Live performance from the city hall',
        startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // + 3 hours
        status: 'scheduled',
        color: '#8b5cf6',
        workspaceId: workspace.id,
      }
    ];
    
    for (const showData of upcomingShowsData) {
      await db.insert(shows).values(showData);
    }
    
    console.log("✅ Enhanced demo data created successfully!");
    console.log("📊 Dashboard now includes:");
    console.log("   • 8 realistic notifications (4 unread)");
    console.log("   • Multiple show statuses for metrics");
    console.log("   • 3 additional upcoming shows");
    console.log("   • Varied notification types (info, warning, error, success)");
    
  } catch (error) {
    console.error("❌ Failed to create enhanced demo data:", error);
  }
}

// Initialize database with enhanced demo data on startup
createEnhancedDemoData().catch(console.error);

export const storage = new DatabaseStorage();