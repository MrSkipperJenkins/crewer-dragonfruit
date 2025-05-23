import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertWorkspaceSchema,
  insertUserSchema,
  insertCrewMemberSchema,
  insertJobSchema,
  insertCrewMemberJobSchema,
  insertResourceSchema,
  insertShowCategorySchema,
  insertShowSchema,
  insertShowCategoryAssignmentSchema,
  insertRequiredJobSchema,
  insertShowResourceSchema,
  insertCrewAssignmentSchema,
  insertCrewScheduleSchema,
  insertCrewTimeOffSchema,
  insertNotificationSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Workspaces
  app.get("/api/workspaces", async (req, res) => {
    const workspaces = await storage.getWorkspaces();
    res.json(workspaces);
  });

  app.get("/api/workspaces/:id", async (req, res) => {
    const workspace = await storage.getWorkspace(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    res.json(workspace);
  });

  app.post("/api/workspaces", async (req, res) => {
    try {
      const validation = insertWorkspaceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid workspace data", errors: validation.error.errors });
      }
      const workspace = await storage.createWorkspace(validation.data);
      res.status(201).json(workspace);
    } catch (error) {
      res.status(500).json({ message: "Failed to create workspace" });
    }
  });

  app.put("/api/workspaces/:id", async (req, res) => {
    try {
      const validation = insertWorkspaceSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid workspace data", errors: validation.error.errors });
      }
      const workspace = await storage.updateWorkspace(req.params.id, validation.data);
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      res.json(workspace);
    } catch (error) {
      res.status(500).json({ message: "Failed to update workspace" });
    }
  });

  app.delete("/api/workspaces/:id", async (req, res) => {
    const success = await storage.deleteWorkspace(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    res.status(204).end();
  });

  // Users
  app.get("/api/workspaces/:workspaceId/users", async (req, res) => {
    const users = await storage.getUsers(req.params.workspaceId);
    res.json(users);
  });

  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid user data", errors: validation.error.errors });
      }
      const user = await storage.createUser(validation.data);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Crew Members
  app.get("/api/workspaces/:workspaceId/crew-members", async (req, res) => {
    const crewMembers = await storage.getCrewMembers(req.params.workspaceId);
    res.json(crewMembers);
  });

  app.get("/api/crew-members/:id", async (req, res) => {
    const crewMember = await storage.getCrewMember(req.params.id);
    if (!crewMember) {
      return res.status(404).json({ message: "Crew member not found" });
    }
    res.json(crewMember);
  });

  app.post("/api/crew-members", async (req, res) => {
    try {
      const validation = insertCrewMemberSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid crew member data", errors: validation.error.errors });
      }
      const crewMember = await storage.createCrewMember(validation.data);
      res.status(201).json(crewMember);
    } catch (error) {
      res.status(500).json({ message: "Failed to create crew member" });
    }
  });

  app.put("/api/crew-members/:id", async (req, res) => {
    try {
      const validation = insertCrewMemberSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid crew member data", errors: validation.error.errors });
      }
      const crewMember = await storage.updateCrewMember(req.params.id, validation.data);
      if (!crewMember) {
        return res.status(404).json({ message: "Crew member not found" });
      }
      res.json(crewMember);
    } catch (error) {
      res.status(500).json({ message: "Failed to update crew member" });
    }
  });

  // Jobs
  app.get("/api/workspaces/:workspaceId/jobs", async (req, res) => {
    const jobs = await storage.getJobs(req.params.workspaceId);
    res.json(jobs);
  });

  app.get("/api/jobs/:id", async (req, res) => {
    const job = await storage.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  });

  app.post("/api/jobs", async (req, res) => {
    try {
      const validation = insertJobSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid job data", errors: validation.error.errors });
      }
      const job = await storage.createJob(validation.data);
      res.status(201).json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  // Crew Member Jobs
  app.get("/api/crew-members/:crewMemberId/jobs", async (req, res) => {
    const crewMemberJobs = await storage.getCrewMemberJobsByCrewMember(req.params.crewMemberId);
    res.json(crewMemberJobs);
  });

  app.post("/api/crew-member-jobs", async (req, res) => {
    try {
      const validation = insertCrewMemberJobSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid crew member job data", errors: validation.error.errors });
      }
      const crewMemberJob = await storage.createCrewMemberJob(validation.data);
      res.status(201).json(crewMemberJob);
    } catch (error) {
      res.status(500).json({ message: "Failed to create crew member job" });
    }
  });

  // Resources
  app.get("/api/workspaces/:workspaceId/resources", async (req, res) => {
    const resources = await storage.getResources(req.params.workspaceId);
    res.json(resources);
  });

  app.get("/api/resources/:id", async (req, res) => {
    const resource = await storage.getResource(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    res.json(resource);
  });

  app.post("/api/resources", async (req, res) => {
    try {
      const validation = insertResourceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid resource data", errors: validation.error.errors });
      }
      const resource = await storage.createResource(validation.data);
      res.status(201).json(resource);
    } catch (error) {
      res.status(500).json({ message: "Failed to create resource" });
    }
  });

  // Show Categories
  app.get("/api/workspaces/:workspaceId/show-categories", async (req, res) => {
    const categories = await storage.getShowCategories(req.params.workspaceId);
    res.json(categories);
  });

  app.post("/api/show-categories", async (req, res) => {
    try {
      const validation = insertShowCategorySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid show category data", errors: validation.error.errors });
      }
      const category = await storage.createShowCategory(validation.data);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create show category" });
    }
  });

  // Shows
  app.get("/api/workspaces/:workspaceId/shows", async (req, res) => {
    const { start, end } = req.query;
    
    if (start && end) {
      const startDate = new Date(start as string);
      const endDate = new Date(end as string);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid date range" });
      }
      
      const shows = await storage.getShowsInRange(req.params.workspaceId, startDate, endDate);
      return res.json(shows);
    }
    
    const shows = await storage.getShows(req.params.workspaceId);
    res.json(shows);
  });

  app.get("/api/shows/:id", async (req, res) => {
    const show = await storage.getShow(req.params.id);
    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }
    res.json(show);
  });

  app.post("/api/shows", async (req, res) => {
    try {
      const validation = insertShowSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid show data", errors: validation.error.errors });
      }
      const show = await storage.createShow(validation.data);
      res.status(201).json(show);
    } catch (error) {
      res.status(500).json({ message: "Failed to create show" });
    }
  });

  app.put("/api/shows/:id", async (req, res) => {
    try {
      const validation = insertShowSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid show data", errors: validation.error.errors });
      }
      const show = await storage.updateShow(req.params.id, validation.data);
      if (!show) {
        return res.status(404).json({ message: "Show not found" });
      }
      res.json(show);
    } catch (error) {
      res.status(500).json({ message: "Failed to update show" });
    }
  });

  // Show Categories Assignments
  app.get("/api/shows/:showId/categories", async (req, res) => {
    const assignments = await storage.getShowCategoryAssignmentsByShow(req.params.showId);
    res.json(assignments);
  });

  app.post("/api/show-category-assignments", async (req, res) => {
    try {
      const validation = insertShowCategoryAssignmentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid assignment data", errors: validation.error.errors });
      }
      const assignment = await storage.createShowCategoryAssignment(validation.data);
      res.status(201).json(assignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category assignment" });
    }
  });

  // Required Jobs
  app.get("/api/shows/:showId/required-jobs", async (req, res) => {
    const requiredJobs = await storage.getRequiredJobsByShow(req.params.showId);
    res.json(requiredJobs);
  });

  app.post("/api/required-jobs", async (req, res) => {
    try {
      const validation = insertRequiredJobSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid required job data", errors: validation.error.errors });
      }
      const requiredJob = await storage.createRequiredJob(validation.data);
      res.status(201).json(requiredJob);
    } catch (error) {
      res.status(500).json({ message: "Failed to create required job" });
    }
  });

  // Show Resources
  app.get("/api/shows/:showId/resources", async (req, res) => {
    const showResources = await storage.getShowResourcesByShow(req.params.showId);
    res.json(showResources);
  });

  app.post("/api/show-resources", async (req, res) => {
    try {
      const validation = insertShowResourceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid show resource data", errors: validation.error.errors });
      }
      
      // Check for resource conflicts
      const { showId, resourceId } = validation.data;
      const hasConflict = await storage.detectResourceConflicts(showId, resourceId);
      
      if (hasConflict) {
        return res.status(409).json({ message: "Resource has scheduling conflict" });
      }
      
      const showResource = await storage.createShowResource(validation.data);
      res.status(201).json(showResource);
    } catch (error) {
      res.status(500).json({ message: "Failed to assign resource to show" });
    }
  });

  // Crew Assignments
  app.get("/api/shows/:showId/crew-assignments", async (req, res) => {
    const assignments = await storage.getCrewAssignmentsByShow(req.params.showId);
    res.json(assignments);
  });

  app.get("/api/crew-members/:crewMemberId/assignments", async (req, res) => {
    const assignments = await storage.getCrewAssignmentsByCrewMember(req.params.crewMemberId);
    res.json(assignments);
  });

  app.post("/api/crew-assignments", async (req, res) => {
    try {
      const validation = insertCrewAssignmentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid crew assignment data", errors: validation.error.errors });
      }
      
      // Check for crew conflicts
      const { showId, crewMemberId } = validation.data;
      const hasConflict = await storage.detectCrewConflicts(showId, crewMemberId);
      
      if (hasConflict) {
        return res.status(409).json({ message: "Crew member has scheduling conflict" });
      }
      
      const assignment = await storage.createCrewAssignment(validation.data);
      res.status(201).json(assignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create crew assignment" });
    }
  });

  app.put("/api/crew-assignments/:id", async (req, res) => {
    try {
      const validation = insertCrewAssignmentSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid crew assignment data", errors: validation.error.errors });
      }
      const assignment = await storage.updateCrewAssignment(req.params.id, validation.data);
      if (!assignment) {
        return res.status(404).json({ message: "Crew assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update crew assignment" });
    }
  });

  // Crew Schedules
  app.get("/api/crew-members/:crewMemberId/schedules", async (req, res) => {
    const schedules = await storage.getCrewSchedulesByCrewMember(req.params.crewMemberId);
    res.json(schedules);
  });

  app.post("/api/crew-schedules", async (req, res) => {
    try {
      const validation = insertCrewScheduleSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid crew schedule data", errors: validation.error.errors });
      }
      const schedule = await storage.createCrewSchedule(validation.data);
      res.status(201).json(schedule);
    } catch (error) {
      res.status(500).json({ message: "Failed to create crew schedule" });
    }
  });

  // Crew Time Off
  app.get("/api/crew-members/:crewMemberId/time-off", async (req, res) => {
    const timeOffs = await storage.getCrewTimeOffsByCrewMember(req.params.crewMemberId);
    res.json(timeOffs);
  });

  app.post("/api/crew-time-off", async (req, res) => {
    try {
      const validation = insertCrewTimeOffSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid time off data", errors: validation.error.errors });
      }
      const timeOff = await storage.createCrewTimeOff(validation.data);
      res.status(201).json(timeOff);
    } catch (error) {
      res.status(500).json({ message: "Failed to create time off" });
    }
  });

  // Notifications
  app.get("/api/users/:userId/notifications", async (req, res) => {
    const notifications = await storage.getNotificationsByUser(req.params.userId);
    res.json(notifications);
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const validation = insertNotificationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid notification data", errors: validation.error.errors });
      }
      const notification = await storage.createNotification(validation.data);
      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    const notification = await storage.markNotificationAsRead(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json(notification);
  });

  // For testing connection
  app.get("/api/status", (req, res) => {
    res.json({ status: "ok" });
  });

  const httpServer = createServer(app);

  return httpServer;
}
