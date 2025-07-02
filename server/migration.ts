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
  type Show,
  type Production,
  type ShowTemplate,
  type ScheduledEvent
} from "../shared/schema";
import { eq, sql } from "drizzle-orm";

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

    for (const [productionName, showGroup] of Array.from(productionGroups.entries())) {
      await this.migrateProductionGroup(workspaceId, productionName, showGroup);
    }

    console.log("✅ Migration completed successfully");
  }

  /**
   * Group legacy shows by production concept (similar titles/descriptions)
   */
  private groupShowsByProduction(shows: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    
    for (const show of shows) {
      const productionName = this.extractProductionName(show.title);
      if (!groups.has(productionName)) {
        groups.set(productionName, []);
      }
      groups.get(productionName)!.push(show);
    }
    
    return groups;
  }

  /**
   * Extract production name from show title
   */
  private extractProductionName(title: string): string {
    // Simple extraction: remove dates, episode numbers, etc.
    return title.replace(/\s+\d{4}-\d{2}-\d{2}.*/, '')
               .replace(/\s+Episode\s+\d+.*/, '')
               .replace(/\s+#\d+.*/, '')
               .trim();
  }

  /**
   * Migrate a group of shows that belong to the same production
   */
  private async migrateProductionGroup(
    workspaceId: string,
    productionName: string,
    shows: any[]
  ): Promise<void> {
    console.log(`📺 Creating production: ${productionName}`);

    // Create the production
    const [production] = await db
      .insert(productions)
      .values({
        workspaceId,
        name: productionName,
        description: `Migrated from ${shows.length} legacy shows`,
        color: shows[0]?.color || "#3b82f6",
      })
      .returning();

    // Analyze shows to determine structure
    const recurringShows = shows.filter(show => show.recurringPattern);
    const oneOffShows = shows.filter(show => !show.recurringPattern);

    if (recurringShows.length > 0) {
      await this.createTemplateBasedStructure(production, recurringShows, oneOffShows);
    } else {
      await this.createDirectEvents(production, oneOffShows);
    }
  }

  /**
   * Create template-based structure for recurring shows
   */
  private async createTemplateBasedStructure(
    production: any,
    recurringShows: any[],
    oneOffShows: any[]
  ): Promise<void> {
    // Group recurring shows by pattern
    const patternGroups = new Map<string, any[]>();
    
    for (const show of recurringShows) {
      const pattern = show.recurringPattern || "none";
      if (!patternGroups.has(pattern)) {
        patternGroups.set(pattern, []);
      }
      patternGroups.get(pattern)!.push(show);
    }

    // Create templates for each pattern
    for (const [pattern, shows] of Array.from(patternGroups.entries())) {
      if (shows.length === 1) {
        // Single show - create as direct event
        await this.createDirectEvents(production, shows);
      } else {
        // Create template and events
        await this.createTemplateWithEvents(production, pattern, shows);
      }
    }

    // Create direct events for one-offs
    if (oneOffShows.length > 0) {
      await this.createDirectEvents(production, oneOffShows);
    }
  }

  /**
   * Create a show template with its associated events
   */
  private async createTemplateWithEvents(
    production: any,
    pattern: string,
    shows: any[],
  ): Promise<void> {
    const firstShow = shows[0];
    const duration = Math.round(
      (new Date(firstShow.endTime).getTime() -
        new Date(firstShow.startTime).getTime()) /
        (1000 * 60),
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

    console.log(`📋 Created template: ${template.name}`);

    // Create scheduled events for each show
    for (const show of shows) {
      await this.createScheduledEvent(production, template, show);
    }
  }

  /**
   * Create direct events without templates
   */
  private async createDirectEvents(
    production: any,
    shows: any[]
  ): Promise<void> {
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
    legacyShow: any,
  ): Promise<void> {
    const [event] = await db
      .insert(scheduledEvents)
      .values({
        workspaceId: production.workspaceId,
        productionId: production.id,
        templateId: template?.id || null,
        title: legacyShow.title,
        description: legacyShow.description,
        startTime: legacyShow.startTime,
        endTime: legacyShow.endTime,
        notes: legacyShow.notes,
        status: legacyShow.status,
        color: legacyShow.color,
      })
      .returning();

    console.log(`📅 Created event: ${event.title}`);
  }

  /**
   * Check if a workspace has been migrated
   */
  async isWorkspaceMigrated(workspaceId: string): Promise<boolean> {
    const productionsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(productions)
      .where(eq(productions.workspaceId, workspaceId));

    return (productionsCount[0]?.count || 0) > 0;
  }

  /**
   * Auto-migrate workspace if needed
   */
  async autoMigrateIfNeeded(workspaceId: string): Promise<void> {
    const isMigrated = await this.isWorkspaceMigrated(workspaceId);
    if (!isMigrated) {
      await this.migrateWorkspace(workspaceId);
    }
  }
}

export const migration = new ArchitectureMigration();