import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertWorkspaceSchema,
  insertUserSchema,
  insertCrewMemberSchema,
  insertJobSchema,
  insertResourceSchema,
  insertNotificationSchema,
  // New 3-tier schemas
  insertProductionSchema,
  insertShowTemplateSchema,
  insertEventSchema,
  insertTemplateRequiredJobSchema,
  insertTemplateResourceSchema,
  insertEventCrewAssignmentSchema,
  insertEventResourceAssignmentSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Workspaces
  app.get("/api/workspaces", async (req, res) => {
    const workspaces = await storage.getWorkspaces();
    res.json(workspaces);
  });

  app.get("/api/workspaces/recent", async (req, res) => {
    try {
      const workspace = await storage.getMostRecentWorkspace();
      if (!workspace) {
        return res.status(404).json({ message: "No recent workspace found" });
      }
      res.json(workspace);
    } catch (error) {
      res.status(500).json({ message: "Failed to get recent workspace" });
    }
  });

  // Workspace slug validation (must come before /:id route)
  app.get("/api/workspaces/slug-check", async (req, res) => {
    const slug = req.query.slug as string;
    if (!slug) {
      return res.status(400).json({ message: "Slug parameter is required" });
    }

    try {
      const isAvailable = await storage.isWorkspaceSlugAvailable(slug);
      res.json({ available: isAvailable });
    } catch (error) {
      res.status(500).json({ message: "Failed to check slug availability" });
    }
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
        return res.status(400).json({
          message: "Invalid workspace data",
          errors: validation.error.errors,
        });
      }
      const workspace = await storage.createWorkspace(validation.data);
      res.status(201).json(workspace);
    } catch (error) {
      res.status(500).json({ message: "Failed to create workspace" });
    }
  });

  app.post("/api/workspaces/switch", async (req, res) => {
    try {
      const { workspaceSlug } = req.body;
      if (!workspaceSlug) {
        return res.status(400).json({ message: "Workspace slug is required" });
      }

      const workspace = await storage.getWorkspaceBySlug(workspaceSlug);
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }

      // Update last accessed timestamp
      await storage.updateWorkspaceLastAccessed(workspace.id);

      res.json({ success: true, workspace });
    } catch (error) {
      res.status(500).json({ message: "Failed to switch workspace" });
    }
  });

  // Workspace invitations - removed for now (missing schema)

  app.put("/api/workspaces/:id", async (req, res) => {
    try {
      const validation = insertWorkspaceSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid workspace data",
          errors: validation.error.errors,
        });
      }
      const workspace = await storage.updateWorkspace(
        req.params.id,
        validation.data,
      );
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
        return res.status(400).json({
          message: "Invalid user data",
          errors: validation.error.errors,
        });
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
        return res.status(400).json({
          message: "Invalid crew member data",
          errors: validation.error.errors,
        });
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
        return res.status(400).json({
          message: "Invalid crew member data",
          errors: validation.error.errors,
        });
      }
      const crewMember = await storage.updateCrewMember(
        req.params.id,
        validation.data,
      );
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
        return res.status(400).json({
          message: "Invalid job data",
          errors: validation.error.errors,
        });
      }
      const job = await storage.createJob(validation.data);
      res.status(201).json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  app.put("/api/jobs/:id", async (req, res) => {
    try {
      const validation = insertJobSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid job data",
          errors: validation.error.errors,
        });
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

  // Crew Member Jobs - Simplified approach using primaryJobId
  // Note: For now, we're using the primaryJobId field in crew members instead of a separate junction table

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
        return res.status(400).json({
          message: "Invalid resource data",
          errors: validation.error.errors,
        });
      }
      const resource = await storage.createResource(validation.data);
      res.status(201).json(resource);
    } catch (error) {
      res.status(500).json({ message: "Failed to create resource" });
    }
  });

  app.put("/api/resources/:id", async (req, res) => {
    try {
      const validation = insertResourceSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid resource data",
          errors: validation.error.errors,
        });
      }
      const resource = await storage.updateResource(
        req.params.id,
        validation.data,
      );
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



  // Productions (New 3-tier architecture)
  app.get("/api/workspaces/:workspaceId/productions", async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const productions = await storage.getProductions(workspaceId);
      res.json(productions);
    } catch (error) {
      console.error("Error fetching productions:", error);
      res.status(500).json({ error: "Failed to fetch productions" });
    }
  });

  app.post("/api/workspaces/:workspaceId/productions", async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const productionData = { ...req.body, workspaceId };
      const production = await storage.createProduction(productionData);
      res.status(201).json(production);
    } catch (error) {
      console.error("Error creating production:", error);
      res.status(500).json({ error: "Failed to create production" });
    }
  });

  app.put("/api/productions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const production = await storage.updateProduction(id, req.body);
      res.json(production);
    } catch (error) {
      console.error("Error updating production:", error);
      res.status(500).json({ error: "Failed to update production" });
    }
  });

  app.delete("/api/productions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduction(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting production:", error);
      res.status(500).json({ error: "Failed to delete production" });
    }
  });

  // Show Templates
  app.get("/api/workspaces/:workspaceId/show-templates", async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const templates = await storage.getShowTemplates(workspaceId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching show templates:", error);
      res.status(500).json({ error: "Failed to fetch show templates" });
    }
  });

  app.get("/api/productions/:productionId/show-templates", async (req, res) => {
    try {
      const { productionId } = req.params;
      const templates =
        await storage.getShowTemplatesByProduction(productionId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching production templates:", error);
      res.status(500).json({ error: "Failed to fetch production templates" });
    }
  });

  app.post("/api/workspaces/:workspaceId/show-templates", async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const templateData = { ...req.body, workspaceId };
      const template = await storage.createShowTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating show template:", error);
      res.status(500).json({ error: "Failed to create show template" });
    }
  });

  app.put("/api/show-templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.updateShowTemplate(id, req.body);
      res.json(template);
    } catch (error) {
      console.error("Error updating show template:", error);
      res.status(500).json({ error: "Failed to update show template" });
    }
  });

  app.delete("/api/show-templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteShowTemplate(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting show template:", error);
      res.status(500).json({ error: "Failed to delete show template" });
    }
  });

  // Scheduled Events
  // Scheduled Events - using events table instead
  app.get("/api/workspaces/:workspaceId/events", async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const events = await storage.getEvents(workspaceId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/workspaces/:workspaceId/events", async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const validation = insertEventSchema.safeParse({ ...req.body, workspaceId });
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid event data",
          errors: validation.error.errors,
        });
      }
      const event = await storage.createEvent(validation.data);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.put("/api/events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validation = insertEventSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid event data",
          errors: validation.error.errors,
        });
      }
      const event = await storage.updateEvent(id, validation.data);
      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEvent(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // Template Requirements
  app.get("/api/show-templates/:templateId/required-jobs", async (req, res) => {
    try {
      const { templateId } = req.params;
      const requiredJobs = await storage.getTemplateRequiredJobs(templateId);
      res.json(requiredJobs);
    } catch (error) {
      console.error("Error fetching template required jobs:", error);
      res.status(500).json({ error: "Failed to fetch template required jobs" });
    }
  });

  app.post(
    "/api/show-templates/:templateId/required-jobs",
    async (req, res) => {
      try {
        const { templateId } = req.params;
        const requiredJobData = { ...req.body, templateId };
        const requiredJob =
          await storage.createTemplateRequiredJob(requiredJobData);
        res.status(201).json(requiredJob);
      } catch (error) {
        console.error("Error creating template required job:", error);
        res
          .status(500)
          .json({ error: "Failed to create template required job" });
      }
    },
  );

  app.delete("/api/template-required-jobs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTemplateRequiredJob(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting template required job:", error);
      res.status(500).json({ error: "Failed to delete template required job" });
    }
  });

  app.get("/api/show-templates/:templateId/resources", async (req, res) => {
    try {
      const { templateId } = req.params;
      const resources = await storage.getTemplateResources(templateId);
      res.json(resources);
    } catch (error) {
      console.error("Error fetching template resources:", error);
      res.status(500).json({ error: "Failed to fetch template resources" });
    }
  });

  app.post("/api/show-templates/:templateId/resources", async (req, res) => {
    try {
      const { templateId } = req.params;
      const resourceData = { ...req.body, templateId };
      const resource = await storage.createTemplateResource(resourceData);
      res.status(201).json(resource);
    } catch (error) {
      console.error("Error creating template resource:", error);
      res.status(500).json({ error: "Failed to create template resource" });
    }
  });

  app.delete("/api/template-resources/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTemplateResource(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting template resource:", error);
      res.status(500).json({ error: "Failed to delete template resource" });
    }
  });

  // Event Assignments
  app.get(
    "/api/scheduled-events/:eventId/crew-assignments",
    async (req, res) => {
      try {
        const { eventId } = req.params;
        const assignments = await storage.getEventCrewAssignments(eventId);
        res.json(assignments);
      } catch (error) {
        console.error("Error fetching event crew assignments:", error);
        res
          .status(500)
          .json({ error: "Failed to fetch event crew assignments" });
      }
    },
  );

  app.post(
    "/api/scheduled-events/:eventId/crew-assignments",
    async (req, res) => {
      try {
        const { eventId } = req.params;
        const assignmentData = { ...req.body, eventId };
        const assignment =
          await storage.createEventCrewAssignment(assignmentData);
        res.status(201).json(assignment);
      } catch (error) {
        console.error("Error creating event crew assignment:", error);
        res
          .status(500)
          .json({ error: "Failed to create event crew assignment" });
      }
    },
  );

  app.get(
    "/api/scheduled-events/:eventId/resource-assignments",
    async (req, res) => {
      try {
        const { eventId } = req.params;
        const assignments = await storage.getEventResourceAssignments(eventId);
        res.json(assignments);
      } catch (error) {
        console.error("Error fetching event resource assignments:", error);
        res
          .status(500)
          .json({ error: "Failed to fetch event resource assignments" });
      }
    },
  );

  app.post(
    "/api/scheduled-events/:eventId/resource-assignments",
    async (req, res) => {
      try {
        const { eventId } = req.params;
        const assignmentData = { ...req.body, eventId };
        const assignment =
          await storage.createEventResourceAssignment(assignmentData);
        res.status(201).json(assignment);
      } catch (error) {
        console.error("Error creating event resource assignment:", error);
        res
          .status(500)
          .json({ error: "Failed to create event resource assignment" });
      }
    },
  );

  // Legacy Shows API - Updated to use Events
  app.get("/api/workspaces/:workspaceId/shows", async (req, res) => {
    // Map legacy shows API to events API
    const events = await storage.getEvents(req.params.workspaceId);
    res.json(events);
  });

  // Expand recurring shows into individual occurrences
  app.get("/api/shows/expand-recurring", async (req, res) => {
    try {
      const { workspaceId } = req.query;

      if (!workspaceId) {
        return res.status(400).json({
          message: "workspaceId parameter is required",
        });
      }

      // Return events in the expected format
      const events = await storage.getEvents(workspaceId as string);
      
      const transformedEvents = events.map((event) => ({
        id: event.id,
        parentId: event.templateId || "",
        title: event.title,
        description: event.description,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        status: event.status,
        color: event.color,
        workspaceId: event.workspaceId,
        recurringPattern: "",
        isRecurrence: false,
        notes: event.notes,
      }));

      res.json(transformedEvents);
    } catch (error) {
      console.error("Error expanding recurring events:", error);
      res.status(500).json({ message: "Failed to expand recurring events" });
    }
  });

  app.get("/api/shows/:id", async (req, res) => {
    const event = await storage.getEvent(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  });

  app.post("/api/shows", async (req, res) => {
    try {
      // Convert datetime-local strings to proper Date objects preserving local time
      const processedBody = {
        ...req.body,
        startTime: req.body.startTime
          ? new Date(req.body.startTime)
          : undefined,
        endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
      };

      const validation = insertEventSchema.safeParse(processedBody);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid event data",
          errors: validation.error.errors,
        });
      }

      const event = await storage.createEvent(validation.data);
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.put("/api/shows/:id", async (req, res) => {
    try {
      console.log("Event update request body:", req.body);

      // Handle date conversion for calendar drag-and-drop
      const processedBody = { ...req.body };
      if (
        processedBody.startTime &&
        typeof processedBody.startTime === "string"
      ) {
        processedBody.startTime = new Date(processedBody.startTime);
      }
      if (processedBody.endTime && typeof processedBody.endTime === "string") {
        processedBody.endTime = new Date(processedBody.endTime);
      }

      console.log("Processed update data:", processedBody);

      const validation = insertEventSchema.partial().safeParse(processedBody);
      if (!validation.success) {
        console.log("Validation errors:", validation.error.errors);
        return res.status(400).json({
          message: "Invalid event data",
          errors: validation.error.errors,
        });
      }

      console.log(
        "About to call storage.updateEvent with:",
        req.params.id,
        validation.data,
      );
      const event = await storage.updateEvent(req.params.id, validation.data);
      console.log("Storage.updateEvent returned:", event);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Event update error:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/shows/:id", async (req, res) => {
    try {
      const success = await storage.deleteEvent(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Show Categories Assignments - Legacy routes removed
  // These routes have been removed as show categories are no longer part of the 3-tier architecture





  // Crew Assignments - Legacy routes removed
  // These routes have been removed as crew assignments are now handled through event assignments in the 3-tier architecture

  // Batch update crew assignments and crew schedules - Legacy routes removed
  // These routes have been removed as they are now handled through event assignments in the 3-tier architecture



  // Notifications
  app.get("/api/users/:userId/notifications", async (req, res) => {
    const notifications = await storage.getNotifications(req.params.userId);
    res.json(notifications);
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const validation = insertNotificationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid notification data",
          errors: validation.error.errors,
        });
      }
      const notification = await storage.createNotification(validation.data);
      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    await storage.markNotificationAsRead(req.params.id);
    res.json({ success: true });
  });

  // Early Access Signups - Removed (not part of current architecture)

  // For testing connection
  app.get("/api/status", (req, res) => {
    res.json({ status: "ok" });
  });

  const httpServer = createServer(app);

  return httpServer;
}
