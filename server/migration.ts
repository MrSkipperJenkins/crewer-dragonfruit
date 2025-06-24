import { db } from "./db";
import { 
  shows, 
  productions, 
  showTemplates, 
  scheduledEvents,
  templateRequiredJobs,
  templateResources,
  eventCrewAssignments,
  eventResourceAssignments,
  requiredJobs,
  showResources,
  crewAssignments
} from "@/shared/schema";
import { eq } from "drizzle-orm";

/**
 * Migration utility to convert legacy shows data to new 3-tier architecture
 * Productions → Show Templates → Scheduled Events
 */
export class ArchitectureMigration {
  
  /**
   * Migrate a workspace from legacy shows to new 3-tier structure
   */
  async migrateWorkspace(workspaceId: string): Promise<void> {
    console.log(`🔄 Starting migration for workspace: ${workspaceId}`);
    
    // Get all shows for this workspace
    const legacyShows = await db
      .select()
      .from(shows)
      .where(eq(shows.workspaceId, workspaceId));
    
    if (legacyShows.length === 0) {
      console.log("✅ No legacy shows to migrate");
      return;
    }
    
    console.log(`📊 Found ${legacyShows.length} legacy shows to migrate`);
    
    // Group shows by title/concept to create productions
    const productionGroups = this.groupShowsByProduction(legacyShows);
    
    for (const [productionName, showGroup] of productionGroups.entries()) {
      await this.migrateProductionGroup(workspaceId, productionName, showGroup);
    }
    
    console.log("✅ Migration completed successfully");
  }
  
  /**
   * Group legacy shows by production concept (similar titles/descriptions)
   */
  private groupShowsByProduction(shows: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    
    shows.forEach(show => {
      // Use the base title as production name (remove dates, episode numbers)
      const productionName = this.extractProductionName(show.title);
      
      if (!groups.has(productionName)) {
        groups.set(productionName, []);
      }
      groups.get(productionName)!.push(show);
    });
    
    return groups;
  }
  
  /**
   * Extract production name from show title
   */
  private extractProductionName(title: string): string {
    // Remove common patterns like dates, episode numbers, etc.
    return title
      .replace(/\s*-\s*(Episode|Ep\.?)\s*\d+/i, '')
      .replace(/\s*-\s*\d{1,2}\/\d{1,2}\/\d{4}/i, '')
      .replace(/\s*\(\d{4}-\d{2}-\d{2}\)/i, '')
      .trim();
  }
  
  /**
   * Migrate a group of shows that belong to the same production
   */
  private async migrateProductionGroup(
    workspaceId: string,
    productionName: string,
    showGroup: any[]
  ): Promise<void> {
    console.log(`📺 Creating production: "${productionName}" with ${showGroup.length} shows`);
    
    // Create the production
    const [production] = await db
      .insert(productions)
      .values({
        name: productionName,
        description: showGroup[0].description,
        color: showGroup[0].color,
        workspaceId,
      })
      .returning();
    
    // Analyze the shows to determine if we need templates
    const hasRecurringPattern = showGroup.some(show => show.recurringPattern);
    
    if (hasRecurringPattern && showGroup.length > 1) {
      // Create template-based structure
      await this.createTemplateBasedStructure(production, showGroup);
    } else {
      // Create one-off events directly
      await this.createDirectEvents(production, showGroup);
    }
  }
  
  /**
   * Create template-based structure for recurring shows
   */
  private async createTemplateBasedStructure(production: any, showGroup: any[]): Promise<void> {
    // Group by recurring pattern
    const patternGroups = new Map<string, any[]>();
    
    showGroup.forEach(show => {
      const pattern = show.recurringPattern || 'one-off';
      if (!patternGroups.has(pattern)) {
        patternGroups.set(pattern, []);
      }
      patternGroups.get(pattern)!.push(show);
    });
    
    for (const [pattern, shows] of patternGroups.entries()) {
      if (pattern === 'one-off') {
        // Create direct events for one-off shows
        await this.createDirectEvents(production, shows);
      } else {
        // Create template and events
        await this.createTemplateWithEvents(production, pattern, shows);
      }
    }
  }
  
  /**
   * Create a show template with its associated events
   */
  private async createTemplateWithEvents(
    production: any,
    pattern: string,
    shows: any[]
  ): Promise<void> {
    const firstShow = shows[0];
    const duration = Math.round(
      (new Date(firstShow.endTime).getTime() - new Date(firstShow.startTime).getTime()) / (1000 * 60)
    );
    
    // Create the template
    const [template] = await db
      .insert(showTemplates)
      .values({
        productionId: production.id,
        name: `${production.name} Template`,
        description: firstShow.description,
        duration,
        recurringPattern: pattern,
        notes: firstShow.notes,
        color: firstShow.color,
        workspaceId: production.workspaceId,
      })
      .returning();
    
    // Migrate template requirements
    await this.migrateTemplateRequirements(template.id, firstShow.id, production.workspaceId);
    
    // Create scheduled events
    for (const show of shows) {
      await this.createScheduledEvent(production, template, show);
    }
  }
  
  /**
   * Create direct events without templates
   */
  private async createDirectEvents(production: any, shows: any[]): Promise<void> {
    for (const show of shows) {
      await this.createScheduledEvent(production, null, show);
    }
  }
  
  /**
   * Create a scheduled event from a legacy show
   */
  private async createScheduledEvent(
    production: any,
    template: any | null,
    legacyShow: any
  ): Promise<void> {
    const [event] = await db
      .insert(scheduledEvents)
      .values({
        templateId: template?.id || null,
        productionId: production.id,
        title: legacyShow.title,
        description: legacyShow.description,
        startTime: legacyShow.startTime,
        endTime: legacyShow.endTime,
        isException: legacyShow.isException,
        notes: legacyShow.notes,
        status: legacyShow.status,
        color: legacyShow.color,
        workspaceId: production.workspaceId,
      })
      .returning();
    
    // Migrate crew assignments
    await this.migrateEventCrewAssignments(event.id, legacyShow.id, production.workspaceId);
    
    // Migrate resource assignments
    await this.migrateEventResourceAssignments(event.id, legacyShow.id, production.workspaceId);
  }
  
  /**
   * Migrate template requirements from legacy required jobs
   */
  private async migrateTemplateRequirements(
    templateId: string,
    legacyShowId: string,
    workspaceId: string
  ): Promise<void> {
    // Get required jobs from legacy show
    const legacyRequiredJobs = await db
      .select()
      .from(requiredJobs)
      .where(eq(requiredJobs.showId, legacyShowId));
    
    // Create template required jobs
    for (const requiredJob of legacyRequiredJobs) {
      await db
        .insert(templateRequiredJobs)
        .values({
          templateId,
          jobId: requiredJob.jobId,
          quantity: 1,
          notes: requiredJob.notes,
          workspaceId,
        });
    }
    
    // Get required resources from legacy show
    const legacyShowResources = await db
      .select()
      .from(showResources)
      .where(eq(showResources.showId, legacyShowId));
    
    // Create template resources
    for (const showResource of legacyShowResources) {
      await db
        .insert(templateResources)
        .values({
          templateId,
          resourceId: showResource.resourceId,
          quantity: 1,
          workspaceId,
        });
    }
  }
  
  /**
   * Migrate crew assignments to event crew assignments
   */
  private async migrateEventCrewAssignments(
    eventId: string,
    legacyShowId: string,
    workspaceId: string
  ): Promise<void> {
    const legacyAssignments = await db
      .select()
      .from(crewAssignments)
      .where(eq(crewAssignments.showId, legacyShowId));
    
    for (const assignment of legacyAssignments) {
      await db
        .insert(eventCrewAssignments)
        .values({
          eventId,
          crewMemberId: assignment.crewMemberId,
          jobId: assignment.jobId,
          status: assignment.status,
          workspaceId,
        });
    }
  }
  
  /**
   * Migrate resource assignments to event resource assignments
   */
  private async migrateEventResourceAssignments(
    eventId: string,
    legacyShowId: string,
    workspaceId: string
  ): Promise<void> {
    const legacyResourceAssignments = await db
      .select()
      .from(showResources)
      .where(eq(showResources.showId, legacyShowId));
    
    for (const resourceAssignment of legacyResourceAssignments) {
      await db
        .insert(eventResourceAssignments)
        .values({
          eventId,
          resourceId: resourceAssignment.resourceId,
          quantity: 1,
          workspaceId,
        });
    }
  }
  
  /**
   * Check if a workspace has been migrated
   */
  async isWorkspaceMigrated(workspaceId: string): Promise<boolean> {
    const productionCount = await db
      .select({ count: 1 })
      .from(productions)
      .where(eq(productions.workspaceId, workspaceId));
    
    return productionCount.length > 0;
  }
  
  /**
   * Auto-migrate workspace if needed
   */
  async autoMigrateIfNeeded(workspaceId: string): Promise<void> {
    const isMigrated = await this.isWorkspaceMigrated(workspaceId);
    
    if (!isMigrated) {
      console.log(`🔄 Auto-migrating workspace ${workspaceId} to new architecture`);
      await this.migrateWorkspace(workspaceId);
    }
  }
}

export const migration = new ArchitectureMigration();