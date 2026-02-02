export interface DifficultyConfig {
  enemySpawnRate: number; // Probability (0-1) of spawning enemy at position
  itemSpawnRate: number; // Probability (0-1) of spawning item at position
}

export const DIFFICULTY_CONFIGS: Record<
  "easy" | "medium" | "hard",
  DifficultyConfig
> = {
  easy: {
    enemySpawnRate: 0.6,
    itemSpawnRate: 0.3,
  },
  medium: {
    enemySpawnRate: 0.7,
    itemSpawnRate: 0.2,
  },
  hard: {
    enemySpawnRate: 0.8,
    itemSpawnRate: 0.1,
  },
};
