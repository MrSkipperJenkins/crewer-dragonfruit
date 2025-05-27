import { 
  type Workspace, type InsertWorkspace,
  type User, type InsertUser,
  type CrewMember, type InsertCrewMember,
  type Job, type InsertJob,
  type CrewMemberJob, type InsertCrewMemberJob,
  type Resource, type InsertResource,
  type ShowCategory, type InsertShowCategory,
  type Show, type InsertShow,
  type ShowCategoryAssignment, type InsertShowCategoryAssignment,
  type RequiredJob, type InsertRequiredJob, 
  type ShowResource, type InsertShowResource,
  type CrewAssignment, type InsertCrewAssignment,
  type CrewSchedule, type InsertCrewSchedule,
  type CrewTimeOff, type InsertCrewTimeOff,
  type Notification, type InsertNotification
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // Workspace CRUD
  getWorkspaces(): Promise<Workspace[]>;
  getWorkspace(id: string): Promise<Workspace | undefined>;
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

export class MemStorage implements IStorage {
  private workspaces: Map<string, Workspace>;
  private users: Map<string, User>;
  private crewMembers: Map<string, CrewMember>;
  private jobs: Map<string, Job>;
  private crewMemberJobs: Map<string, CrewMemberJob>;
  private resources: Map<string, Resource>;
  private showCategories: Map<string, ShowCategory>;
  private shows: Map<string, Show>;
  private showCategoryAssignments: Map<string, ShowCategoryAssignment>;
  private requiredJobs: Map<string, RequiredJob>;
  private showResources: Map<string, ShowResource>;
  private crewAssignments: Map<string, CrewAssignment>;
  private crewSchedules: Map<string, CrewSchedule>;
  private crewTimeOffs: Map<string, CrewTimeOff>;
  private notifications: Map<string, Notification>;

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

    // Add a demo workspace
    const workspaceId = "cc7df93a-dfc3-4dda-9832-a7f5f20a3b1e";
    this.workspaces.set(workspaceId, {
      id: workspaceId,
      name: "ABC Productions",
      createdAt: new Date(),
    });

    // Add a demo user
    const userId = "38ccfc25-287d-4ac1-b832-5a5f3a1b1575";
    this.users.set(userId, {
      id: userId,
      username: "admin",
      password: "password", // In a real app, this would be hashed
      name: "Sarah Johnson",
      email: "sarah@example.com",
      role: "Production Manager",
      workspaceId,
      createdAt: new Date(),
    });

    // Add demo jobs
    const jobIds = {
      technicalDirector: "24e8b8d0-68a7-4b27-9e1b-d20edc9a2b8a",
      cameraOperator: "63c7ecef-37fa-4cb9-a673-21a23e2d9975",
      audioEngineer: "b1c8fa1a-cd68-4f0d-9af1-c82c9a9c2df3",
      graphicsOperator: "95d06722-f0e5-413c-b38a-5c3c77aceda3"
    };

    for (const [key, id] of Object.entries(jobIds)) {
      let title = key.replace(/([A-Z])/g, ' $1').trim();
      title = title.charAt(0).toUpperCase() + title.slice(1);
      
      this.jobs.set(id, {
        id,
        title,
        description: `Responsible for ${title.toLowerCase()} duties`,
        workspaceId,
        createdAt: new Date(),
      });
    }

    // Add demo resources
    const resourceIds = {
      studioA: "8d85d937-1d8a-4dad-b628-52f9e15a8ba6",
      studioB: "32e7bd6b-a6fc-4dc9-bc34-45c2e4e699ab",
      controlRoom1: "a4f7e6ce-5c29-41e7-a4cd-5bfaa3c8fb22",
      controlRoom2: "ea6cbb94-8cbf-4cd3-b510-2e5ffcd79656",
      cameraSetA: "78ab4e13-fcbf-44c5-9d3a-86b3a0ad8b1b"
    };

    const resourceTypes = {
      studioA: "studio",
      studioB: "studio",
      controlRoom1: "control_room",
      controlRoom2: "control_room",
      cameraSetA: "equipment"
    };

    for (const [key, id] of Object.entries(resourceIds)) {
      let name = key.replace(/([A-Z])/g, ' $1').trim();
      name = name.charAt(0).toUpperCase() + name.slice(1);
      
      this.resources.set(id, {
        id,
        name,
        type: resourceTypes[key as keyof typeof resourceTypes],
        description: `${name} for production`,
        workspaceId,
        createdAt: new Date(),
      });
    }

    // Add demo show categories
    const categoryIds = {
      news: "f7e5bd37-4dba-47ef-9d5b-c520eda3cc9e",
      sports: "af3ba98c-1e67-45e8-acf8-53c6e475af9b",
      entertainment: "d5a2c98b-62a7-48c9-ba09-17e4ec7b3f23",
      cooking: "7ba0e54d-2f9c-40c2-9a97-c8fd65c9014d"
    };

    const categoryColors = {
      news: "#22c55e", // green
      sports: "#f97316", // orange
      entertainment: "#8b5cf6", // purple
      cooking: "#3b82f6" // blue
    };

    for (const [key, id] of Object.entries(categoryIds)) {
      let name = key.charAt(0).toUpperCase() + key.slice(1);
      
      this.showCategories.set(id, {
        id,
        name,
        color: categoryColors[key as keyof typeof categoryColors],
        workspaceId,
        createdAt: new Date(),
      });
    }

    // Add demo crew members
    const crewMemberIds = {
      johnCooper: "c94c12f7-40dc-4cc9-9b2e-92238ade6ca9",
      lisaRodriguez: "9a3f8e7d-6c5b-4a2d-90e1-83f42a15b8c7",
      davidChen: "b2e1a0d9-7c6f-4e3d-a5b2-9c0d8e1a7f5b"
    };

    this.crewMembers.set(crewMemberIds.johnCooper, {
      id: crewMemberIds.johnCooper,
      name: "John Cooper",
      email: "john@example.com",
      phone: "555-123-4567",
      title: "Technical Director",
      workspaceId,
      createdAt: new Date(),
    });

    this.crewMembers.set(crewMemberIds.lisaRodriguez, {
      id: crewMemberIds.lisaRodriguez,
      name: "Lisa Rodriguez",
      email: "lisa@example.com",
      phone: "555-123-4568",
      title: "Camera Operator",
      workspaceId,
      createdAt: new Date(),
    });

    this.crewMembers.set(crewMemberIds.davidChen, {
      id: crewMemberIds.davidChen,
      name: "David Chen",
      email: "david@example.com",
      phone: "555-123-4569",
      title: "Audio Engineer",
      workspaceId,
      createdAt: new Date(),
    });

    // Link crew members to jobs
    const crewJobId1 = "e1d2c3b4-a5b6-7c8d-9e0f-a1b2c3d4e5f6";
    this.crewMemberJobs.set(crewJobId1, {
      id: crewJobId1,
      crewMemberId: crewMemberIds.johnCooper,
      jobId: jobIds.technicalDirector,
      workspaceId,
      createdAt: new Date()
    });

    const crewJobId2 = "f6e5d4c3-b2a1-0f9e-8d7c-6b5a4b3c2d1e";
    this.crewMemberJobs.set(crewJobId2, {
      id: crewJobId2,
      crewMemberId: crewMemberIds.lisaRodriguez,
      jobId: jobIds.cameraOperator,
      workspaceId,
      createdAt: new Date()
    });

    const crewJobId3 = "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6";
    this.crewMemberJobs.set(crewJobId3, {
      id: crewJobId3,
      crewMemberId: crewMemberIds.davidChen,
      jobId: jobIds.audioEngineer,
      workspaceId,
      createdAt: new Date()
    });

    // Add a few demo shows
    const showIds = {
      morningNews: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p7",
      cookingShow: "b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7",
      talkShow: "c3d4e5f6-g7h8-9i0j-1k2l-m3n4o5p6q7r8",
      sportsReview: "d4e5f6g7-h8i9-0j1k-2l3m-n4o5p6q7r8s9"
    };

    // Helper to set time component of a date
    const setTime = (date: Date, hours: number, minutes: number = 0) => {
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      return newDate;
    };

    // Get current date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create date for next week to use in shows
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    // Morning News - weekdays 6:00 AM - 9:00 AM
    this.shows.set(showIds.morningNews, {
      id: showIds.morningNews,
      title: "Morning News",
      description: "Daily News Program",
      startTime: setTime(today, 6), // 6:00 AM
      endTime: setTime(today, 9),   // 9:00 AM
      recurringPattern: "WEEKLY:1,2,3,4,5", // Monday through Friday
      notes: "Morning anchors: Sarah Johnson and Michael Torres. Include traffic report at 7:45 AM. Weather updates every 30 minutes.",
      status: "scheduled",
      color: "#3b82f6", // Blue for news
      workspaceId,
      createdAt: new Date()
    });

    // Cooking Show - Tuesday 10:00 AM - 2:00 PM
    this.shows.set(showIds.cookingShow, {
      id: showIds.cookingShow,
      title: "Cooking Show",
      description: "Weekly cooking program",
      startTime: setTime(today, 10), // 10:00 AM
      endTime: setTime(today, 14),   // 2:00 PM
      recurringPattern: "WEEKLY:2",  // Tuesday
      notes: "Guest chef each week. Kitchen needs to be set up 90 minutes before show.",
      status: "scheduled",
      color: "#f59e0b", // Amber for cooking
      workspaceId,
      createdAt: new Date()
    });

    // Talk Show - Thursday/Friday 3:00 PM - 7:00 PM
    this.shows.set(showIds.talkShow, {
      id: showIds.talkShow,
      title: "Talk Show",
      description: "Afternoon talk show",
      startTime: setTime(today, 15), // 3:00 PM
      endTime: setTime(today, 19),   // 7:00 PM
      recurringPattern: "WEEKLY:4,5", // Thursday and Friday
      notes: "Live audience. Pre-show meeting at 1:30 PM.",
      status: "scheduled",
      color: "#8b5cf6", // Violet for talk shows
      workspaceId,
      createdAt: new Date()
    });

    // Sports Review - Sunday 4:00 PM - 8:00 PM
    this.shows.set(showIds.sportsReview, {
      id: showIds.sportsReview,
      title: "Sports Review",
      description: "Weekly sports recap",
      startTime: setTime(today, 16), // 4:00 PM
      endTime: setTime(today, 20),   // 8:00 PM
      recurringPattern: "WEEKLY:0",  // Sunday
      notes: "Include highlights from weekend games.",
      status: "scheduled",
      color: "#10b981", // Emerald for sports
      workspaceId,
      createdAt: new Date()
    });

    // Add show category assignments
    const showCatId1 = "e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0";
    this.showCategoryAssignments.set(showCatId1, {
      id: showCatId1,
      showId: showIds.morningNews,
      categoryId: categoryIds.news,
      workspaceId,
      createdAt: new Date()
    });

    const showCatId2 = "f6g7h8i9-j0k1-l2m3-n4o5-p6q7r8s9t0u1";
    this.showCategoryAssignments.set(showCatId2, {
      id: showCatId2,
      showId: showIds.cookingShow,
      categoryId: categoryIds.cooking,
      workspaceId,
      createdAt: new Date()
    });

    const showCatId3 = "g7h8i9j0-k1l2-m3n4-o5p6-q7r8s9t0u1v2";
    this.showCategoryAssignments.set(showCatId3, {
      id: showCatId3,
      showId: showIds.talkShow,
      categoryId: categoryIds.entertainment,
      workspaceId,
      createdAt: new Date()
    });

    const showCatId4 = "h8i9j0k1-l2m3-n4o5-p6q7-r8s9t0u1v2w3";
    this.showCategoryAssignments.set(showCatId4, {
      id: showCatId4,
      showId: showIds.sportsReview,
      categoryId: categoryIds.sports,
      workspaceId,
      createdAt: new Date()
    });

    // Add show resources
    // Morning News resources
    const morningNewsStudioA = "i9j0k1l2-m3n4-o5p6-q7r8-s9t0u1v2w3x4";
    this.showResources.set(morningNewsStudioA, {
      id: morningNewsStudioA,
      showId: showIds.morningNews,
      resourceId: resourceIds.studioA,
      workspaceId,
      createdAt: new Date()
    });

    const morningNewsControlRoom = "j0k1l2m3-n4o5-p6q7-r8s9-t0u1v2w3x4y5";
    this.showResources.set(morningNewsControlRoom, {
      id: morningNewsControlRoom,
      showId: showIds.morningNews,
      resourceId: resourceIds.controlRoom1,
      workspaceId,
      createdAt: new Date()
    });

    const morningNewsCameras = "k1l2m3n4-o5p6-q7r8-s9t0-u1v2w3x4y5z6";
    this.showResources.set(morningNewsCameras, {
      id: morningNewsCameras,
      showId: showIds.morningNews,
      resourceId: resourceIds.cameraSetA,
      workspaceId,
      createdAt: new Date()
    });

    // Cooking Show resources
    const cookingShowStudioB = "l2m3n4o5-p6q7-r8s9-t0u1-v2w3x4y5z6a7";
    this.showResources.set(cookingShowStudioB, {
      id: cookingShowStudioB,
      showId: showIds.cookingShow,
      resourceId: resourceIds.studioB,
      workspaceId,
      createdAt: new Date()
    });

    const cookingShowControlRoom = "m3n4o5p6-q7r8-s9t0-u1v2-w3x4y5z6a7b8";
    this.showResources.set(cookingShowControlRoom, {
      id: cookingShowControlRoom,
      showId: showIds.cookingShow,
      resourceId: resourceIds.controlRoom1,
      workspaceId,
      createdAt: new Date()
    });

    // Talk Show resources
    const talkShowStudioB = "n4o5p6q7-r8s9-t0u1-v2w3-x4y5z6a7b8c9";
    this.showResources.set(talkShowStudioB, {
      id: talkShowStudioB,
      showId: showIds.talkShow,
      resourceId: resourceIds.studioB,
      workspaceId,
      createdAt: new Date()
    });

    const talkShowControlRoom = "o5p6q7r8-s9t0-u1v2-w3x4-y5z6a7b8c9d0";
    this.showResources.set(talkShowControlRoom, {
      id: talkShowControlRoom,
      showId: showIds.talkShow,
      resourceId: resourceIds.controlRoom1,
      workspaceId,
      createdAt: new Date()
    });

    // Sports Review resources
    const sportsReviewControlRoom = "p6q7r8s9-t0u1-v2w3-x4y5-z6a7b8c9d0e1";
    this.showResources.set(sportsReviewControlRoom, {
      id: sportsReviewControlRoom,
      showId: showIds.sportsReview,
      resourceId: resourceIds.controlRoom2,
      workspaceId,
      createdAt: new Date()
    });

    const sportsReviewCameras = "q7r8s9t0-u1v2-w3x4-y5z6-a7b8c9d0e1f2";
    this.showResources.set(sportsReviewCameras, {
      id: sportsReviewCameras,
      showId: showIds.sportsReview,
      resourceId: resourceIds.cameraSetA,
      workspaceId,
      createdAt: new Date()
    });

    // Add required jobs
    const requiredJobId1 = "r8s9t0u1-v2w3-x4y5-z6a7-b8c9d0e1f2g3";
    this.requiredJobs.set(requiredJobId1, {
      id: requiredJobId1,
      showId: showIds.morningNews,
      jobId: jobIds.technicalDirector,
      quantity: 1,
      notes: "Experienced TD needed",
      workspaceId,
      createdAt: new Date()
    });

    const requiredJobId2 = "s9t0u1v2-w3x4-y5z6-a7b8-c9d0e1f2g3h4";
    this.requiredJobs.set(requiredJobId2, {
      id: requiredJobId2,
      showId: showIds.morningNews,
      jobId: jobIds.cameraOperator,
      quantity: 3,
      notes: "Need operators for all three cameras",
      workspaceId,
      createdAt: new Date()
    });

    const requiredJobId3 = "t0u1v2w3-x4y5-z6a7-b8c9-d0e1f2g3h4i5";
    this.requiredJobs.set(requiredJobId3, {
      id: requiredJobId3,
      showId: showIds.morningNews,
      jobId: jobIds.audioEngineer,
      quantity: 1,
      notes: "",
      workspaceId,
      createdAt: new Date()
    });

    const requiredJobId4 = "u1v2w3x4-y5z6-a7b8-c9d0-e1f2g3h4i5j6";
    this.requiredJobs.set(requiredJobId4, {
      id: requiredJobId4,
      showId: showIds.morningNews,
      jobId: jobIds.graphicsOperator,
      quantity: 1,
      notes: "",
      workspaceId,
      createdAt: new Date()
    });

    // Add crew assignments
    const crewAssignId1 = "v2w3x4y5-z6a7-b8c9-d0e1-f2g3h4i5j6k7";
    this.crewAssignments.set(crewAssignId1, {
      id: crewAssignId1,
      showId: showIds.morningNews,
      crewMemberId: crewMemberIds.johnCooper,
      jobId: jobIds.technicalDirector,
      status: "confirmed",
      workspaceId,
      createdAt: new Date()
    });

    const crewAssignId2 = "w3x4y5z6-a7b8-c9d0-e1f2-g3h4i5j6k7l8";
    this.crewAssignments.set(crewAssignId2, {
      id: crewAssignId2,
      showId: showIds.morningNews,
      crewMemberId: crewMemberIds.lisaRodriguez,
      jobId: jobIds.cameraOperator,
      status: "confirmed",
      workspaceId,
      createdAt: new Date()
    });

    const crewAssignId3 = "x4y5z6a7-b8c9-d0e1-f2g3-h4i5j6k7l8m9";
    this.crewAssignments.set(crewAssignId3, {
      id: crewAssignId3,
      showId: showIds.morningNews,
      crewMemberId: crewMemberIds.davidChen,
      jobId: jobIds.audioEngineer,
      status: "pending",
      workspaceId,
      createdAt: new Date()
    });

    // Add notifications
    const notificationId1 = "y5z6a7b8-c9d0-e1f2-g3h4-i5j6k7l8m9n0";
    this.notifications.set(notificationId1, {
      id: notificationId1,
      userId,
      title: "Schedule Update",
      message: "Morning News has been scheduled for next week",
      type: "info",
      read: false,
      relatedEntityType: "show",
      relatedEntityId: showIds.morningNews,
      workspaceId,
      createdAt: new Date()
    });

    const notificationId2 = "z6a7b8c9-d0e1-f2g3-h4i5-j6k7l8m9n0o1";
    this.notifications.set(notificationId2, {
      id: notificationId2,
      userId,
      title: "Crew Conflict",
      message: "David Chen has a scheduling conflict for Morning News",
      type: "warning",
      read: false,
      relatedEntityType: "crew_member",
      relatedEntityId: crewMemberIds.davidChen,
      workspaceId,
      createdAt: new Date()
    });

    const notificationId3 = "a7b8c9d0-e1f2-g3h4-i5j6-k7l8m9n0o1p2";
    this.notifications.set(notificationId3, {
      id: notificationId3,
      userId,
      title: "Resource Added",
      message: "New camera equipment has been added to inventory",
      type: "success",
      read: true,
      relatedEntityType: "resource",
      relatedEntityId: resourceIds.cameraSetA,
      workspaceId,
      createdAt: new Date()
    });
  }

  // Workspace CRUD
  async getWorkspaces(): Promise<Workspace[]> {
    return Array.from(this.workspaces.values());
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    return this.workspaces.get(id);
  }

  async createWorkspace(workspace: InsertWorkspace): Promise<Workspace> {
    const id = crypto.randomUUID();
    const newWorkspace: Workspace = {
      id,
      ...workspace,
      createdAt: new Date()
    };
    this.workspaces.set(id, newWorkspace);
    return newWorkspace;
  }

  async updateWorkspace(id: string, workspace: Partial<InsertWorkspace>): Promise<Workspace | undefined> {
    const existingWorkspace = this.workspaces.get(id);
    if (!existingWorkspace) return undefined;

    const updatedWorkspace = { ...existingWorkspace, ...workspace };
    this.workspaces.set(id, updatedWorkspace);
    return updatedWorkspace;
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    return this.workspaces.delete(id);
  }

  // User CRUD
  async getUsers(workspaceId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.workspaceId === workspaceId);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    const newUser: User = {
      id,
      ...user,
      createdAt: new Date()
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Crew Member CRUD
  async getCrewMembers(workspaceId: string): Promise<CrewMember[]> {
    return Array.from(this.crewMembers.values()).filter(crewMember => crewMember.workspaceId === workspaceId);
  }

  async getCrewMember(id: string): Promise<CrewMember | undefined> {
    return this.crewMembers.get(id);
  }

  async createCrewMember(crewMember: InsertCrewMember): Promise<CrewMember> {
    const id = crypto.randomUUID();
    const newCrewMember: CrewMember = {
      id,
      ...crewMember,
      createdAt: new Date()
    };
    this.crewMembers.set(id, newCrewMember);
    return newCrewMember;
  }

  async updateCrewMember(id: string, crewMember: Partial<InsertCrewMember>): Promise<CrewMember | undefined> {
    const existingCrewMember = this.crewMembers.get(id);
    if (!existingCrewMember) return undefined;

    const updatedCrewMember = { ...existingCrewMember, ...crewMember };
    this.crewMembers.set(id, updatedCrewMember);
    return updatedCrewMember;
  }

  async deleteCrewMember(id: string): Promise<boolean> {
    return this.crewMembers.delete(id);
  }

  // Job CRUD
  async getJobs(workspaceId: string): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.workspaceId === workspaceId);
  }

  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async createJob(job: InsertJob): Promise<Job> {
    const id = crypto.randomUUID();
    const newJob: Job = {
      id,
      ...job,
      createdAt: new Date()
    };
    this.jobs.set(id, newJob);
    return newJob;
  }

  async updateJob(id: string, job: Partial<InsertJob>): Promise<Job | undefined> {
    const existingJob = this.jobs.get(id);
    if (!existingJob) return undefined;

    const updatedJob = { ...existingJob, ...job };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  async deleteJob(id: string): Promise<boolean> {
    return this.jobs.delete(id);
  }

  // Crew Member Job CRUD
  async getCrewMemberJobs(workspaceId: string): Promise<CrewMemberJob[]> {
    return Array.from(this.crewMemberJobs.values()).filter(crewMemberJob => crewMemberJob.workspaceId === workspaceId);
  }

  async getCrewMemberJobsByCrewMember(crewMemberId: string): Promise<CrewMemberJob[]> {
    return Array.from(this.crewMemberJobs.values()).filter(crewMemberJob => crewMemberJob.crewMemberId === crewMemberId);
  }

  async createCrewMemberJob(crewMemberJob: InsertCrewMemberJob): Promise<CrewMemberJob> {
    const id = crypto.randomUUID();
    const newCrewMemberJob: CrewMemberJob = {
      id,
      ...crewMemberJob,
      createdAt: new Date()
    };
    this.crewMemberJobs.set(id, newCrewMemberJob);
    return newCrewMemberJob;
  }

  async deleteCrewMemberJob(id: string): Promise<boolean> {
    return this.crewMemberJobs.delete(id);
  }

  // Resource CRUD
  async getResources(workspaceId: string): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter(resource => resource.workspaceId === workspaceId);
  }

  async getResource(id: string): Promise<Resource | undefined> {
    return this.resources.get(id);
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const id = crypto.randomUUID();
    const newResource: Resource = {
      id,
      ...resource,
      createdAt: new Date()
    };
    this.resources.set(id, newResource);
    return newResource;
  }

  async updateResource(id: string, resource: Partial<InsertResource>): Promise<Resource | undefined> {
    const existingResource = this.resources.get(id);
    if (!existingResource) return undefined;

    const updatedResource = { ...existingResource, ...resource };
    this.resources.set(id, updatedResource);
    return updatedResource;
  }

  async deleteResource(id: string): Promise<boolean> {
    return this.resources.delete(id);
  }

  // Show Category CRUD
  async getShowCategories(workspaceId: string): Promise<ShowCategory[]> {
    return Array.from(this.showCategories.values()).filter(category => category.workspaceId === workspaceId);
  }

  async getShowCategory(id: string): Promise<ShowCategory | undefined> {
    return this.showCategories.get(id);
  }

  async createShowCategory(showCategory: InsertShowCategory): Promise<ShowCategory> {
    const id = crypto.randomUUID();
    const newShowCategory: ShowCategory = {
      id,
      ...showCategory,
      createdAt: new Date()
    };
    this.showCategories.set(id, newShowCategory);
    return newShowCategory;
  }

  async updateShowCategory(id: string, showCategory: Partial<InsertShowCategory>): Promise<ShowCategory | undefined> {
    const existingShowCategory = this.showCategories.get(id);
    if (!existingShowCategory) return undefined;

    const updatedShowCategory = { ...existingShowCategory, ...showCategory };
    this.showCategories.set(id, updatedShowCategory);
    return updatedShowCategory;
  }

  async deleteShowCategory(id: string): Promise<boolean> {
    return this.showCategories.delete(id);
  }

  // Show CRUD
  async getShows(workspaceId: string): Promise<Show[]> {
    return Array.from(this.shows.values()).filter(show => show.workspaceId === workspaceId);
  }

  async getShowsInRange(workspaceId: string, startDate: Date, endDate: Date): Promise<Show[]> {
    return Array.from(this.shows.values()).filter(show => {
      return show.workspaceId === workspaceId && 
        ((show.startTime >= startDate && show.startTime <= endDate) || 
        (show.endTime >= startDate && show.endTime <= endDate) ||
        (show.startTime <= startDate && show.endTime >= endDate));
    });
  }

  async getShow(id: string): Promise<Show | undefined> {
    return this.shows.get(id);
  }

  async createShow(show: InsertShow): Promise<Show> {
    const id = crypto.randomUUID();
    const newShow: Show = {
      id,
      ...show,
      createdAt: new Date()
    };
    this.shows.set(id, newShow);
    return newShow;
  }

  async updateShow(id: string, show: Partial<InsertShow>): Promise<Show | undefined> {
    const existingShow = this.shows.get(id);
    if (!existingShow) return undefined;

    const updatedShow = { ...existingShow, ...show };
    this.shows.set(id, updatedShow);
    return updatedShow;
  }

  async deleteShow(id: string): Promise<boolean> {
    return this.shows.delete(id);
  }

  // Show Category Assignment CRUD
  async getShowCategoryAssignments(workspaceId: string): Promise<ShowCategoryAssignment[]> {
    return Array.from(this.showCategoryAssignments.values()).filter(assignment => assignment.workspaceId === workspaceId);
  }

  async getShowCategoryAssignmentsByShow(showId: string): Promise<ShowCategoryAssignment[]> {
    return Array.from(this.showCategoryAssignments.values()).filter(assignment => assignment.showId === showId);
  }

  async createShowCategoryAssignment(assignment: InsertShowCategoryAssignment): Promise<ShowCategoryAssignment> {
    const id = crypto.randomUUID();
    const newAssignment: ShowCategoryAssignment = {
      id,
      ...assignment,
      createdAt: new Date()
    };
    this.showCategoryAssignments.set(id, newAssignment);
    return newAssignment;
  }

  async deleteShowCategoryAssignment(id: string): Promise<boolean> {
    return this.showCategoryAssignments.delete(id);
  }

  // Required Job CRUD
  async getRequiredJobs(workspaceId: string): Promise<RequiredJob[]> {
    return Array.from(this.requiredJobs.values()).filter(requiredJob => requiredJob.workspaceId === workspaceId);
  }

  async getRequiredJobsByShow(showId: string): Promise<RequiredJob[]> {
    return Array.from(this.requiredJobs.values()).filter(requiredJob => requiredJob.showId === showId);
  }

  async createRequiredJob(requiredJob: InsertRequiredJob): Promise<RequiredJob> {
    const id = crypto.randomUUID();
    const newRequiredJob: RequiredJob = {
      id,
      ...requiredJob,
      createdAt: new Date()
    };
    this.requiredJobs.set(id, newRequiredJob);
    return newRequiredJob;
  }

  async updateRequiredJob(id: string, requiredJob: Partial<InsertRequiredJob>): Promise<RequiredJob | undefined> {
    const existingRequiredJob = this.requiredJobs.get(id);
    if (!existingRequiredJob) return undefined;

    const updatedRequiredJob = { ...existingRequiredJob, ...requiredJob };
    this.requiredJobs.set(id, updatedRequiredJob);
    return updatedRequiredJob;
  }

  async deleteRequiredJob(id: string): Promise<boolean> {
    return this.requiredJobs.delete(id);
  }

  // Show Resource CRUD
  async getShowResources(workspaceId: string): Promise<ShowResource[]> {
    return Array.from(this.showResources.values()).filter(showResource => showResource.workspaceId === workspaceId);
  }

  async getShowResourcesByShow(showId: string): Promise<ShowResource[]> {
    return Array.from(this.showResources.values()).filter(showResource => showResource.showId === showId);
  }

  async createShowResource(showResource: InsertShowResource): Promise<ShowResource> {
    const id = crypto.randomUUID();
    const newShowResource: ShowResource = {
      id,
      ...showResource,
      createdAt: new Date()
    };
    this.showResources.set(id, newShowResource);
    return newShowResource;
  }

  async deleteShowResource(id: string): Promise<boolean> {
    return this.showResources.delete(id);
  }

  // Crew Assignment CRUD
  async getCrewAssignments(workspaceId: string): Promise<CrewAssignment[]> {
    return Array.from(this.crewAssignments.values()).filter(assignment => assignment.workspaceId === workspaceId);
  }

  async getCrewAssignmentsByShow(showId: string): Promise<CrewAssignment[]> {
    return Array.from(this.crewAssignments.values()).filter(assignment => assignment.showId === showId);
  }

  async getCrewAssignmentsByCrewMember(crewMemberId: string): Promise<CrewAssignment[]> {
    return Array.from(this.crewAssignments.values()).filter(assignment => assignment.crewMemberId === crewMemberId);
  }

  async createCrewAssignment(crewAssignment: InsertCrewAssignment): Promise<CrewAssignment> {
    const id = crypto.randomUUID();
    const newCrewAssignment: CrewAssignment = {
      id,
      ...crewAssignment,
      createdAt: new Date()
    };
    this.crewAssignments.set(id, newCrewAssignment);
    return newCrewAssignment;
  }

  async updateCrewAssignment(id: string, crewAssignment: Partial<InsertCrewAssignment>): Promise<CrewAssignment | undefined> {
    const existingCrewAssignment = this.crewAssignments.get(id);
    if (!existingCrewAssignment) return undefined;

    const updatedCrewAssignment = { ...existingCrewAssignment, ...crewAssignment };
    this.crewAssignments.set(id, updatedCrewAssignment);
    return updatedCrewAssignment;
  }

  async deleteCrewAssignment(id: string): Promise<boolean> {
    return this.crewAssignments.delete(id);
  }

  // Crew Schedule CRUD
  async getCrewSchedules(workspaceId: string): Promise<CrewSchedule[]> {
    return Array.from(this.crewSchedules.values()).filter(schedule => schedule.workspaceId === workspaceId);
  }

  async getCrewSchedulesByCrewMember(crewMemberId: string): Promise<CrewSchedule[]> {
    return Array.from(this.crewSchedules.values()).filter(schedule => schedule.crewMemberId === crewMemberId);
  }

  async createCrewSchedule(crewSchedule: InsertCrewSchedule): Promise<CrewSchedule> {
    const id = crypto.randomUUID();
    const newCrewSchedule: CrewSchedule = {
      id,
      ...crewSchedule,
      createdAt: new Date()
    };
    this.crewSchedules.set(id, newCrewSchedule);
    return newCrewSchedule;
  }

  async updateCrewSchedule(id: string, crewSchedule: Partial<InsertCrewSchedule>): Promise<CrewSchedule | undefined> {
    const existingCrewSchedule = this.crewSchedules.get(id);
    if (!existingCrewSchedule) return undefined;

    const updatedCrewSchedule = { ...existingCrewSchedule, ...crewSchedule };
    this.crewSchedules.set(id, updatedCrewSchedule);
    return updatedCrewSchedule;
  }

  async deleteCrewSchedule(id: string): Promise<boolean> {
    return this.crewSchedules.delete(id);
  }

  // Crew Time Off CRUD
  async getCrewTimeOffs(workspaceId: string): Promise<CrewTimeOff[]> {
    return Array.from(this.crewTimeOffs.values()).filter(timeOff => timeOff.workspaceId === workspaceId);
  }

  async getCrewTimeOffsByCrewMember(crewMemberId: string): Promise<CrewTimeOff[]> {
    return Array.from(this.crewTimeOffs.values()).filter(timeOff => timeOff.crewMemberId === crewMemberId);
  }

  async createCrewTimeOff(crewTimeOff: InsertCrewTimeOff): Promise<CrewTimeOff> {
    const id = crypto.randomUUID();
    const newCrewTimeOff: CrewTimeOff = {
      id,
      ...crewTimeOff,
      createdAt: new Date()
    };
    this.crewTimeOffs.set(id, newCrewTimeOff);
    return newCrewTimeOff;
  }

  async updateCrewTimeOff(id: string, crewTimeOff: Partial<InsertCrewTimeOff>): Promise<CrewTimeOff | undefined> {
    const existingCrewTimeOff = this.crewTimeOffs.get(id);
    if (!existingCrewTimeOff) return undefined;

    const updatedCrewTimeOff = { ...existingCrewTimeOff, ...crewTimeOff };
    this.crewTimeOffs.set(id, updatedCrewTimeOff);
    return updatedCrewTimeOff;
  }

  async deleteCrewTimeOff(id: string): Promise<boolean> {
    return this.crewTimeOffs.delete(id);
  }

  // Notification CRUD
  async getNotifications(workspaceId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(notification => notification.workspaceId === workspaceId);
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(notification => notification.userId === userId);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = crypto.randomUUID();
    const newNotification: Notification = {
      id,
      ...notification,
      read: false,
      createdAt: new Date()
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const existingNotification = this.notifications.get(id);
    if (!existingNotification) return undefined;

    const updatedNotification = { ...existingNotification, read: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async deleteNotification(id: string): Promise<boolean> {
    return this.notifications.delete(id);
  }

  // Conflict detection
  async detectCrewConflicts(showId: string, crewMemberId: string): Promise<boolean> {
    const show = this.shows.get(showId);
    if (!show) return false;

    // Check other assignments for this crew member during the same time
    const conflictingAssignments = Array.from(this.crewAssignments.values()).filter(assignment => {
      if (assignment.crewMemberId !== crewMemberId) return false;
      if (assignment.showId === showId) return false;

      const assignedShow = this.shows.get(assignment.showId);
      if (!assignedShow) return false;

      // Check for overlap
      return (
        (show.startTime <= assignedShow.endTime && show.endTime >= assignedShow.startTime)
      );
    });

    // Check time off
    const conflictingTimeOff = Array.from(this.crewTimeOffs.values()).filter(timeOff => {
      if (timeOff.crewMemberId !== crewMemberId) return false;

      // Check for overlap
      return (
        (show.startTime <= timeOff.endTime && show.endTime >= timeOff.startTime)
      );
    });

    return conflictingAssignments.length > 0 || conflictingTimeOff.length > 0;
  }

  async detectResourceConflicts(showId: string, resourceId: string): Promise<boolean> {
    const show = this.shows.get(showId);
    if (!show) return false;

    // Check other resource assignments during the same time
    const conflictingResourceAssignments = Array.from(this.showResources.values()).filter(sr => {
      if (sr.resourceId !== resourceId) return false;
      if (sr.showId === showId) return false;

      const assignedShow = this.shows.get(sr.showId);
      if (!assignedShow) return false;

      // Check for overlap
      return (
        (show.startTime <= assignedShow.endTime && show.endTime >= assignedShow.startTime)
      );
    });

    return conflictingResourceAssignments.length > 0;
  }
}

export const storage = new MemStorage();
