export interface Dungeon {
  id: number;
  seed: string;
  size: number;
  difficulty: "easy" | "medium" | "hard";
  enemies: Record<string, string[]>;
  items: Record<string, string[]>;
  paths: Record<string, string[]>;
  createdAt: Date;
}

export type Position = string;

export interface DungeonInput {
  seed?: string;
  size: number;
  difficulty: "easy" | "medium" | "hard";
}
