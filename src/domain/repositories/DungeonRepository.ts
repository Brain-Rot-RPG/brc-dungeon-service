import { Dungeon } from "../entities/Dungeon";

export interface DungeonRepository {
  getAll(): Promise<Dungeon[]>;
  getById(id: number): Promise<Dungeon | null>;
  create(dungeon: Omit<Dungeon, "id" | "createdAt">): Promise<Dungeon>;
  delete(id: number): Promise<boolean>;
}
