import { Dungeon, DungeonInput } from "../../domain/entities/Dungeon";
import { DungeonRepository } from "../../domain/repositories/DungeonRepository";
import { DungeonGenerator } from "../../domain/services/DungeonGenerator";
import { v4 as uuidv4 } from "uuid";
import { Pool } from "pg";

export class DungeonService {
  constructor(private readonly repository: DungeonRepository) {}

  async getAll(): Promise<Dungeon[]> {
    return this.repository.getAll();
  }

  async getById(id: number): Promise<Dungeon | null> {
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
    const enemies = DungeonGenerator.spawnEnemies(
      paths,
      input.difficulty,
      normalBrainrots,
      bossBrainrots
    );
    const occupiedPositions = new Set<string>(
      Object.values(enemies).flat()
    );
    const items = DungeonGenerator.spawnItems(
      paths,
      input.difficulty,
      itemIds,
      occupiedPositions
    );

    return this.repository.create({
      seed,
      size: input.size,
      difficulty: input.difficulty,
      enemies,
      items,
      paths,
    });
  }

  async delete(id: number): Promise<boolean> {
    return this.repository.delete(id);
  }

  private async fetchBrainrotIds(): Promise<{ normalBrainrots: string[]; bossBrainrots: string[] }> {
    try {
      const host = process.env.BRAINROT_DB_HOST || "localhost";
      const port = process.env.BRAINROT_DB_PORT || "5401";
      const pool = new Pool({
        host,
        port: parseInt(port, 10),
        database: "brc_brainrot",
        user: "brc_brainrot_user",
        password: "brc_brainrot_password",
      });

      const result = await pool.query("SELECT id, is_boss FROM brainrots ORDER BY id");
      const brainrots = result.rows as Array<{ id: number; is_boss: boolean }>;

      const normalBrainrots = brainrots.filter((b) => !b.is_boss).map((b) => String(b.id));
      const bossBrainrots = brainrots.filter((b) => b.is_boss).map((b) => String(b.id));

      await pool.end();

      return { normalBrainrots, bossBrainrots };
    } catch (error) {
      // eslint-disable-next-line no-console
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
      const host = process.env.ITEM_DB_HOST || "localhost";
      const port = process.env.ITEM_DB_PORT || "5409";
      const pool = new Pool({
        host,
        port: parseInt(port, 10),
        database: "brc_item",
        user: "brc_item_user",
        password: "brc_item_password",
      });

      const result = await pool.query("SELECT id FROM items ORDER BY id");
      const items = result.rows as Array<{ id: number }>;

      const itemIds = items.map((i) => String(i.id));
      await pool.end();

      return itemIds;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching item IDs:", error);
      // Fallback to hardcoded IDs if service is unavailable
      return ["1", "2", "3"];
    }
  }
}
