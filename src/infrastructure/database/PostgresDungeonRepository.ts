import { Pool, QueryResult } from "pg";
import { Dungeon } from "../../domain/entities/Dungeon";
import { DungeonRepository } from "../../domain/repositories/DungeonRepository";

interface DungeonRow {
  id: string;
  seed: string;
  size: number;
  difficulty: "easy" | "medium" | "hard";
  enemies: Record<string, string[]>;
  items: Record<string, string[]>;
  paths: Record<string, string[]>;
  created_at: Date;
}

export class PostgresDungeonRepository implements DungeonRepository {
  constructor(private readonly pool: Pool) {}

  async getAll(): Promise<Dungeon[]> {
    const result: QueryResult<DungeonRow> = await this.pool.query(
      "SELECT * FROM dungeons ORDER BY created_at DESC"
    );
    return result.rows.map(this.mapRow);
  }

  async getById(id: string): Promise<Dungeon | null> {
    const result: QueryResult<DungeonRow> = await this.pool.query(
      "SELECT * FROM dungeons WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRow(result.rows[0]);
  }

  async create(
    input: Omit<Dungeon, "id" | "createdAt">
  ): Promise<Dungeon> {
    const id = Math.random().toString(36).substr(2, 9);
    const result: QueryResult<DungeonRow> = await this.pool.query(
      "INSERT INTO dungeons (id, seed, size, difficulty, enemies, items, paths) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        id,
        input.seed,
        input.size,
        input.difficulty,
        JSON.stringify(input.enemies),
        JSON.stringify(input.items),
        JSON.stringify(input.paths),
      ]
    );

    return this.mapRow(result.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query("DELETE FROM dungeons WHERE id = $1", [
      id,
    ]);
    return (result.rowCount ?? 0) > 0;
  }

  private mapRow(row: DungeonRow): Dungeon {
    return {
      id: row.id,
      seed: row.seed,
      size: row.size,
      difficulty: row.difficulty,
      enemies: row.enemies,
      items: row.items,
      paths: row.paths,
      createdAt: row.created_at,
    };
  }
}
