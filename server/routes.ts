import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertWorkspaceSchema,
  workspaceInviteSchema,
  insertUserSchema,
  insertCrewMemberSchema,
  insertJobSchema,
  insertCrewMemberJobSchema,
  insertResourceSchema,
  insertShowSchema,
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

  app.get("/api/workspaces/recent", async (req, res) => {
    const workspace = await storage.getMostRecentWorkspace();
    if (!workspace) {
      return res.status(404).json({ message: "No workspaces found" });
    }
    res.json(workspace);
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

  app.patch("/api/workspaces/:id/access", async (req, res) => {
    try {
      await storage.updateWorkspaceLastAccessed(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update workspace access" });
    }
  });

  app.delete("/api/workspaces/:id", async (req, res) => {
    try {
      const success = await storage.deleteWorkspace(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete workspace" });
    }
  });

  // Users
  app.get("/api/workspaces/:workspaceId/users", async (req, res) => {
    const users = await storage.getUsers(req.params.workspaceId);
    res.json(users);
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

  app.patch("/api/crew-members/:id", async (req, res) => {
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

  app.delete("/api/crew-members/:id", async (req, res) => {
    try {
      const success = await storage.deleteCrewMember(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Crew member not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete crew member" });
    }
  });

  // Jobs
  app.get("/api/workspaces/:workspaceId/jobs", async (req, res) => {
    const jobs = await storage.getJobs(req.params.workspaceId);
    res.json(jobs);
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

  app.patch("/api/jobs/:id", async (req, res) => {
    try {
      const validation = insertJobSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid job data", errors: validation.error.errors });
      }
      const job = await storage.updateJob(req.params.id, validation.data);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.delete("/api/jobs/:id", async (req, res) => {
    try {
      const success = await storage.deleteJob(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Resources
  app.get("/api/workspaces/:workspaceId/resources", async (req, res) => {
    const resources = await storage.getResources(req.params.workspaceId);
    res.json(resources);
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

  app.patch("/api/resources/:id", async (req, res) => {
    try {
      const validation = insertResourceSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid resource data", errors: validation.error.errors });
      }
      const resource = await storage.updateResource(req.params.id, validation.data);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      res.json(resource);
    } catch (error) {
      res.status(500).json({ message: "Failed to update resource" });
    }
  });

  app.delete("/api/resources/:id", async (req, res) => {
    try {
      const success = await storage.deleteResource(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Resource not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete resource" });
    }
  });

  // Shows - now with simple labels instead of categories
  app.get("/api/workspaces/:workspaceId/shows", async (req, res) => {
    const { start, end } = req.query;
    if (start && end) {
      const shows = await storage.getShowsInRange(req.params.workspaceId, new Date(start as string), new Date(end as string));
      res.json(shows);
    } else {
      const shows = await storage.getShows(req.params.workspaceId);
      res.json(shows);
    }
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
      // Create a custom schema for update that handles string dates
      const updateShowSchema = insertShowSchema.partial().extend({
        startTime: z.union([z.date(), z.string().transform(str => new Date(str))]).optional(),
        endTime: z.union([z.date(), z.string().transform(str => new Date(str))]).optional(),
      });
      
      const validation = updateShowSchema.safeParse(req.body);
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

  app.delete("/api/shows/:id", async (req, res) => {
    try {
      const success = await storage.deleteShow(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Show not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete show" });
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

  app.delete("/api/required-jobs/:id", async (req, res) => {
    try {
      const success = await storage.deleteRequiredJob(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Required job not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete required job" });
    }
  });

  // Crew Assignments
  app.get("/api/shows/:showId/crew-assignments", async (req, res) => {
    const assignments = await storage.getCrewAssignmentsByShow(req.params.showId);
    res.json(assignments);
  });

  app.put("/api/shows/:showId/crew-assignments", async (req, res) => {
    try {
      const { assignments } = req.body;
      const success = await storage.replaceCrewAssignmentsForShow(req.params.showId, assignments);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Failed to update crew assignments" });
    }
  });

  // Notifications
  app.get("/api/users/:userId/notifications", async (req, res) => {
    const notifications = await storage.getNotificationsByUser(req.params.userId);
    res.json(notifications);
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Demo data management
  app.post("/api/demo/clear", async (req, res) => {
    try {
      await storage.clearDemoData();
      res.json({ message: "Demo data cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear demo data" });
    }
  });

  app.post("/api/demo/seed", async (req, res) => {
    try {
      await storage.seedDemoData();
      res.json({ message: "Demo data seeded successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to seed demo data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}