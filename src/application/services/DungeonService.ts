import { Dungeon, DungeonInput } from "../../domain/entities/Dungeon";
import { DungeonRepository } from "../../domain/repositories/DungeonRepository";
import { DungeonGenerator } from "../../domain/services/DungeonGenerator";
import { v4 as uuidv4 } from "uuid";

export class DungeonService {
  constructor(private readonly repository: DungeonRepository) {}

  async getAll(): Promise<Dungeon[]> {
    return this.repository.getAll();
  }

  async getById(id: string): Promise<Dungeon | null> {
    return this.repository.getById(id);
  }

  async create(input: DungeonInput): Promise<Dungeon> {
    const seed = input.seed || uuidv4();

    // Fetch real brainrot IDs from brainrot service database
    const { normalBrainrots, bossBrainrots } = await this.fetchBrainrotIds();
    // Fetch real item IDs from item service database
    const itemIds = await this.fetchItemIds();

    // Generate dungeon structure with real IDs
    const paths = DungeonGenerator.generatePaths(input.size);
    const enemies = DungeonGenerator.spawnEnemies(paths, input.difficulty, normalBrainrots, bossBrainrots);
    const items = DungeonGenerator.spawnItems(paths, input.difficulty, itemIds);

    return this.repository.create({
      seed,
      size: input.size,
      difficulty: input.difficulty,
      enemies,
      items,
      paths,
    });
  }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }

  private async fetchBrainrotIds(): Promise<{ normalBrainrots: string[]; bossBrainrots: string[] }> {
    try {
      // Use service name for Docker networking, fallback to localhost for local dev
      const host = process.env.BRAINROT_SERVICE_HOST || "localhost";
      const port = process.env.BRAINROT_SERVICE_PORT || "4001";
      const response = await fetch(`http://${host}:${port}/brainrots`);
      const data = await response.json();
      const brainrots = Array.isArray(data) ? data : [];
      
      console.log("[DungeonService] Fetched brainrots from database:", JSON.stringify(brainrots, null, 2));
      
      const normalBrainrots = brainrots.filter((b: any) => !b.isBoss).map((b: any) => b.id);
      const bossBrainrots = brainrots.filter((b: any) => b.isBoss).map((b: any) => b.id);
      
      console.log(`[DungeonService] Filtered ${normalBrainrots.length} normal brainrots:`, normalBrainrots);
      console.log(`[DungeonService] Filtered ${bossBrainrots.length} boss brainrots:`, bossBrainrots);
      
      return { normalBrainrots, bossBrainrots };
    } catch (error) {
      console.error("Error fetching brainrot IDs:", error);
      // Fallback to hardcoded IDs if service is unavailable
      return {
        normalBrainrots: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
        bossBrainrots: ["27", "67"]
      };
    }
  }

  private async fetchItemIds(): Promise<string[]> {
    try {
      // Use service name for Docker networking, fallback to localhost for local dev
      const host = process.env.ITEM_SERVICE_HOST || "localhost";
      const port = process.env.ITEM_SERVICE_PORT || "4009";
      const response = await fetch(`http://${host}:${port}/items`);
      const data = await response.json();
      const items = Array.isArray(data) ? data : [];
      
      console.log("[DungeonService] Fetched items from database:", JSON.stringify(items, null, 2));
      
      const itemIds = items.map((i: any) => i.id);
      console.log(`[DungeonService] Extracted ${itemIds.length} item IDs:`, itemIds);
      
      return itemIds;
    } catch (error) {
      console.error("Error fetching item IDs:", error);
      // Fallback to hardcoded IDs if service is unavailable
      return ["1", "2", "3"];
    }
  }
}
